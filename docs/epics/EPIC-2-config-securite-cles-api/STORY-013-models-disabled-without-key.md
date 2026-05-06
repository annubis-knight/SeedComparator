---
doc: STORY
id: STORY-013
title: Désactivation visuelle des modèles sans clé
epic: EPIC-2
status: done
priority: P1
requirements: [FR-003]
version: 1.0.0
last_updated: 2026-04-28
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-013 — Modèles grisés sans clé

## Livré

- `server/api/models.get.ts` : enrichit chaque `ModelDTO` avec `hasApiKey: mockMode || providersWithKeys.has(m.providerId)`.
- `app/components/session/ModelSelector.vue` : applique `opacity-40` + `disabled` + badge "clé manquante" quand `!hasApiKey`.

## Validation (3 tests composant)

```ts
// @requirement: FR-003 — grise les modèles sans clé API ✅
// @requirement: FR-007 — émet la nouvelle sélection au check ✅
// @requirement: FR-003 — affiche le badge "clé manquante" quand hasApiKey=false ✅
```
3/3 ✅ dans `tests/unit/components/ModelSelector.test.ts`.
