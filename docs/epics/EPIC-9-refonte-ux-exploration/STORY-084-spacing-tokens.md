---
doc: STORY
id: STORY-084
title: Aération visuelle (tokens spacing)
epic: EPIC-9
status: done
priority: P2
requirements: [NFR-004]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-084 — Aération visuelle

## Phase 1 — Analyse

Le rendu actuel utilise `gap-2`, `gap-3`, `p-3`, `p-5` dispersés. L'utilisateur souhaite un visuel plus aéré (NFR-004).

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] Trois tokens d'espacement définis dans `tokens.css` : `--space-card-padding`, `--space-grid-gap`, `--space-section-gap`.
- [x] Application dans GenerationGrid (gap-grid), GenerationCard (padding), SidePanel (sections), index.vue (section gap).
- [x] Aucun test snapshot n'est cassé.

**Tâches** :
1. Ajouter les tokens dans `tokens.css`.
2. Pass de revue sur les 4 fichiers cibles.
3. Smoke test runtime (manuel) — diff `npm run build`.
