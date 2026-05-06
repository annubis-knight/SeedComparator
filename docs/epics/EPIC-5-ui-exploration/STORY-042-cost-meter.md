---
doc: STORY
id: STORY-042
title: Composant CostMeter (session + mensuel)
epic: EPIC-5
status: done
priority: P0
requirements: [FR-023, FR-024]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-042 — CostMeter

## Livré

- `app/components/session/CostMeter.vue` : 2 colonnes "Session" et "Mois en cours", format `$0.000` monospaced.
- `app/composables/useCostMeter.ts` : `sessionCost` (incrémenté à chaque génération réussie via `useGenerationSession`), `monthlyCost` (chargé depuis `/api/stats/month` au mount).
- Affiché en permanence dans le header (`app/app.vue`).

## Validation

- `tests/integration/api.test.ts > GET /api/stats/month retourne un total numérique` ✅
  - `// @requirement: FR-024`
- Pas de test composant dédié (smoke runtime via `npm run dev`).

## Self-review

- [x] La somme session est mise à jour live à chaque `event: result` SSE de `useGenerationSession`.
- [x] La somme mensuelle est calculée côté serveur (pas dans le frontend) via `prisma.generation.aggregate({ _sum: ..., where: createdAt >= start })`.
