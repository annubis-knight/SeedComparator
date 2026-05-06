---
doc: STORY
id: STORY-012
title: Bouton "Tester la clé" + endpoint de ping minimal
epic: EPIC-2
status: proposed
priority: P1
requirements: [FR-002]
version: 0.1.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-012 — Tester la clé API (POST-V1)

## Statut : non implémentée en V1

## Périmètre prévu

- Bouton "Tester" à côté de chaque champ clé dans `app/pages/settings.vue`.
- Au clic : appel `POST /api/settings/keys/test` avec `{ providerId, apiKey }`.
- Côté serveur : ping minimal du provider (le moins coûteux possible) :
  - **OpenRouter** : `GET /api/v1/auth/key` (gratuit, retourne info sur la clé).
  - **Fal.ai** : pas d'endpoint "key info" public — appeler un modèle peu cher avec un prompt très court (ex: `flux/schnell` à $0.01) ou utiliser `GET /v1/usage` si disponible. À vérifier dans la doc Fal.ai au moment de l'implémentation.
- Réponse : `{ valid: boolean, info?: string, error?: string }`.
- UI : badge ✓ vert ou ✗ rouge avec tooltip détail.

## Pourquoi pas en V1

- Pas critique pour le fonctionnement : si la clé est mauvaise, la première vraie génération renverra `unauthorized` qui est déjà bien remonté par les adapters (test verified : `// @requirement: FR-016`).
- Endpoint Fal.ai à confirmer (pas d'API officielle "validate key") → demande exploration technique post-V1.

## Critères d'acceptation (à valider quand livrée)

- [ ] Endpoint `POST /api/settings/keys/test` validé via Zod.
- [ ] Test integration : clé `fake-invalid` → `valid: false`.
- [ ] Test integration : clé valide (mock) → `valid: true`.
- [ ] UI Settings : indicateur de statut visible après clic.
- [ ] Aucun coût provider engagé pour OpenRouter (utilisation `auth/key`).
- [ ] Coût Fal.ai du test < $0.02 par clic.

## Lien tests post-V1

À ajouter une fois implémenté :
- `tests/integration/api.test.ts > POST /api/settings/keys/test (succès + échec)`.
- Front-matter passera de `proposed` → `done` + `version: 1.0.0`.
