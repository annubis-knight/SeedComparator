---
doc: STORY
id: STORY-044
title: Composant GenerationGrid (toggle Grid / Flex)
epic: EPIC-5
status: done
priority: P0
requirements: [FR-017]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-044 — GenerationGrid

## Livré

- `app/components/generation/GenerationGrid.vue` :
  - Toggle bouton Grid / Flex (v-model `mode`).
  - Mode **Grid** : `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` avec wrap libre.
  - Mode **Flex** : matrice `colonnes = modèles × lignes = prompts`, header avec nom du modèle, label de prompt à gauche.
  - Stats live "X/N • Y échecs".
  - `placeholderGen()` génère une carte `pending` pour les couples manquants en mode Flex.

## Validation

- Pas de test composant dédié (couvert visuellement runtime + le toggle ne déclenche pas de re-fetch).
- `// @requirement: FR-017` — implémenté.

## Self-review

- [x] Toggle stable : ne re-monte pas les cartes (préserve les images affichées).
- [x] Émet `update:mode`, `open`, `details`, `save` — délégué vers les enfants `GenerationCard`.
