---
doc: STORY
id: STORY-091
title: PromptSwitcher universel (Grid + Flex) + option "Tous"
epic: EPIC-9
status: done
priority: P1
requirements: [FR-052]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-091 — PromptSwitcher universel + Tous

## Phase 1 — Analyse

Aujourd'hui le PromptSwitcher est visible **uniquement en mode flex** (FR-040). En mode grid, l'utilisateur voit toutes les cartes mélangées par prompt sans pouvoir filtrer. Demande : étendre le switcher au mode grid + ajouter une option "Tous".

**Spécificité Flex en mode "Tous"** : pour chaque modèle, on veut **N colonnes** (1 par prompt rempli) au lieu d'une seule. Ça démultiplie les colonnes mais préserve la lisibilité (1 card par colonne). Sub-header `A`/`B`/`C` au-dessus de chaque colonne.

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-052 : PromptSwitcher visible dans Grid ET Flex dès `promptCount > 1`.
- [x] FR-052 : option "Tous" en première position.
- [x] FR-052 : Grid filtre les cards selon prompt actif, ou affiche tout si "Tous".
- [x] FR-052 : Flex affiche 1 colonne par modèle si prompt actif numérique, N colonnes (1/prompt) si "Tous", avec sub-header A/B/C.
- [x] FR-052 : valeur par défaut = `0` (prompt A), pas "Tous".

**Tâches** :
1. Étendre `PromptSwitcher.vue` pour accepter une valeur sentinelle `'all'`.
2. Refactor `GenerationGrid.vue` :
   - Sortir le PromptSwitcher de la branche flex pour qu'il soit rendu globalement.
   - Mode grid : filtrer `cardsForBrand()` selon activePromptIdx.
   - Mode flex : générer une grille de colonnes "modèles × prompts" si `'all'`, sinon 1 colonne par modèle comme aujourd'hui.
3. Tests : `GenerationGrid.test.ts` + `PromptSwitcher.test.ts`.

## Phase 3-6

Standard.
