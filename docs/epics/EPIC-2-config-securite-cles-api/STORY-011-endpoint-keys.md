---
doc: STORY
id: STORY-011
title: Endpoint PUT /api/settings/keys + écran Réglages
epic: EPIC-2
status: done
priority: P0
requirements: [FR-001]
version: 1.0.0
last_updated: 2026-04-28
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-011 — Endpoint clés + UI Réglages

## Livré

- `server/api/settings/keys.put.ts` : valide via Zod (`KeyUpsertSchema`) et stocke en mémoire serveur via `setApiKey`.
- `server/api/settings/keys.get.ts` : liste des providers ayant une clé.
- `app/pages/settings.vue` : champ password par provider, bouton Enregistrer.

## Validation (test integration)

```ts
it('PUT /api/settings/keys accepte une clé valide', async () => { ... })
// @requirement: FR-001
```
✅ passed dans `tests/integration/api.test.ts`.
