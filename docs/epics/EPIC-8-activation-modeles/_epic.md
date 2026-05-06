---
doc: EPIC
id: EPIC-8
title: Activation des modèles
slug: activation-modeles
status: done
priority: P1
requirements: [FR-032]
stories_total: 2
stories_done: 2
stories_in_progress: 0
progress: 100%
version: 0.2.0
last_updated: 2026-04-28
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-8 — Activation des modèles

## Objectif

Permettre à l'utilisateur d'activer/désactiver chaque modèle individuellement.

## Exigences couvertes

- **FR-032** — Activation/désactivation des modèles — ✅ implémenté (endpoint `PATCH /api/models` + UI Réglages).

## Stories

| ID | Titre | Statut |
|---|---|---|
| STORY-070 | UI Réglages : toggle activation par modèle | done |
| STORY-071 | Endpoint `PATCH /api/models` | done |

## Critère de fin d'épique

- [x] Endpoint `PATCH /api/models` valide le payload via Zod (`ModelToggleSchema`).
- [x] L'UI Réglages affiche une checkbox par modèle, l'état est persisté en DB (`Model.enabled`).
- [x] Le filtre `where: { enabled: true }` dans `/api/generate` ignore les modèles désactivés.
