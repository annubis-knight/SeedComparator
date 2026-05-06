---
doc: STORY
id: STORY-033
title: Persistance automatique des Generation (succès et échecs)
epic: EPIC-4
status: done
priority: P0
requirements: [FR-025]
version: 1.0.0
last_updated: 2026-04-28
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-033 — Persistance auto métadonnées

## Livré

Intégrée dans `STORY-032` (endpoint generate) :

- À l'arrivée de la requête : création de la `Session` + N `Generation` (1 par couple prompt × modèle) avec `status: 'pending'`.
- Au callback `onResult` : update de la `Generation` correspondante avec status final + métadonnées (`seed`, `costUsd`, `rawMeta`) ou `errorCode`/`errorMsg`.
- Aucune écriture disque automatique de l'image (FR-026).

## Validation

- [x] Test integration `POST /api/generate` : la SSE retourne un `sessionId` qui correspond à une vraie row DB.
- [x] Endpoint `GET /api/sessions/[id]` retourne les générations bien persistées avec leurs méta.
