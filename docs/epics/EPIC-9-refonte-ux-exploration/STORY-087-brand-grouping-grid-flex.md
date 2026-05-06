---
doc: STORY
id: STORY-087
title: Regroupement par brand dans Grid et Flex
epic: EPIC-9
status: done
priority: P1
requirements: [FR-044]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-087 — Regroupement par brand dans Grid et Flex

## Phase 1 — Analyse

Suite de STORY-085 : maintenant que chaque modèle porte un `brandId`/`brandDisplayName`, l'utilisateur veut voir cette information **structurellement** dans la grille de génération, pas seulement dans le sélecteur.

- **Mode Grid** : sections séparées par brand, chaque section a un titre (ex: "Google"), trié par `brandSortOrder`.
- **Mode Flex** : conserver les colonnes 1 carte/modèle, mais regrouper visuellement les colonnes d'une même brand sous un **header partagé unique** (au lieu d'un header par colonne).

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-044 : en mode Grid, les cartes sont sectionnées par brand, header visible, ordre `brandSortOrder` stable.
- [x] FR-044 : en mode Flex, les colonnes d'une même brand sont regroupées sous un header brand unique (ex: "Google" couvre 3 colonnes).
- [x] Pas de régression du PromptSwitcher (FR-040) ni du tag gateway sur les cards (FR-043).

**Tâches** :
1. Calculer dans `GenerationGrid` les `brandGroups: Array<{brand, models[]}>` à partir de `props.models` filtrés par `modelIds` actifs.
2. Refactorer la branche `mode === 'grid'` : itérer brandGroups → titre + sub-grid.
3. Refactorer la branche `mode === 'flex'` : itérer brandGroups → row header + row de cards.
4. Tests : 2 nouveaux dans `GenerationGrid.test.ts`.

## Phase 3-6

Standard.
