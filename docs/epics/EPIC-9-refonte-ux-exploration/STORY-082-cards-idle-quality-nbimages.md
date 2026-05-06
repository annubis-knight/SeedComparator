---
doc: STORY
id: STORY-082
title: Cartes placeholder visibles + quality/nbImages
epic: EPIC-9
status: done
priority: P0
requirements: [FR-038, FR-039]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-082 — Cartes placeholder + qualité + nb d'images

## Phase 1 — Analyse

Aujourd'hui, `useGenerationSession` ne crée des `LiveGeneration` qu'**au lancement** d'un batch (`reset()`). Avant ça, la grille est vide. Il faut exposer une vue dérivée `displayedCards` qui calcule les cards à afficher en fonction des modèles sélectionnés et du prompt actif, en injectant un état `idle` pour celles qui n'ont pas encore été lancées.

`GenerationCard` doit gérer un nouvel état `idle` (placeholder gris au ratio configuré, nom du modèle).

Côté backend : ajout `quality` et `nbImagesPerPrompt` à `GenerateRequest` (Zod) et propagation au `costEstimator` (multiplie par `nbImagesPerPrompt`).

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-039 : `displayedCards` retourne 1 carte `idle` par modèle sélectionné × prompt actif (mode flex) ou × tous prompts (mode grid), avant lancement.
- [x] FR-039 : `GenerationCard` rend un placeholder gris distinct du spinner pending.
- [x] FR-039 : transition `idle → pending → success/failed` fonctionne.
- [x] FR-038 : Zod accepte `quality: 'low'|'standard'|'high'` (défaut `standard`) et `nbImagesPerPrompt: 1..4` (défaut 1).
- [x] FR-038 : `costEstimator` multiplie le coût par `nbImagesPerPrompt`.

**Tâches** :
1. Étendre `LiveGeneration['status']` avec `'idle'`.
2. Ajouter `displayedCards` au composable.
3. Mettre à jour `GenerationCard.vue` (rendu idle).
4. Mettre à jour `GenerateRequestSchema` (Zod).
5. Mettre à jour `costEstimator` + tests existants.
6. Tests nouveaux : `useGenerationSession.test.ts`, extension `GenerationCard.test.ts`, extension `contracts.test.ts`, extension `costEstimator.test.ts`.
