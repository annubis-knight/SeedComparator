---
doc: EPIC
id: EPIC-2
title: Configuration & sécurité des clés API
slug: config-securite-cles-api
status: in_progress
priority: P0
requirements: [FR-001, FR-002, FR-003, FR-004, FR-005, NFR-001]
stories_total: 6
stories_done: 4
stories_in_progress: 0
stories_proposed: 2
progress: 67%
version: 0.3.0
last_updated: 2026-04-29
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-2 — Configuration & sécurité des clés API

## Objectif

Permettre à l'utilisateur de saisir et stocker ses clés API de manière sécurisée. Aucune clé ne doit fuiter dans le bundle frontend.

## Exigences couvertes

- **FR-001** — Saisie sécurisée des clés API — ✅ verified (test integration `PUT /api/settings/keys`).
- **FR-002** — Test de validité d'une clé — ⚠️ proposed (non implémenté V1).
- **FR-003** — Désactivation visuelle des modèles sans clé — ✅ verified (test composant `ModelSelector`).
- **FR-004** — Choix du dossier de sauvegarde — ✅ verified (IPC `dialog:selectFolder` dans `electron/main.ts`).
- **FR-005** — Configuration du seuil de confirmation — ⚠️ proposed (champ DB `cost_threshold_usd` seedé, UI de modification non livrée — seuil hardcodé à 0.5 dans `app/pages/index.vue`).
- **NFR-001** — Aucune fuite de clé API dans le frontend — ✅ verified (`npm run check:secrets` passe).

## Stories

| ID | Titre | Statut |
|---|---|---|
| [STORY-010](STORY-010-safestorage-ipc.md) | Wrapper safeStorage Electron + IPC d'accès | done |
| [STORY-011](STORY-011-endpoint-keys.md) | Endpoint `PUT /api/settings/keys` + écran réglages | done |
| [STORY-012](STORY-012-test-cle-api.md) | Bouton "Tester la clé" + endpoint de ping | proposed |
| [STORY-013](STORY-013-models-disabled-without-key.md) | Désactivation visuelle des modèles sans clé | done |
| [STORY-014](STORY-014-ui-seuil-cout.md) | Choix du dossier de sauvegarde + seuil de coût (UI partielle) | proposed |
| [STORY-015](STORY-015-check-secrets.md) | Script `check:secrets` qui scanne le bundle frontend | done |

## Critère de fin d'épique

- [x] Les clés sont chiffrées via `safeStorage` Electron (DPAPI Windows).
- [x] Les clés ne sont jamais persistées en DB (table `Provider.apiKeyRef` = identifiant logique seul).
- [x] Aucune clé n'apparaît dans le bundle frontend après build (vérifié par script CI).
- [x] Les modèles sans clé apparaissent grisés.
- [ ] L'utilisateur peut tester une clé avant de l'utiliser.
- [ ] L'utilisateur peut modifier le seuil de coût depuis l'UI Réglages.
