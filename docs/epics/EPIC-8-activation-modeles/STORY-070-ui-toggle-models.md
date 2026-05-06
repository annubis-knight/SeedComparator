---
doc: STORY
id: STORY-070
title: UI Réglages — toggle activation par modèle
epic: EPIC-8
status: done
priority: P1
requirements: [FR-032]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-070 — UI activation modèles

## Livré

- `app/pages/settings.vue`, section "Modèles" :
  - Liste tous les modèles (DB) avec une checkbox liée à `Model.enabled`.
  - Affiche le nom du modèle + tarif format `$0.000`.
  - Au change, appelle `useModels().toggle(modelId, checked)` qui POST `PATCH /api/models` puis recharge la liste.
- `app/composables/useModels.ts` : méthode `toggle(modelId, enabled)`.

## Validation

- Smoke runtime : décocher un modèle → recharger l'écran d'exploration → le modèle disparaît du sélecteur.
- `// @requirement: FR-032` — implémenté.

## Self-review

- [x] La désactivation est persistée en DB (`Model.enabled`).
- [x] L'endpoint `/api/generate` filtre `where: { id: { in: modelIds }, enabled: true }` → un modèle désactivé est ignoré même si l'UI le pousse.
- [x] La désactivation est différente de "pas de clé API" (FR-003) : un modèle désactivé n'apparaît pas du tout, un modèle sans clé apparaît grisé.
