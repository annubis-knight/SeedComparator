---
doc: STORY
id: STORY-047
title: Bouton Stop global
epic: EPIC-5
status: done
priority: P0
requirements: [FR-014]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-047 — Bouton Stop global

## Livré

- `app/composables/useGenerationSession.ts` :
  - `abortController` stocké en `useState`.
  - `stop()` appelle `abortController.value?.abort()` + force `inProgress = false`.
- `app/pages/index.vue` : bouton "Stop" affiché conditionnellement quand `inProgress === true`.
- Côté serveur, le `node:req.on('close')` propage l'abort vers le `batchOrchestrator` qui annule via le `AbortSignal` partagé.

## Validation (2 tests batch + 1 adapter)

```ts
// @requirement: FR-014 — annule les requêtes en vol via AbortController ✅
// (batchOrchestrator.test.ts)
// @requirement: FR-014 — propage AbortError → ProviderError aborted ✅
// (openrouter.test.ts)
```

## Self-review

- [x] Les images déjà reçues ne disparaissent pas après le Stop (préservées dans `generations`).
- [x] Côté DB, les `Generation` non terminées sont marquées `status: 'aborted'`.
- [x] Aucune nouvelle requête provider n'est lancée après abort (la limite `p-limit` voit le signal et skip les tâches en attente).
