---
doc: STORY
id: STORY-050
title: Page sessions/[id].vue (détail lecture seule)
epic: EPIC-6
status: done
priority: P0
requirements: [FR-021]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-050 — Page de détail session

## Livré

- `app/pages/sessions/[id].vue` :
  - Charge `GET /api/sessions/[id]` au mount.
  - Affiche : date formatée, prompts (A/B/C), ratio, total cost.
  - Grille de toutes les générations de la session avec image, modèle, seed, coût, prompt index, raw response (en `<details>` collapsible).
  - Bouton "Sauvegarder la session" (utilise dialog Electron `selectFolder` puis `POST /api/save/session`).
- `server/api/sessions/[id].get.ts` :
  - Lit la session + générations + modèles (Prisma `include`).
  - Retourne `imageDataUrl` depuis `imageCache` si dispo, sinon `imagePath` du disque.
  - Sérialise `seed` BigInt → string.

## Validation

- Smoke runtime : `GET /sessions/<cuid>` répond 200.
- `// @requirement: FR-021` — implémenté (lecture seule).

## Self-review

- [x] Page lecture seule, aucune mutation des générations existantes.
- [x] Si `imageDataUrl` est `null` ET `imagePath` est `null` → message "image absente" (cache purgé entre sessions Electron).
- [x] Pas de fuite de clé API (la page ne référence aucun endpoint provider).
