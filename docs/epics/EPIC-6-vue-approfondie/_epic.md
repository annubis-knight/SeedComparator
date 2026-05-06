---
doc: EPIC
id: EPIC-6
title: Vue approfondie
slug: vue-approfondie
status: in_progress
priority: P0
requirements: [FR-021, FR-022]
stories_total: 2
stories_done: 1
stories_in_progress: 0
stories_proposed: 1
progress: 50%
version: 0.2.0
last_updated: 2026-04-28
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-6 — Vue approfondie

## Objectif

Voir le détail d'une génération et relancer une variation sur un seul modèle.

## Exigences couvertes

- **FR-021** — Vue approfondie (lecture seule) — ✅ verified (`app/pages/sessions/[id].vue` + endpoint `GET /api/sessions/[id]` + smoke runtime HTTP 200).
- **FR-022** — Relance sur un seul modèle — ⚠️ proposed (page de détail prête, formulaire de relance unitaire non câblé).

## Stories

| ID | Titre | Statut |
|---|---|---|
| STORY-050 | Page `sessions/[id].vue` (détail lecture seule) | done |
| STORY-051 | Action "Relancer sur ce modèle" (formulaire + endpoint) | proposed |

## Critère de fin d'épique

- [x] Page de détail accessible via le bouton "Détails" d'une carte ou via la galerie.
- [x] Affiche prompt exact, seed, modèle, coût, raw response.
- [ ] Bouton "Relancer sur ce modèle" pré-remplit un formulaire éditable.
