---
doc: STORY
id: STORY-061
title: Endpoint sauvegarde image individuelle
epic: EPIC-7
status: done
priority: P0
requirements: [FR-027]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-061 — POST /api/save/image

## Livré

- `server/api/save/image.post.ts` :
  - Validation Zod (`SaveImageRequestSchema`).
  - Lookup `Generation` + `model` en DB.
  - Lookup buffer dans `imageCache`. Si absent → HTTP 410 "Image no longer in cache".
  - `mkdir -p folder` + écriture `<folder>/<modelId>_<promptIdx>_<id8>.png`.
  - Update `Generation.imagePath` en DB.
- Côté client (`GenerationCard.vue` → `index.vue` → `saveImage(gen)`) :
  - Appelle IPC `seedApi.dialog.selectFolder()` (dialog natif Electron).
  - Si l'utilisateur valide, `POST /api/save/image` avec `{ generationId, folder }`.

## Validation

- Smoke runtime + revue de code.
- `// @requirement: FR-027` — implémenté.

## Self-review

- [x] Aucune écriture disque sans clic explicite.
- [x] L'utilisateur choisit toujours le dossier (jamais d'auto-pick).
- [x] Si le cache est vide (image plus disponible), retourne 410 explicite (le frontend pourra afficher un toast).
