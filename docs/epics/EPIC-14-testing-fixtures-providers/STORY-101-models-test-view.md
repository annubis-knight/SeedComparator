---
doc: STORY
id: STORY-101
epic: EPIC-14
title: Vue /models/test + capture fixture
status: done
version: 1.0.0
last_updated: 2026-05-02
priority: P1
requirements: [FR-062]
synced_with: [_epic.md, ../../REQUIREMENTS.md, ../../../PROGRESS.md]
---

# STORY-101 — Vue /models/test pour tester un modèle isolément + capturer la fixture

## 1. Analyse

L'utilisateur veut une vue dédiée pour tester chaque modèle en réel **un par un**, **sans batch** (pour économiser les coûts). Quand le test live réussit, la réponse est capturée comme fixture (mode `mock-real` peut alors la rejouer).

**Caractéristiques imposées** :
- 1 dropdown de modèles.
- 3 textareas A / B / C (mêmes pré-prompts par défaut que la vue génération).
- 1 seule `GenerationCard` réutilisée (pas de batch).
- Logs verbeux à chaque étape.
- Si fixture existe déjà → modal "Écraser ?" / "Garder l'ancien" / "Annuler".

**Choix** :
- Nouvel endpoint `POST /api/models/test` (vs réutiliser `/api/generate`) : on veut forcer le mode `live` pour la capture, et structurer la réponse différemment (status fixture).
- Endpoint complémentaire `GET /api/models/fixture-status` pour afficher des badges "fixture présente / absente" dans le dropdown.

## 2. Plan + critères d'acceptation

### Critères d'acceptation
- AC-1 : Page `app/pages/models/test.vue` accessible. Lien dans la nav (RailNav).
- AC-2 : Dropdown liste tous les modèles (depuis `useModels`), groupés par brand.
- AC-3 : 3 textareas A/B/C pré-remplies avec `PROMPT_PREFIX_A/B/C`. Bouton ↺ Reset.
- AC-4 : Une seule `GenerationCard` rendue. Avant tout test : carte `idle`. Pendant : `pending`. Après : `success` ou `failed`.
- AC-5 : Bouton "Tester en live (paie l'API)" déclenche `POST /api/models/test`.
- AC-6 : L'endpoint `/api/models/test` :
  - force le mode `live` (ignore le setting courant).
  - exécute UNE génération unique avec le prompt actif.
  - en succès : appelle `fixtureWriter.write()` qui écrit `nominal.json` + `nominal.png` (sha256 référencé).
  - si fixture existe et `overwrite=false` → renvoie 409 `{ fixtureExists: true }` sans écrire ni payer (vérif d'existence avant l'appel API… mais on doit appeler avant de vérifier ? Non, on vérifie l'existence AVANT l'appel — un seul aller-retour suffit pour décider si on confirme avec l'utilisateur).
- AC-7 : Modal `OverwriteFixtureModal` s'affiche côté client si `fixtureExists`, propose Écraser / Annuler. Sur Écraser → re-call `/api/models/test` avec `overwrite=true`.
- AC-8 : Endpoint `GET /api/models/fixture-status` renvoie `{ [modelId]: { hasFixture: boolean, capturedAt?: string } }`.
- AC-9 : Logs verbeux : sélection modèle, prompt envoyé, status HTTP, taille buffer, sha256 calculé, chemin fixture écrit, conflit fixture détecté.
- AC-10 : Lien "Voir fixture" sous la carte si fixture existe.

### Tâches techniques

1. **Red** : `tests/unit/server/fixtureWriter.test.ts`
   - `write()` crée le dossier + JSON + PNG, sha256 cohérent.
   - `exists()` true / false selon présence.
   - `read()` round-trip identique.
2. **Green** : `server/services/fixtureWriter.ts`.
3. **Green** : endpoints `server/api/models/test.post.ts` + `server/api/models/fixture-status.get.ts`.
4. **Green** : `app/pages/models/test.vue` + `app/components/ui/OverwriteFixtureModal.vue`.
5. **Green** : ajouter lien dans `RailNav.vue` (section nav globale, sous "Réglages").
6. **Self-review** + lint + tests + typecheck.

## 3. Tests fonctionnels

| Test | FR couvert |
|---|---|
| `fixtureWriter.test.ts > write + exists + read` | FR-062 |
| `fixtureWriter.test.ts > sha256 du PNG` | FR-062 |

## 4. Definition of Done

- [ ] AC-1 à AC-10 cochés.
- [ ] Tests passent.
- [ ] Lint + typecheck + build verts.
- [ ] Logs visibles à chaque étape.
- [ ] `_epic.md` + `PROGRESS.md` mis à jour.
