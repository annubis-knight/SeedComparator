---
doc: STORY
id: STORY-031
title: Service batchOrchestrator (concurrence + abort + échecs partiels)
epic: EPIC-4
status: done
priority: P0
requirements: [FR-012, FR-014, FR-015, FR-016]
version: 1.0.0
last_updated: 2026-04-28
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-031 — batchOrchestrator

## Livré

- `server/services/batchOrchestrator.ts` : `runBatch(tasks, opts)` avec `p-limit` (concurrence configurable, défaut 3).
- Callback `onResult(taskId, result)` appelé par tâche au fur et à mesure → permet le streaming SSE.
- Gestion fine des erreurs : `ProviderError.code === 'aborted'` → status `aborted`, sinon `failed` avec code/message.

## Validation (5 tests, 100% coverage)

```ts
// @requirement: FR-012 — exécute toutes les tâches en succès ✅
// @requirement: FR-016 — isole les échecs : un échec ne casse pas les autres ✅
// @requirement: FR-014 — annule les requêtes en vol via AbortController ✅
// @requirement: FR-012 — respecte la concurrence limitée (maxActive ≤ 2) ✅
// @requirement: FR-015 — ne fait aucun retry automatique (generate appelé 1 seule fois) ✅
```
5/5 ✅.
