---
doc: STORY
id: STORY-046
title: Modal estimation + confirmation
epic: EPIC-5
status: done
priority: P0
requirements: [FR-010, FR-011]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-046 — Modal estimation

## Livré

- `app/components/ui/AppModal.vue` : modal générique (overlay sombre, glass card, fermeture via clic backdrop ou bouton ✕).
- `app/pages/index.vue` :
  - Avant lancement, `POST /api/estimate` retourne le coût estimé.
  - Si `estimate.totalUsd >= 0.50` (seuil hardcodé V1), `estimateOpen = true`.
  - Modal affiche "X générations — coût estimé : $Y.YYY", deux boutons Annuler / Confirmer.
- `server/api/estimate.post.ts` : valide via Zod, calcule via `costEstimator`.

## Validation

- `tests/integration/api.test.ts > POST /api/estimate calcule le coût` ✅
  - `// @requirement: FR-010`
- `tests/unit/server/services/costEstimator.test.ts × 5` ✅

## Self-review

- [x] Le seuil est lu depuis une constante locale (`COST_THRESHOLD_DEFAULT = 0.5`). Story 014 (post-V1) : exposer le réglage en UI.
- [x] Si l'estimation < seuil, lancement direct sans modal (UX fluide).
