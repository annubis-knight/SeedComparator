---
doc: STORY
id: STORY-051
title: Action "Relancer sur ce modèle" (formulaire + endpoint)
epic: EPIC-6
status: proposed
priority: P1
requirements: [FR-022]
version: 0.1.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-051 — Relance sur un seul modèle (POST-V1)

## Statut : non implémentée en V1

## Périmètre prévu

- Bouton "Relancer sur ce modèle" dans la vue détail (`sessions/[id].vue`) sur chaque carte de génération.
- Formulaire pré-rempli :
  - Prompt éditable.
  - Seed verrouillable (checkbox "Réutiliser le seed actuel" si `model.supportsSeed`).
  - Ratio héritée par défaut.
- Réutiliser l'endpoint `POST /api/generate` avec `prompts: [editedPrompt]` + `modelIds: [thisModelId]`.
- Au retour, créer une **nouvelle Session** liée à la précédente (champ `parentSessionId` à ajouter au schéma Prisma — migration nécessaire).

## Pourquoi pas en V1

- L'utilisateur peut déjà relancer manuellement depuis la page principale en cochant un seul modèle. La V1 a privilégié les bases (génération multi).
- Cette story implique une migration DB (`parentSessionId`) et une UI dédiée → scope dépassait le budget initial.

## Critères d'acceptation (à valider quand livrée)

- [ ] Bouton "Relancer" visible sur chaque carte en mode détail.
- [ ] Formulaire pré-rempli avec le prompt original.
- [ ] Seed verrouillable si supporté par le modèle.
- [ ] Nouvelle session créée et liée à la session source.
- [ ] Test integration `POST /api/generate` avec `parentSessionId` retourne la nouvelle session.
