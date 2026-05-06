---
doc: EPIC
id: EPIC-3
title: Adapters providers
slug: adapters-providers
status: done
priority: P0
requirements: [FR-009, FR-015, FR-033, FR-034]
stories_total: 5
stories_done: 5
stories_in_progress: 0
progress: 100%
version: 0.2.0
last_updated: 2026-04-28
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-3 — Adapters providers

## Objectif

Implémenter les adapters OpenRouter et Fal.ai derrière l'interface `ImageGenerator`. Permettre l'ajout futur d'un adapter sans toucher à l'UI.

## Exigences couvertes

- **FR-009** — Aucune injection automatique de mots-clés — ✅ verified par tests adapters.
- **FR-015** — Aucun retry automatique — ✅ verified (test `batchOrchestrator`).
- **FR-033** — Adapter OpenRouter — ✅ verified (7 tests).
- **FR-034** — Adapter Fal.ai — ✅ verified (4 tests).

## Stories

| ID | Titre | Statut |
|---|---|---|
| STORY-020 | Interface `ImageGenerator` + types + registry | done |
| STORY-021 | Adapter OpenRouter — Gemini 3.1 Flash-Lite | done |
| STORY-022 | Adapter OpenRouter — Gemini 3.1 Flash, Pro, GPT Image 1.5 | done |
| STORY-023 | Adapter Fal.ai — Flux 1.1 Schnell | done |
| STORY-024 | Adapter Fal.ai — Flux 1.1 Pro, SD 3.5 Large | done |

## Critère de fin d'épique

- [x] Tests adapters OpenRouter : 7/7 ✅.
- [x] Tests adapter Fal.ai : 4/4 ✅.
- [x] Tests adapter mock : 2/2 ✅.
- [x] Le prompt utilisateur est transmis byte-pour-byte identique (`expect(body.prompt).toBe('TEST PROMPT EXACT')` — FR-009).
