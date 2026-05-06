---
doc: STORY
id: STORY-063
title: Page sessions/index.vue (galerie)
epic: EPIC-7
status: done
priority: P0
requirements: [FR-029]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-063 — Page galerie

## Livré

- `app/pages/sessions/index.vue` :
  - Charge `GET /api/sessions` au mount (limite 100 dernières sessions).
  - Pour chaque session : date formatée, prompts joints "•", badge "sauvegardée" si `saved`, ratio successCount/total, total cost.
  - Lien `<NuxtLink>` vers `/sessions/<id>`.
  - État vide explicite : "Aucune session. Lance une première comparaison depuis l'onglet Exploration."
- `server/api/sessions/index.get.ts` :
  - Order `createdAt desc`, take 100.
  - `_count.generations` pour le total.
  - `successCount` calculé en filtrant les générations en mémoire.
  - `totalCostUsd` = sum des `costUsd` des générations.

## Validation

- Smoke runtime : `GET /sessions` répond 200, affiche la liste.
- `// @requirement: FR-029` — implémenté.

## Self-review

- [x] La galerie liste **toutes les sessions DB** (même non sauvegardées disque), pas seulement celles avec `saved=true`.
- [x] Le badge visuel distingue les deux cas.
- [ ] Backlog post-V1 : pagination si > 100 sessions, filtres par modèle / période.
