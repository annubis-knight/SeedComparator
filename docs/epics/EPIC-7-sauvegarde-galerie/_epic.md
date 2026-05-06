---
doc: EPIC
id: EPIC-7
title: Sauvegarde & galerie
slug: sauvegarde-galerie
status: done
priority: P0
requirements: [FR-026, FR-027, FR-028, FR-029, FR-030]
stories_total: 5
stories_done: 5
stories_in_progress: 0
progress: 100%
version: 0.2.0
last_updated: 2026-04-28
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-7 — Sauvegarde & galerie

## Objectif

Sauvegarder manuellement images/sessions sur disque (PNG + manifest.json) et les retrouver dans une galerie.

## Exigences couvertes

- **FR-026** — Aucune persistance disque automatique — ✅ verified (cache mémoire seul ; fichiers écrits seulement sur appel `/api/save/...`).
- **FR-027** — Sauvegarde image individuelle — ✅ implémenté (`server/api/save/image.post.ts`).
- **FR-028** — Sauvegarde session entière (manifest.json) — ✅ implémenté (`server/api/save/session.post.ts`).
- **FR-029** — Galerie historique — ✅ implémenté (`app/pages/sessions/index.vue` + endpoint `GET /api/sessions`, runtime HTTP 200).
- **FR-030** — Réouverture d'une session sauvegardée — ✅ implémenté (page `sessions/[id].vue` charge depuis DB, lit `imageDataUrl` du cache ou `imagePath` du disque).

## Stories

| ID | Titre | Statut |
|---|---|---|
| STORY-060 | Service `imageCache` (cache temp en mémoire) | done |
| STORY-061 | Endpoint sauvegarde image individuelle | done |
| STORY-062 | Endpoint sauvegarde session entière (manifest.json) | done |
| STORY-063 | Page `sessions/index.vue` (galerie) | done |
| STORY-064 | Réouverture d'une session sauvegardée | done |

## Critère de fin d'épique

- [x] Aucune image écrite sur disque sans clic explicite (`Save`).
- [x] Sauvegarde session : crée `<dossier>/YYYY-MM-DD-HH-mm_<slug>/{image_*.png, manifest.json}`.
- [x] Galerie : `/sessions` répond 200, liste les sessions DB triées par date.

## Limite

- **`imageCache` est in-memory uniquement** : si le serveur Nitro redémarre entre la génération et la sauvegarde, l'image est perdue. C'est acceptable en V1 (dans la même session Electron, le cache reste).
