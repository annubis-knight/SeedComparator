---
doc: EPIC
id: EPIC-10
title: Intégration Imagen via Google AI Studio
slug: imagen-google-ai
status: done
priority: P1
requirements: [FR-051]
stories_total: 1
stories_done: 1
stories_in_progress: 0
progress: 100%
version: 1.0.0
last_updated: 2026-04-29
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-10 — Imagen via Google AI Studio

## Objectif

Ajouter le support des modèles Imagen (Google) via une 3ᵉ gateway technique `google-ai` qui pointe sur la Gemini API (Google AI Studio). Trois modèles : Imagen 4 Preview, Imagen 3, Imagen 3 Fast.

Cette gateway est **distincte d'OpenRouter** (qui ne route pas Imagen au 2026-04) et **distincte de Vertex AI** (qui exigerait un compte GCP + service account).

## Exigences couvertes

- **FR-051** Adapter Google AI Studio (Imagen).

## Stories

| ID | Titre | Statut |
|---|---|---|
| STORY-090 | Adapter google-ai + 3 modèles Imagen sous brand Google | done |

## Critère de fin d'épique

- [ ] STORY-090 done.
- [ ] L'utilisateur peut saisir une `GOOGLE_API_KEY` dans Réglages.
- [ ] Les 3 modèles Imagen apparaissent sous la brand Google dans le ModelSelector.
- [ ] Une génération Imagen renvoie une image base64 valide.
