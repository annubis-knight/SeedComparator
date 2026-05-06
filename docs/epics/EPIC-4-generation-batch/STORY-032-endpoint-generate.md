---
doc: STORY
id: STORY-032
title: Endpoint POST /api/generate (Zod + SSE streaming)
epic: EPIC-4
status: done
priority: P0
requirements: [FR-006, FR-007, FR-008, FR-013, FR-025]
version: 1.0.0
last_updated: 2026-04-28
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-032 — Endpoint /api/generate

## Livré

- `server/api/generate.post.ts` :
  - Validation Zod (`GenerateRequestSchema`).
  - Création de la `Session` + `Generation` rows en DB (status `pending`) **avant** lancement.
  - Délégation au `batchOrchestrator`.
  - Streaming SSE : `event: session`, `event: result` (par génération), `event: done`.
  - MAJ DB de chaque `Generation` (status, seed, costUsd, rawMeta, errorCode/Msg) au callback `onResult`.
  - Cache mémoire image via `imageCache.putImage()`.
- `app/composables/useGenerationSession.ts` : parser SSE côté client.

## Validation (test integration)

```ts
it('POST /api/generate (mock mode) crée une session et stream les résultats', async () => {
  // @requirement: FR-013, FR-025
  // → vérifie présence event:session + event:result + event:done dans le stream
})
```
✅ passed.

## Bug fix runtime

- Stream controller closing : le client peut fermer avant la fin du batch → `controller.enqueue()` throw `ERR_INVALID_STATE`. Fix : flag `closed` + try/catch silencieux.
