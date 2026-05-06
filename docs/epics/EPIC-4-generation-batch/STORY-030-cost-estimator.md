---
doc: STORY
id: STORY-030
title: Service costEstimator (TDD strict)
epic: EPIC-4
status: done
priority: P0
requirements: [FR-010]
version: 1.0.0
last_updated: 2026-04-28
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-030 — costEstimator

## Livré

- `server/services/costEstimator.ts` : `estimateCost(prompts, models)` retourne `{ generations, totalUsd, breakdown }`.
- Comptage des prompts non-vides (trim).
- Arrondi à 3 décimales.

## Validation (5 tests, 100% coverage)

```ts
// @requirement: FR-010 — retourne 0 si aucun prompt actif ✅
// @requirement: FR-010 — retourne 0 si aucun modèle ✅
// @requirement: FR-010 — multiplie correctement prompts × modèles ✅
// @requirement: FR-010 — ignore les prompts vides ou whitespace ✅
// @requirement: FR-010 — expose un breakdown par modèle ✅
```
5/5 ✅.
