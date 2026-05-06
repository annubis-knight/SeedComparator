---
doc: STORY
id: STORY-103
epic: EPIC-14
title: Désactiver visuellement les modèles sans fixture en mode mock-real
status: done
version: 1.0.0
last_updated: 2026-05-02
priority: P1
requirements: [FR-064]
synced_with: [_epic.md, ../../REQUIREMENTS.md, ../../../PROGRESS.md]
---

# STORY-103 — Désactiver les modèles sans fixture en mode mock-real

## 1. Analyse

Avec STORY-100/101/102, l'utilisateur peut sélectionner n'importe quel modèle dans `/generate` même en mode `mock-real`. Si la fixture n'a pas été capturée, la génération échouera avec `ProviderError('invalid_request', 'fixture not found')`. Mauvaise UX : l'utilisateur découvre l'erreur après avoir lancé un batch.

**Solution** : reproduire le pattern existant FR-003 (modèles sans clé API en mode live → grisés). En mode `mock-real`, griser les modèles sans fixture, avec tooltip explicatif.

**Contraintes** :
- Pas de filtrage qui fait disparaître — `disabled` visuel.
- Le serveur connaît la liste des fixtures (via `fixtureWriter.fixtureExists`).
- Le serveur connaît le mode courant (via `providerMode.getProviderMode`).
- L'endpoint `/api/models` doit donc enrichir chaque modèle d'un `hasFixture: boolean`.

**Sémantique de `hasFixture`** :
| Mode | Valeur de `hasFixture` |
|---|---|
| `mock` | `true` (mock marche toujours) |
| `mock-real` | `true` si fixture présente sur disque, sinon `false` |
| `live` | `true` (la clé API est le vrai gate, déjà couvert par `hasApiKey`) |

Cohérent avec la logique existante : `hasApiKey` est déjà `true` en mock/mock-real (cf. STORY-100). On ne mélange pas les deux gates.

## 2. Plan + critères d'acceptation

### Critères d'acceptation
- AC-1 : `ModelDTO` (dans `shared/contracts.ts`) gagne un champ `hasFixture: boolean`.
- AC-2 : `/api/models` renvoie `hasFixture` calculé selon le mode courant et la présence sur disque.
- AC-3 : `ModelSelector.vue` grise et désactive (checkbox + opacity) les modèles avec `hasFixture=false`, avec un tooltip explicatif.
- AC-4 : Le composant continue de griser les modèles sans clé API (FR-003) — les deux conditions s'additionnent.
- AC-5 : Tests : unit composant ModelSelector + integration `/api/models`.

### Tâches techniques (TDD)
1. **Red** : test composant `ModelSelector.test.ts > grise les modèles sans fixture`.
2. **Red** : test integration `api.test.ts > /api/models renvoie hasFixture par modelId`.
3. **Green** : étendre `ModelDTO` dans `shared/contracts.ts`.
4. **Green** : adapter `server/api/models.get.ts` pour calculer `hasFixture` selon le mode + disque.
5. **Green** : adapter `app/components/session/ModelSelector.vue` (logique disable + tooltip).
6. **Self-review** + lint + tests + typecheck.

## 3. Definition of Done

- [ ] AC-1 à AC-5 cochés.
- [ ] Lint + typecheck verts.
- [ ] Tests passent.
- [ ] Doc mise à jour (REQUIREMENTS, EPIC, PROGRESS).
