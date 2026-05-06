---
doc: STORY
id: STORY-085
title: Classement des modèles par brand (éditeur)
epic: EPIC-9
status: done
priority: P1
requirements: [FR-042]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-085 — Classement des modèles par brand

## Phase 1 — Analyse

Aujourd'hui, le `Model` ne porte qu'un `providerId` qui est en réalité une **gateway technique** (OpenRouter / Fal.ai). Le `ModelSelector` les affiche groupés par cette gateway, et le `displayName` mélange le nom technique (Gemini 3.1 Flash-Lite) avec un alias commercial entre parenthèses. Pas pertinent pour l'utilisateur : il veut voir "Nano Banana 2 Lite" classé sous "Google".

**Inconnues** :
- Faut-il une table `Brand` séparée ? → Non, on inline `brandId` + `brandDisplayName` + `brandSortOrder` dans `Model` (option B = minimum de migration, IDs techniques préservés).

**Risques** :
- Migration Prisma sur DB existante : on ne touche pas aux IDs des modèles, donc les `Generation.modelId` historiques restent valides.

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-042 : `Model` porte `brandId`, `brandDisplayName`, `brandSortOrder`.
- [x] FR-042 : seed actualise les 7 modèles avec brand + nom commercial épuré.
- [x] FR-042 : `ModelDTO` expose `brandId`, `brandDisplayName`, `brandSortOrder`.
- [x] FR-042 : `ModelSelector` groupe par brand (et non plus par gateway), trié par `brandSortOrder`.

**Tâches** :
1. Migration Prisma `add_brand_to_model`.
2. Mise à jour `prisma/seed.ts`.
3. Mise à jour `ModelDTO` (shared/contracts).
4. Mise à jour endpoint `/api/models.get.ts`.
5. Refactor `ModelSelector.vue` (groupement par brand).
6. Tests : extension `ModelSelector.test.ts`.

## Phase 3 — Dev

TDD léger sur le composant + assertions de seed.

## Phase 4-6

Standard.
