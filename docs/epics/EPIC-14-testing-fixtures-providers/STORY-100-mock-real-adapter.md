---
doc: STORY
id: STORY-100
epic: EPIC-14
title: Mode provider mock-real + chargement fixture dans les adapters
status: done
version: 1.0.0
last_updated: 2026-05-02
priority: P1
requirements: [FR-061]
synced_with: [_epic.md, ../../REQUIREMENTS.md, ../../../PROGRESS.md]
---

# STORY-100 — Mode provider mock-real + chargement fixture

## 1. Analyse

Le projet a aujourd'hui un boolean `mockMode: boolean` qui pilote `getGenerator()`. On a besoin de 3 valeurs au lieu de 2 : `mock` (fictif), `mock-real` (rejoue fixture), `live` (appel réel).

**Inconnues** :
- Format fixture à standardiser : JSON métadonnées + binaire image séparé (sha256).
- Comportement quand fixture absente en mode `mock-real` : erreur explicite plutôt que fallback silencieux.

**Risques** :
- Refactor du boolean `mockMode` vers un type union touche `generate.post.ts` + `registry.ts` + tests existants. Il faut ne pas régresser sur les modes `mock` et `live` actuels.
- Le stockage des fixtures dans `tests/fixtures/providers/` doit être lisible en runtime (pas que dans les tests). Comme Nitro tourne depuis le projet root, la lecture relative `process.cwd() + 'tests/fixtures/...'` fonctionne en dev. En build, on devra packager le dossier ou bien le pointer via env.

## 2. Plan + critères d'acceptation

### Critères d'acceptation
- AC-1 : Le type `ProviderMode = 'mock' | 'mock-real' | 'live'` existe dans `shared/contracts.ts`, validé par Zod (`ProviderModeSchema`).
- AC-2 : `getGenerator(modelId, mode)` accepte les 3 valeurs et renvoie le bon générateur (mock / mock-real / live).
- AC-3 : Un nouveau provider `mockReal` lit `tests/fixtures/providers/<source>/<modelId>/nominal.json` + `nominal.png` voisin, et reconstruit un `GenerateOutput` identique à un appel live (rawResponse préservé byte-pour-byte).
- AC-4 : Si la fixture est absente, le provider mock-real renvoie une `ProviderError('invalid_request', 'fixture not found ...')` claire.
- AC-5 : Si le PNG est absent ou que sa taille/sha256 ne match pas, erreur explicite.
- AC-6 : Logs verbeux à chaque étape (resolve path, load JSON, load PNG, replay success).
- AC-7 : `apiKey` n'est jamais lu en mode mock-real (pas de leak via les logs).
- AC-8 : L'API `POST /api/generate` accepte/passe le mode courant à `getGenerator`.

### Tâches techniques (TDD)

1. **Red** : `tests/unit/server/providers/mockReal.test.ts`
   - fixture présente → output correct (modelId, source, costUsd, mime, rawResponse égal au JSON, buffer = PNG voisin).
   - fixture absente → ProviderError 'invalid_request'.
   - PNG voisin absent → ProviderError 'invalid_request'.
   - sha256 mismatch → ProviderError 'invalid_request'.
2. **Green** : implémenter `server/providers/mockReal.ts` qui :
   - charge le JSON via `fs.readFileSync` (sync car runtime court).
   - vérifie le sha256 du PNG.
   - renvoie un `GenerateOutput` complet.
3. **Green** : étendre `shared/contracts.ts` avec `ProviderModeSchema` + type `ProviderMode`.
4. **Green** : refactorer `server/providers/registry.ts`
   - 3 maps (`mockGenerators`, `mockRealGenerators`, `realGenerators`).
   - signature `getGenerator(modelId: string, mode: ProviderMode)`.
5. **Green** : refactorer `server/api/generate.post.ts` pour passer un `ProviderMode` au lieu d'un boolean.
6. **Refactor** : extraire `server/services/providerMode.ts` qui résout le mode courant (DB > env > 'live'). Pour cette story, juste lire `runtimeConfig.providersMode` (env). La DB sera ajoutée en STORY-102.
7. **Self-review** + lint + tests + typecheck.

## 3. Capture / format fixture

```
tests/fixtures/providers/<source>/<modelId>/
├── nominal.json    ← métadonnées + http body brut
└── nominal.png     ← image binaire, référencée par sha256
```

JSON :
```json
{
  "modelId": "gpt-image-1",
  "source": "openai",
  "scenario": "nominal",
  "input": { "prompt": "...", "ratio": "1:1" },
  "http": { "status": 200, "body": <raw provider response, image base64 enlevé> },
  "expected": {
    "mime": "image/png",
    "costUsd": 0.04,
    "seed": null,
    "imagePngSha256": "abc..."
  },
  "capturedAt": "2026-05-02T..."
}
```

## 4. Tests fonctionnels (à écrire)

| Test | FR couvert |
|---|---|
| `mockReal.test.ts > rejoue une fixture présente` | FR-061 |
| `mockReal.test.ts > erreur si fixture absente` | FR-061 |
| `mockReal.test.ts > erreur si PNG sha256 mismatch` | FR-061 |
| `contracts.test.ts > ProviderModeSchema accepte mock/mock-real/live` | FR-061 |
| `contracts.test.ts > ProviderModeSchema rejette autre valeur` | FR-061 |

## 5. Definition of Done

- [ ] Tous les critères d'acceptation cochés.
- [ ] Tests passent (Vitest).
- [ ] Lint + typecheck verts.
- [ ] Logs verbeux présents (resolve, load, success, errors).
- [ ] `_epic.md` à jour, `PROGRESS.md` à jour.
