---
doc: STORY
id: STORY-098
title: Galerie filtrée par likes
epic: EPIC-13
status: done
priority: P2
requirements: [FR-059]
version: 1.0.0
last_updated: 2026-05-01
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-098 — Galerie filtrée

## Phase 1-2

Ajout d'un toggle "❤️ Likées uniquement" :
- Dans `/sessions` : filtre la liste pour ne montrer que les sessions avec ≥1 like.
- Dans `/sessions/[id]` : filtre les `GenerationCard` affichées.

**Critères d'acceptation** :
- [x] FR-059 : toggle visible en haut de `/sessions` et `/sessions/[id]`.
- [x] FR-059 : filtre actif persisté pendant la navigation (state Nuxt simple, pas localStorage).
- [x] FR-059 : si aucun résultat, message "Aucune session avec des likes" / "Aucune image likée dans cette session".

**Tâches** :
1. Étendre `GET /api/sessions` (liste) pour retourner un compteur de likes par session.
2. Modifier `pages/sessions/index.vue` : toggle + filtrage côté client.
3. Modifier `pages/sessions/[id].vue` : toggle + filtrage des générations.
