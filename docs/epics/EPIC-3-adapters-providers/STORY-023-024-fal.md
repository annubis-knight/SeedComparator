---
doc: STORY
id: STORY-023-024
title: Adapter Fal.ai (3 modèles)
epic: EPIC-3
status: done
priority: P0
requirements: [FR-009, FR-016, FR-034]
version: 1.0.0
last_updated: 2026-04-28
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-023/024 — Adapter Fal.ai

## Livré

- `server/providers/fal.ts` : factory `createFalGenerator()` pour 3 modèles (flux-1.1-schnell, flux-1.1-pro, sd-3.5-large).
- Mapping ratio → `image_size` Fal (`square_hd`, `portrait_4_3`, `landscape_16_9`...).
- Support seed natif (les 3 modèles `supportsSeed: true`).
- Téléchargement 2-step : POST → URL d'image → GET pour buffer.

## Validation (4 tests)

```ts
// @requirement: FR-009 — transmet le prompt sans modification ✅
// @requirement: FR-034 — passe le seed quand supportsSeed=true ✅
// @requirement: FR-016 — mappe 401 → unauthorized ✅
// @requirement: FR-001, NFR-001 — throw unauthorized si clé manquante ✅
```
4/4 ✅ dans `tests/unit/server/providers/fal.test.ts`.
