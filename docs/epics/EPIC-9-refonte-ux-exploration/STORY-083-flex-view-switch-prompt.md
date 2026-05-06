---
doc: STORY
id: STORY-083
title: Vue flex 1 carte/colonne + switch prompt
epic: EPIC-9
status: done
priority: P1
requirements: [FR-040]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-083 — Vue flex repensée

## Phase 1 — Analyse

Aujourd'hui, mode `flex` dans `GenerationGrid.vue` rend une matrice modèles × prompts (toutes les variantes simultanément). On veut désormais : **1 colonne par modèle**, contenu = prompt actif. Un switch A/B/C en toolbar permet de changer l'index actif sans relancer.

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-040 : mode flex affiche N colonnes pour N modèles sélectionnés (1 carte chacune).
- [x] FR-040 : composant `PromptSwitcher` visible uniquement en mode flex.
- [x] FR-040 : le switch ne déclenche aucune requête (FR-017 préservé).
- [x] FR-040 : prompt actif partagé avec PromptInputs (state global) — pas de désynchro.

**Tâches** :
1. Ajouter `activePromptIdx` à `useGenerationSession` (ou composable séparé `useActivePrompt`).
2. Refondre la branche `mode === 'flex'` de `GenerationGrid.vue`.
3. Créer `PromptSwitcher.vue`.
4. Tests : extension `GenerationGrid.test.ts` (à créer si absent) — flex avec 2 prompts × 2 modèles, switch.
