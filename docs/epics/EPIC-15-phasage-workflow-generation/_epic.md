---
doc: EPIC
id: EPIC-15
title: Phasage workflow génération (Wireframe / Mood / UI-UX Design)
slug: phasage-workflow-generation
status: in_progress
priority: P1
requirements: [FR-053, FR-054, FR-057, FR-058, FR-059, FR-069, FR-070, FR-071, FR-072]
stories_total: 4
stories_done: 1
stories_in_progress: 0
progress: 25%
version: 1.1.0
last_updated: 2026-05-06
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-15 — Phasage workflow génération

## Objectif

Structurer la vue Génération autour du **cycle de création de design** en trois phases séquentiellement libres :

1. **Wireframe** — structuration de la mise en page (low-fidelity, no color).
2. **Mood** — direction artistique (palette, matières, valeurs de marque).
3. **UI-UX Design** — finition pixel-perfect (composants, typographie, rendering).

Chaque phase dispose de ses propres prompts A/B/C (9 prompts au total par session). Les générations portent un champ `phase` tracé en DB. L'historique (`/sessions`) est enrichi de filtres par phase et respecte la règle de visibilité RAM vs DB pour les non-likées.

## Stories

| ID | Titre | Statut |
|---|---|---|
| STORY-105 | Sélecteur de phase + 9 prompts persistés par session | proposed |
| STORY-106 | Cycle de vie mémoire vive vs DB (non-likées RAM, purge close, délike supprime) | proposed |
| STORY-107 | Vue Historique enrichie — filtres phase + variant + visibilité conditionnelle | proposed |
| STORY-112 | Vocabulaire v1.2 + prompts par phase enrichis (prompt morphing) | done |

## Critère de fin d'épique

- [x] STORY-112 done — vocabulaire v1.2.0 (8 groupes, 472 termes, 4 nouvelles catégories) + 9 templates de prompts autonomes (text-only, sans variables, sans syntaxe modèle) + system prompts helper & Brief Assistant enrichis (pont valeur→visuel, collisions conceptuelles).
- [ ] STORY-105 / 106 / 107 `done`.
- [ ] Migration Prisma appliquée (`promptsByPhase`, `Generation.phase`).
- [ ] Pipeline `lint + typecheck + test + build + check:secrets` 100% vert.
- [ ] Smoke test runtime : créer une session, switcher entre Wireframe/Mood/UI-UX, vérifier que les prompts sont bien sauvegardés par phase, liker une image, fermer/rouvrir, vérifier que seule la likée est visible dans l'historique.
