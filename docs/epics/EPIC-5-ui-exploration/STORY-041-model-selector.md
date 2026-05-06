---
doc: STORY
id: STORY-041
title: Composant ModelSelector (groupé par source, désactivation sans clé)
epic: EPIC-5
status: done
priority: P0
requirements: [FR-007, FR-003]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-041 — ModelSelector

## Livré

- `app/components/session/ModelSelector.vue` : checkbox par modèle, groupage par source (OpenRouter / Fal.ai).
- Affichage du tarif / image et de l'icône `seed: ✓ / —`.
- Modèles `!hasApiKey || !enabled` : `opacity-40`, `disabled`, badge "clé manquante".

## Validation (3 tests)

```ts
// @requirement: FR-003 — grise les modèles sans clé API ✅
// @requirement: FR-007 — émet la nouvelle sélection au check ✅
// @requirement: FR-003 — affiche le badge "clé manquante" quand hasApiKey=false ✅
```

`tests/unit/components/ModelSelector.test.ts` : 3/3 ✅.

## Self-review

- [x] Aucun composable d'API appelé directement (le composant reçoit `models` en prop).
- [x] Préfixe `pathPrefix: false` configuré dans `nuxt.config.ts` pour qu'il soit utilisable sous `<ModelSelector />`.
