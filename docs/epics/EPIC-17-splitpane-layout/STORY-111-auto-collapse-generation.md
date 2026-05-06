---
doc: STORY
id: STORY-111
epic: EPIC-17
title: "Auto-collapse au démarrage génération + restauration position"
version: 1.1.0
last_updated: 2026-05-06
status: done
priority: P1
requirements: [FR-076]
---

## Analyse

Au démarrage d'une génération, l'utilisateur veut voir les cartes apparaître sans action manuelle. Le panneau prompts doit se plier automatiquement ET le séparateur doit descendre pour libérer l'espace.

À la fin de la génération, la position mémorisée par l'utilisateur (pas le défaut global) doit être restaurée pour que le résultat soit prévisible.

## Tâches techniques

1. Dans `useSplitPane` : mémoriser `userTopPct` séparément du `topPct` courant. Au collapse auto, `topPct` → `minTopPct`. À la fin génération, `topPct` ← `userTopPct`.
2. Dans `index.vue` : `watch(inProgress, ...)` → appeler `splitPane.setAutoCollapse(true/false)`.
3. S'assurer que le drag pendant une génération met à jour `userTopPct` (l'utilisateur peut réajuster manuellement).

## Critères d'acceptation

- [x] **CA-1** : Démarrage génération → panneau haut collapse + séparateur descend à `minTopPx` (FR-076).
- [x] **CA-2** : Fin de génération → séparateur revient à la position `userTopPct` mémorisée (FR-076).
- [x] **CA-3** : Si l'utilisateur drag pendant la génération, `userTopPct` est mis à jour (FR-076).

## Tests

- `tests/unit/composables/useSplitPane.test.ts` : `setAutoCollapse(true)` → topPct clampé ; `setAutoCollapse(false)` → topPct = userTopPct.
