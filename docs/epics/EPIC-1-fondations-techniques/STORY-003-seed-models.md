---
doc: STORY
id: STORY-003
title: Seed des Provider et Model V1
epic: EPIC-1
status: done
priority: P0
requirements: [FR-031]
version: 1.0.0
last_updated: 2026-04-28
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-003 — Seed des Provider et Model V1

## Livré

- `prisma/seed.ts` avec `upsert` idempotent pour : 2 providers (openrouter, fal) + 7 modèles (gemini-3.1-flash-lite, gemini-3.1-flash, gemini-3.1-pro, gpt-image-1.5, flux-1.1-schnell, flux-1.1-pro, sd-3.5-large) + 3 settings (cost_threshold_usd, save_folder, concurrency_limit).
- `npm run db:seed` exécutable via `tsx`.

## Validation

- [x] Seed exécuté : `[seed] OK — providers, models, settings prêts`.
- [x] Test integration `GET /api/models` retourne bien les 7 modèles.
- [x] FR-031 verified par le test integration.

## Self-review

- [x] Pas de clé API en DB.
- [x] `pricePerImage` typé Decimal (pas float).
- [x] Idempotent : ré-exécuter le seed ne duplique pas.
