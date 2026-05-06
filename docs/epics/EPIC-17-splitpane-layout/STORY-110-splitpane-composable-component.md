---
doc: STORY
id: STORY-110
epic: EPIC-17
title: "Composable useSplitPane + composant SplitPane.vue"
version: 1.1.0
last_updated: 2026-05-06
status: done
priority: P1
requirements: [FR-075]
---

## Analyse

Besoin : diviser `index.vue` en deux zones redimensionnables (prompts / génération) via un séparateur draggable. Le collapse existant des prompts doit déplacer le séparateur. La position doit survivre à un rechargement.

Contraintes techniques :
- Hauteur de la zone utile (`main`) est 100% de la viewport moins header/nav (déjà `h-full` via la cascade `app.vue`).
- Le drag doit fonctionner sur mouse **et** touch (tablette).
- Hauteur minimale de chaque panneau : 80 px.
- Persistance : `localStorage` sous la clé `seedcomparator.splitpane.topPct`.

## Tâches techniques

1. `app/composables/useSplitPane.ts` — état `topPct` (0–100), clamp min/max, persist/restore localStorage, méthode `setCollapsed(bool)`.
2. `app/components/layout/SplitPane.vue` — deux slots (`#top`, `#bottom`), barre draggable, émission `update:topPct`.
3. Intégration dans `app/pages/index.vue` : remplace le `flex flex-col gap-8` actuel par `SplitPane`.
4. Sync collapse : quand `promptsCollapsed` change, appeler `useSplitPane.setCollapsed()`.

## Critères d'acceptation

- [x] **CA-1** : Le séparateur peut être glissé à la souris, la position est persistée en localStorage (FR-075).
- [x] **CA-2** : Hauteur minimale 80 px respectée pour chaque panneau (FR-075).
- [x] **CA-3** : Collapsing le panneau haut déplace le séparateur à `minTopPx` (FR-075).
- [x] **CA-4** : La position est restaurée au rechargement de la page (FR-075).
- [x] **CA-5** : Touch events supportés (tablette) (FR-075).

## Tests

- `tests/unit/composables/useSplitPane.test.ts` : clamp, persist, restore, setCollapsed.
- `tests/unit/components/SplitPane.test.ts` : rendu slots, classe dragging, drag via mousedown/mousemove/mouseup simulé.
