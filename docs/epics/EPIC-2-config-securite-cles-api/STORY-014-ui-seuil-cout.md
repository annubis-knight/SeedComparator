---
doc: STORY
id: STORY-014
title: UI de modification du seuil de coût + dossier de sauvegarde par défaut
epic: EPIC-2
status: proposed
priority: P1
requirements: [FR-004, FR-005]
version: 0.1.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-014 — UI seuil de coût + dossier par défaut (POST-V1)

## Statut : partiellement implémentée en V1

## État actuel

- ✅ Le seuil `cost_threshold_usd` est seedé en DB (`prisma/seed.ts`, valeur défaut `0.5`).
- ✅ Le setting `save_folder` est seedé en DB (valeur vide).
- ✅ L'endpoint `PUT /api/settings` accepte des updates de Setting génériques (`SettingUpsertSchema`).
- ✅ L'IPC `dialog:selectFolder` côté Electron est livré et fonctionne.
- ❌ Le seuil n'est **pas lu** dans `app/pages/index.vue` : la valeur est hardcodée `COST_THRESHOLD_DEFAULT = 0.5`.
- ❌ Le dossier par défaut n'est **pas pré-rempli** quand l'utilisateur clique "Sauvegarder" : le dialog s'ouvre toujours sans valeur initiale.
- ❌ Aucun champ UI dans `settings.vue` pour modifier ces deux valeurs.

## Périmètre à livrer

### FR-005 — UI seuil de coût
- Section "Coûts" dans `settings.vue` : input numérique `step=0.05`, default lu depuis `GET /api/settings`.
- Au change → `PUT /api/settings { key: 'cost_threshold_usd', value: '<x>' }`.
- `app/pages/index.vue` lit le seuil au mount via `useSettings()` (composable à créer) au lieu de hardcoder.

### FR-004 — Dossier de sauvegarde par défaut
- Section "Sauvegarde" dans `settings.vue` : champ readonly avec le path actuel + bouton "Choisir un dossier" → IPC `selectFolder` → `PUT /api/settings { key: 'save_folder', value: '<path>' }`.
- Quand l'utilisateur clique "Sauvegarder" sur une image / session :
  - Si `save_folder` est défini → utiliser directement (pas de dialog).
  - Sinon → ouvrir le dialog comme actuellement.
- Toujours offrir un bouton "Choisir un autre dossier" pour override ponctuel.

## Pourquoi pas en V1

- Le seuil hardcodé à 0.5 USD est fonctionnel : les modals de confirmation se déclenchent correctement.
- Le dossier sans pré-remplissage demande un clic de plus mais ne casse pas le flow.
- C'était de la couture UX — pas critique pour la validation V1.

## Critères d'acceptation (à valider quand livrée)

- [ ] Composable `useSettings()` créé (charge `/api/settings` au mount, expose `get(key)` et `set(key, value)`).
- [ ] `index.vue` utilise `useSettings().get('cost_threshold_usd')` au lieu de la constante hardcodée.
- [ ] Section UI "Coûts" dans `settings.vue` : input numérique fonctionnel.
- [ ] Section UI "Sauvegarde" dans `settings.vue` : bouton "Choisir dossier" + affichage du chemin actuel.
- [ ] La sauvegarde d'une image utilise le dossier par défaut s'il est défini.
- [ ] Test integration `PUT /api/settings` avec `cost_threshold_usd` : valeur persistée.

## Lien tests post-V1

- À ajouter : test integration mutation + lecture des settings.
