---
doc: STORY
id: STORY-045
title: Page index.vue + composable useGenerationSession (SSE streaming)
epic: EPIC-5
status: done
priority: P0
requirements: [FR-013, FR-006, FR-007, FR-008]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-045 — Page d'exploration + streaming SSE

## Livré

- `app/pages/index.vue` :
  - Layout 2 colonnes (sidebar config + grille à droite).
  - `await loadModels()` au setup, sélection initiale = tous les modèles activés avec clé.
  - `canGenerate` : computed, désactive le bouton si aucun prompt actif ou aucun modèle coché.
  - Click "Générer" → `POST /api/estimate` → modal si > 0.50 USD → `start()`.
- `app/composables/useGenerationSession.ts` :
  - `start({ prompts, modelIds, ratio })` lance `fetch('/api/generate')` et parse manuellement le stream SSE.
  - Pour chaque `event: result`, met à jour la `LiveGeneration` correspondante par `taskId`.
  - `stop()` annule via `AbortController`.
  - Préserve le tableau `generations` réactif pour que les cartes se mettent à jour live.

## Validation

- `tests/integration/api.test.ts > POST /api/generate (mock mode) crée une session et stream les résultats` ✅
  - `// @requirement: FR-013, FR-025`

## Self-review

- [x] L'image apparaît dès que son `event: result` arrive — pas d'attente du `event: done`.
- [x] Une génération en `failed` n'interrompt pas les autres (FR-016, garanti par `batchOrchestrator`).
