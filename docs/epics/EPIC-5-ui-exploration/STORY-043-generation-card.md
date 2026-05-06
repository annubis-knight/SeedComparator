---
doc: STORY
id: STORY-043
title: Composant GenerationCard (image + méta + actions)
epic: EPIC-5
status: done
priority: P0
requirements: [FR-018, FR-013, FR-016]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-043 — GenerationCard

## Livré

- `app/components/generation/GenerationCard.vue` :
  - 4 états visuels (`pending`, `success`, `failed`, `aborted`) gérés par template conditionnel.
  - En `pending` : skeleton animé "... génération".
  - En `success` : image + boutons Détails (`ℹ`) et Sauvegarder (`⬇`).
  - En `failed` : code erreur + message bref (text-danger).
  - En `aborted` : "annulé" en gris.
  - Affiche `seed`, coût USD format `$0.000`, nom du modèle.

## Validation (4 tests)

```ts
// @requirement: FR-013, FR-018 — affiche un skeleton en pending ✅
// @requirement: FR-018 — affiche l'image quand status=success ✅
// @requirement: FR-016 — affiche le code et message d'erreur en failed ✅
// @requirement: FR-018 — affiche le seed et le coût formatés ✅
```

`tests/unit/components/GenerationCard.test.ts` : 4/4 ✅.

## Self-review

- [x] Composant pur : reçoit `gen` en prop, n'appelle pas d'API.
- [x] Émissions : `open` (lightbox), `details` (vue approfondie), `save`.
