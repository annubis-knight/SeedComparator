---
doc: EPIC
id: EPIC-9
title: Refonte UX exploration
slug: refonte-ux-exploration
status: done
priority: P1
requirements: [FR-035, FR-036, FR-037, FR-038, FR-039, FR-040, FR-041, FR-042, FR-043, FR-044, FR-045, FR-046, FR-047, FR-048, FR-049, FR-050, FR-052, FR-055, NFR-004]
stories_total: 12
stories_done: 12
stories_in_progress: 0
progress: 100%
version: 1.4.0
last_updated: 2026-04-29
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-9 — Refonte UX exploration

## Objectif

Reconcevoir l'écran principal d'exploration pour le rapprocher des standards des générateurs d'images modernes (Midjourney, Leonardo, Ideogram) :

- Side panel rétractable, organisé en onglets verticaux.
- Saisie des prompts en haut de la zone principale, avec navigation A/B/C par tabs.
- Cartes de génération **toujours visibles** dès la sélection des providers (placeholder gris avant lancement).
- Vue Flex repensée : une carte par colonne, switch de prompt actif.
- Ajout des configurations `quality` et `nbImagesPerPrompt`.
- Aération visuelle générale (tokens spacing).
- Ratio par défaut `16:9`.

## Exigences couvertes

- **FR-035** Side panel rétractable.
- **FR-036** Onglets verticaux.
- **FR-037** PromptInputs en haut + tabs A/B/C.
- **FR-038** Quality + nbImagesPerPrompt.
- **FR-039** Cartes idle visibles avant génération.
- **FR-040** Vue flex 1 carte/colonne + switch prompt.
- **FR-041** Ratio par défaut 16:9.
- **NFR-004** Aération visuelle minimale.

## Stories

| ID | Titre | Statut |
|---|---|---|
| STORY-080 | Side panel rétractable + onglets verticaux | done |
| STORY-081 | PromptInputs en haut + tabs A/B/C + ratio default 16:9 | done |
| STORY-082 | Cartes placeholder visibles + quality/nbImages backend | done |
| STORY-083 | Vue flex 1 carte/colonne + switch prompt | done |
| STORY-084 | Aération visuelle (tokens spacing) | done |
| STORY-085 | Classement modèles par brand (Model.brandId, ModelSelector groupé) | done |
| STORY-086 | Gateway dans Réglages + tag discret dans GenerationCard | done |
| STORY-087 | Regroupement par brand dans Grid (sections) + Flex (header colonnes) | done |
| STORY-088 | App shell unifié + collapse PromptInputs + aération renforcée | done |
| STORY-089 | Corrections UI : flex hauteur, placeholder, chevrons, dark slate, bouton Générer | done |
| STORY-091 | PromptSwitcher universel (Grid + Flex) + option "Tous" | done |
| STORY-094 | Budget slider pour sélection rapide des modèles | done |

## Critère de fin d'épique

- [x] Toutes les stories STORY-080 à STORY-084 en `done`.
- [x] `npm run typecheck && npm run test && npm run build && npm run check:secrets` verts (63/63 tests).
- [ ] `npm run lint` : pré-existant cassé sur fichiers `tests/**/*.ts` (parser ESLint sans TS) — non régressé par cette refonte, à corriger dans une story dédiée future.
- [ ] Smoke test runtime : à valider manuellement par l'utilisateur (npm run dev).

## Livré

- 5 nouveaux composants : `SidePanel`, `ImageConfigPanel`, `ProvidersPanel`, `PromptSwitcher` (+ refonte `PromptInputs`, `GenerationCard`, `GenerationGrid`).
- 1 nouveau composable : `useSidePanel` (collapsed + activeTab + localStorage).
- 1 helper exporté : `buildIdleCards()` dans `useGenerationSession`.
- Schéma Zod étendu : `quality`, `nbImagesPerPrompt`.
- `costEstimator` étendu : multiplie par `nbImagesPerPrompt`.
- 27 nouveaux tests (63 vs 36 au baseline).
