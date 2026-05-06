---
doc: STORY
id: STORY-094
title: Budget slider pour sélection rapide des modèles
epic: EPIC-9
status: done
priority: P1
requirements: [FR-055]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-094 — Budget slider

## Phase 1 — Analyse

L'utilisateur veut pouvoir filtrer rapidement les modèles à sélectionner en fonction d'un budget par image. Pour 10+ modèles, cocher manuellement est fastidieux. Un slider permet de "cocher tous les modèles ≤ X$" en une action.

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-055 : composant `BudgetSlider.vue` placé sous la liste de `ModelSelector` dans `ProvidersPanel.vue`.
- [x] FR-055 : slider HTML natif `<input type="range">` 0 → 0.15$, step 0.005$.
- [x] FR-055 : input texte (number) synchronisé bidirectionnellement avec le slider.
- [x] FR-055 : à chaque mouvement, émet `update:selectedModelIds` avec la liste filtrée.
- [x] FR-055 : pas de gestion `disabled` (responsabilité de ModelSelector).
- [x] FR-055 : un clic manuel sur checkbox ne déplace pas le slider (comportement aide bulk).

**Tâches** :
1. Créer `app/components/session/BudgetSlider.vue`.
2. Modifier `app/components/session/ProvidersPanel.vue` : intégrer le slider sous `<ModelSelector>`, propager `selectedModelIds` via émission.
3. Tests composant : sync slider ↔ input, filtrage modelIds, à 0 = [], au max = tous.
