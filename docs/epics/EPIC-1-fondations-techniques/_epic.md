---
doc: EPIC
id: EPIC-1
title: Fondations techniques
slug: fondations-techniques
status: done
priority: P0
requirements: [NFR-003]
stories_total: 3
stories_done: 3
stories_in_progress: 0
progress: 100%
version: 0.2.0
last_updated: 2026-04-28
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-1 — Fondations techniques

## Objectif

Avoir un projet qui démarre, une DB initialisée, et une fenêtre Electron qui charge l'UI Nuxt.

## Périmètre

- Scaffolding du projet selon `docs/ARCHITECTURE.md` §8.
- Mise en place de la base PostgreSQL (utilisateur local, DB `seedcomparator`) via Prisma.
- Seed initial des `Provider` et `Model` V1.

## Exigences couvertes

- **NFR-003** — Build sans erreur ni warning bloquant — ✅ verified par `npm run build` qui termine sans erreur.

## Stories

| ID | Titre | Statut |
|---|---|---|
| STORY-001 | Scaffolding Nuxt 3 (compat 4) + Electron + Tailwind + tokens glassmorphisme | done |
| STORY-002 | Prisma + schema initial + migration `init` appliquée | done |
| STORY-003 | Seed des `Provider` et `Model` V1 (7 modèles) | done |

## Critère de fin d'épique

- [x] Toutes les stories sont en `done`.
- [x] `npm run dev` démarre l'app (Nuxt + Electron + DB connectée). Validé par smoke-test runtime (HTTP 200 sur `/`, `/api/models`, `/sessions`, `/settings`).
- [x] `npm run build` termine sans erreur.
- [x] La DB contient les 7 modèles V1 seedés.

## Notes de mise en œuvre

- Stack finale : Nuxt 3.21 (compat 4), Electron 33, Vitest 3.2, Prisma 5.22.
- `srcDir: 'app/'` retiré au profit de `future.compatibilityVersion: 4` qui rend `app/` la srcDir par défaut sans casser la résolution `#internal/nuxt/paths`.
- `experimental.appManifest: false` désactivé pour éviter les warnings pre-transform Vite.
- electron-vite : 2 sous-dossiers de build distincts (`dist-electron/main/`, `dist-electron/preload/`) pour éviter que les builds successifs s'écrasent.
