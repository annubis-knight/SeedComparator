---
doc: STORY
id: STORY-071
title: Endpoint PATCH /api/models
epic: EPIC-8
status: done
priority: P1
requirements: [FR-032]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-071 — Endpoint PATCH /api/models

## Livré

- `server/api/models.patch.ts` :
  - Validation Zod (`ModelToggleSchema = { modelId: string, enabled: boolean }`).
  - `prisma.model.update({ where: { id }, data: { enabled } })`.
  - Retourne `{ id, enabled }`.
- `shared/contracts.ts` exporte `ModelToggleSchema`.

## Validation

- Couvert indirectement par `tests/unit/contracts.test.ts` qui valide la structure du payload Zod.
- Smoke runtime : check via la page Settings + relancer `/api/models` confirme la persistance.
- `// @requirement: FR-032` — implémenté.

## Self-review

- [x] Validation Zod : un payload invalide (ex: `enabled: "true"` string) retourne 400.
- [x] Pas de side-effect au-delà de la mutation DB (pas de cascade sur les générations passées).
- [x] L'endpoint ne retourne pas la liste complète (UI re-fetch via `GET /api/models` après).
