---
doc: STORY
id: STORY-002
title: Prisma + schema initial + migration init
epic: EPIC-1
status: done
priority: P0
requirements: [FR-025]
version: 1.0.0
last_updated: 2026-04-28
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-002 — Prisma + schema initial

## Livré

- `prisma/schema.prisma` avec entités `Provider`, `Model`, `Session`, `Generation`, `Setting`.
- `prisma/migrations/20260428170933_init/migration.sql` appliquée.
- `server/db/client.ts` : singleton Prisma.
- `package.json` scripts : `db:generate`, `db:migrate`, `db:seed`, `db:studio`.

## Validation

- [x] `npx prisma migrate dev --name init` → DB `seedcomparator` créée + tables OK.
- [x] `prisma generate` automatiquement déclenché (postinstall).
- [x] FR-025 (persistance auto métadonnées) couvert via le test integration `POST /api/generate` qui crée des `Generation` lignes en DB.
