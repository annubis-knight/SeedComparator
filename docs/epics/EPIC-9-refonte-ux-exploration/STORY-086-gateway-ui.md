---
doc: STORY
id: STORY-086
title: Gateway dans Réglages + tag discret dans GenerationCard
epic: EPIC-9
status: done
priority: P2
requirements: [FR-043]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-086 — Gateway visible côté Réglages + tag GenerationCard

## Phase 1-2

Suite logique de STORY-085 : la gateway technique disparaît du `ModelSelector` mais reste visible :
- en **Réglages** sous le terme "Passerelles" (clés API),
- en tag discret sur la `GenerationCard` (ex: `via OpenRouter`).

**Critères d'acceptation** :
- [x] FR-043 : page Réglages affiche un titre/section "Passerelles" avec les gateways disponibles et statut clé.
- [x] FR-043 : `GenerationCard` rend un petit tag `via {gateway}` quand `gatewayDisplayName` est fourni en prop.

**Tâches** :
1. Mise à jour `pages/settings.vue` (renommage "Clés API" → "Passerelles", terminologie).
2. Ajout prop `gatewayDisplayName` à `GenerationCard.vue` + affichage discret.
3. Propagation depuis `GenerationGrid` (mapping modelId → gateway via `models[]`).
4. Tests : extension `GenerationCard.test.ts`.
