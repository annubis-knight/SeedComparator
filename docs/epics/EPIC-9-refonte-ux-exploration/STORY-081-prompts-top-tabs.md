---
doc: STORY
id: STORY-081
title: PromptInputs en haut + nav A/B/C + ratio default 16:9
epic: EPIC-9
status: done
priority: P1
requirements: [FR-037, FR-041]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-081 — PromptInputs en haut + tabs A/B/C

## Phase 1 — Analyse

`PromptInputs` actuel rend 3 textareas empilés. À refondre en : 1 textarea + tabs A/B/C au-dessus, contenu des 3 prompts conservé en mémoire interne. Le composant doit rester contrôlé via `v-model: string[]` (longueur 3).

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-037 : 1 textarea visible à la fois, tabs A/B/C pour basculer.
- [x] FR-037 : indicateur visuel sur tabs remplis.
- [x] FR-037 : le composant émet `update:modelValue` avec la valeur courante d'un tableau de 3.
- [x] FR-041 : ratio par défaut `16:9` dans `useGenerationSession` / `app/pages/index.vue`.

**Tâches** :
1. Refondre `PromptInputs.vue` (state interne `activeTab`, indicateur de remplissage).
2. Étendre `PromptInputs.test.ts` (3 nouveaux tests).
3. Modifier `app/pages/index.vue` : déplacer `<PromptInputs>` hors de la sidebar, en haut de la zone main. Ratio par défaut → `16:9`.

## Phase 3 — Dev (TDD)

Tests : switch tab préserve, indicateur de remplissage, A reste obligatoire.

## Phase 4 — Self-review / Phase 5 — Validation / Phase 6 — Doc

(Standard)
