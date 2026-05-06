---
doc: STORY
id: STORY-048
title: Lightbox + comparateur 2 images (sélection multi à finaliser)
epic: EPIC-5
status: done
priority: P1
requirements: [FR-019, FR-020]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-048 — Lightbox

## Livré

- `app/components/generation/Lightbox.vue` :
  - Overlay plein écran (`bg-black/85 backdrop-blur-md`).
  - Affiche `primary` seul OU `primary + secondary` côte à côte (props prêtes pour comparaison).
  - Fermeture via bouton ✕ ou clic backdrop.
- `app/pages/index.vue` : `lightboxGen` state, `openLightbox(gen)` au clic image dans `GenerationCard`.

## Validation

- Pas de test composant dédié (smoke runtime).
- `// @requirement: FR-019` — implémenté.

## Limite V1 (FR-020)

- Le composant Lightbox **accepte** `primary` ET `secondary`, mais l'UI de **sélection multi** depuis la grille n'est pas câblée.
- En V1, on ouvre toujours en mode 1 image.
- Pour finaliser FR-020 : ajouter une checkbox sur `GenerationCard` + state `selectedForCompare` dans `index.vue` + ouvrir la lightbox en mode 2-images quand 2 cartes sont cochées.

## Self-review

- [x] FR-019 (zoom plein écran simple) couvert.
- [ ] FR-020 (comparateur 2 images) : structurellement prêt, à finaliser en post-V1.
