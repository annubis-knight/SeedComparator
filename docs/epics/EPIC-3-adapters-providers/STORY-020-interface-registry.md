---
doc: STORY
id: STORY-020
title: Interface ImageGenerator + types + registry
epic: EPIC-3
status: done
priority: P0
requirements: []
version: 1.0.0
last_updated: 2026-04-28
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-020 — Interface + types + registry

## Livré

- `server/providers/types.ts` : `ImageGenerator`, `GenerateInput`, `GenerateOutput`, `ProviderError` (codes : unauthorized, rate_limited, invalid_request, server_error, timeout, aborted, unknown).
- `server/providers/registry.ts` : map modelId → generator avec deux variantes (mock vs réel) sélectionnées via `PROVIDERS_MOCK_MODE`.
- `server/providers/mock.ts` : générateur mock retournant un PNG 4×4 valide avec latence simulée.

## Validation

- [x] 2/2 tests `mock.test.ts` ✅ (PNG valide + abort signal).
- [x] Architecture scalable : ajouter un modèle = entrée DB ; ajouter une source = nouveau fichier `providers/<source>.ts` + entrée registry.
