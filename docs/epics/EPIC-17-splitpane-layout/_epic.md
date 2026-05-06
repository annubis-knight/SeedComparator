---
doc: EPIC
id: EPIC-17
slug: splitpane-layout
title: "Split-pane layout — zone prompts / zone générations"
version: 1.1.0
last_updated: 2026-05-06
status: done
priority: P1
stories_total: 2
stories_done: 2
stories_in_progress: 0
progress: 100%
requirements: [FR-075, FR-076]
synced_with: [../../EPICS.md, ../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-17 — Split-pane layout

## Objectif

Transformer la page de génération (`/`) en un layout à deux panneaux séparés par une **barre de séparation draggable** :

- **Panneau haut** : interaction utilisateur (phase selector + prompts A/B/C + assistant IA).  
  Ce panneau reste collapsible comme aujourd'hui. Sa hauteur est ajustable par drag.
- **Panneau bas** : grille de générations (`GenerationGrid`).

La position du séparateur est persistée en `localStorage`. Le collapse du panneau haut déplace automatiquement le séparateur vers le bas (grille prend l'espace). Au démarrage d'une génération, le panneau haut se collapse et le séparateur descend.

## Exigences couvertes

| FR | Titre court |
|---|---|
| FR-075 | Split-pane draggable avec collapse sync |
| FR-076 | Remontée auto séparateur au démarrage génération |

## Stories

| Story | Titre | Statut |
|---|---|---|
| [STORY-110](STORY-110-splitpane-composable-component.md) | Composable `useSplitPane` + composant `SplitPane.vue` | done |
| [STORY-111](STORY-111-auto-collapse-generation.md) | Auto-collapse au démarrage génération + restauration | done |

## Critère de fin d'épique

- `SplitPane` draggable intégré dans `index.vue`, position persistée.
- Collapse des prompts → séparateur descend automatiquement.
- Démarrage génération → collapse + séparateur descend.
- Fin de génération → séparateur revient à la position utilisateur mémorisée.
- Tous les tests passent, build vert.
