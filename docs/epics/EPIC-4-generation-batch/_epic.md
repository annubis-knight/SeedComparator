---
doc: EPIC
id: EPIC-4
title: Génération & batch
slug: generation-batch
status: done
priority: P0
requirements: [FR-006, FR-007, FR-008, FR-010, FR-011, FR-012, FR-013, FR-014, FR-016, FR-025]
stories_total: 4
stories_done: 4
stories_in_progress: 0
progress: 100%
version: 0.2.0
last_updated: 2026-04-28
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-4 — Génération & batch

## Objectif

Lancer un batch parallèle multi-prompts × multi-modèles avec gestion du stop et des échecs partiels.

## Exigences couvertes

- **FR-006/007/008** — Saisie 1-3 prompts, sélection multi-modèles, choix ratio — ✅ verified (tests `contracts.test.ts` Zod).
- **FR-010** — Estimation du coût — ✅ verified (`costEstimator` 5/5 tests + endpoint `/api/estimate`).
- **FR-011** — Confirmation au-delà du seuil — ⚠️ implémenté côté UI (`app/pages/index.vue` modal), seuil hardcodé 0.50 USD.
- **FR-012** — Batch parallèle avec concurrence limitée — ✅ verified (test `respecte la concurrence limitée`).
- **FR-013** — Affichage asynchrone progressif — ✅ verified (test integration SSE).
- **FR-014** — Bouton Stop global — ✅ verified (test `annule les requêtes en vol via AbortController`).
- **FR-016** — Gestion des échecs partiels — ✅ verified (test `isole les échecs`).
- **FR-025** — Persistance auto métadonnées — ✅ verified (test integration : sessions/generations créées).

## Stories

| ID | Titre | Statut |
|---|---|---|
| STORY-030 | Service `costEstimator` (TDD strict) | done |
| STORY-031 | Service `batchOrchestrator` (concurrence + abort + échecs partiels) | done |
| STORY-032 | Endpoint `POST /api/generate` (Zod + SSE streaming) | done |
| STORY-033 | Persistance auto des `Generation` | done |

## Critère de fin d'épique

- [x] Toutes les stories sont en `done`.
- [x] `costEstimator` à 100% de couverture (5 tests, tous chemins).
- [x] `batchOrchestrator` à 100% de couverture (5 tests : succès, échecs partiels, abort, concurrence, no-retry).
- [x] Test integration `POST /api/generate` (mock mode) : ✅ génère SSE `event: session` + `event: result` + `event: done`.
