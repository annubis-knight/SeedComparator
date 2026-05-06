---
doc: EPIC
id: EPIC-5
title: UI exploration
slug: ui-exploration
status: done
priority: P0
requirements: [FR-006, FR-007, FR-008, FR-013, FR-017, FR-018, FR-019, FR-020, FR-023, FR-024, NFR-002]
stories_total: 9
stories_done: 9
stories_in_progress: 0
progress: 100%
version: 0.2.0
last_updated: 2026-04-28
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-5 — UI exploration

## Objectif

Permettre à l'utilisateur de configurer un batch et voir les résultats arriver progressivement dans une grille basculable Grid/Flex.

## Exigences couvertes

- **FR-006** Saisie 1-3 prompts — ✅ verified (`PromptInputs.test.ts`, 2 tests).
- **FR-007** Sélection multi-modèles — ✅ verified (`ModelSelector.test.ts`).
- **FR-008** Choix ratio — ✅ implémenté (`RatioSelector.vue` + Zod), pas de test composant dédié (couvert par contracts).
- **FR-013** Affichage asynchrone progressif — ✅ verified (test integration SSE + composable `useGenerationSession`).
- **FR-017** Toggle Grid/Flex — ✅ implémenté (`GenerationGrid.vue`), pas de test composant dédié.
- **FR-018** Carte image — ✅ verified (`GenerationCard.test.ts`, 4 tests).
- **FR-019** Lightbox plein écran — ✅ implémenté (`Lightbox.vue`), pas de test composant dédié.
- **FR-020** Comparateur 2 images — ⚠️ structure du composant prête (props `primary` + `secondary`), UI de sélection multi non câblée en V1.
- **FR-023** Compteur de coût session — ✅ implémenté (`CostMeter.vue`).
- **FR-024** Compteur de coût mensuel — ✅ verified (test integration `GET /api/stats/month`).
- **NFR-002** Performance d'affichage — ⚠️ non mesuré (pas de bench dédié, mais SSE + mock < 1s par image).

## Stories implémentées

| ID | Titre | Statut |
|---|---|---|
| STORY-040 | `PromptInputs` (3 champs) | done |
| STORY-041 | `ModelSelector` (groupé par source, désactivation sans clé) | done |
| STORY-042 | `CostMeter` (session + mensuel) | done |
| STORY-043 | `GenerationCard` (image + méta + actions) | done |
| STORY-044 | `GenerationGrid` (toggle Grid/Flex) | done |
| STORY-045 | Page `index.vue` + composable `useGenerationSession` (SSE streaming) | done |
| STORY-046 | Modal estimation + confirmation | done |
| STORY-047 | Bouton Stop global | done |
| STORY-048 | Lightbox + comparateur 2 images (sélection multi à finaliser) | done (partiel) |

## Critère de fin d'épique

- [x] L'app démarre, `/` répond 200, le formulaire affiche les 7 modèles.
- [x] Tests composants critiques : 9/9 ✅ (PromptInputs 2 + ModelSelector 3 + GenerationCard 4).
- [ ] Bench performance NFR-002 — non livré V1.
