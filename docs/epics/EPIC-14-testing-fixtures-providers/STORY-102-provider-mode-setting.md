---
doc: STORY
id: STORY-102
epic: EPIC-14
title: Setting runtime + dropdown Paramètres pour mode provider
status: done
version: 1.0.0
last_updated: 2026-05-02
priority: P1
requirements: [FR-063]
synced_with: [_epic.md, ../../REQUIREMENTS.md, ../../../PROGRESS.md]
---

# STORY-102 — Mode provider configurable runtime

## 1. Analyse

Le mode provider doit être :
- Lisible au boot depuis `.env` (`PROVIDER_MODE`).
- Surchargeable runtime depuis l'UI (dropdown dans `app/pages/settings.vue`).
- Persisté en DB via la table `Setting` (clé `provider.mode`).

**Source de vérité** :
1. Si la DB contient `provider.mode` → c'est lui qui gagne.
2. Sinon, fallback sur `runtimeConfig.providersMode` (env).
3. Sinon, défaut `'live'`.

## 2. Plan + critères d'acceptation

### Critères d'acceptation
- AC-1 : `.env.example` contient `PROVIDER_MODE=live` (commenté avec les 3 valeurs possibles).
- AC-2 : `nuxt.config.ts` expose `providersMode` dans `runtimeConfig`. La variable historique `providersMockMode` reste pour la compat (calculée depuis `providersMode === 'mock'`).
- AC-3 : `server/services/providerMode.ts > getProviderMode()` renvoie `mock | mock-real | live` selon la cascade DB > env > 'live'.
- AC-4 : `server/api/settings/index.put.ts` valide via Zod que la valeur de `provider.mode` est dans l'enum.
- AC-5 : `app/pages/settings.vue` affiche un dropdown "Mode provider" avec les 3 options et le mode courant pré-sélectionné. Au changement, appel `PUT /api/settings` avec `{key: 'provider.mode', value: ...}`.
- AC-6 : Le banner "mode mock actif" s'affiche correctement pour `mock` et `mock-real` (pas pour `live`).
- AC-7 : `useRuntimeConfig().public.providerMode` exposé pour lecture client.

### Tâches techniques

1. **Red** : `tests/unit/contracts.test.ts` — `ProviderModeSchema` accepte les 3 valeurs, rejette le reste.
2. **Green** : étendre `shared/contracts.ts`.
3. **Green** : créer `server/services/providerMode.ts`.
4. **Green** : adapter `nuxt.config.ts` (lire `PROVIDER_MODE`, exposer `providersMode` runtimeConfig + `public.providerMode`).
5. **Green** : adapter `server/api/generate.post.ts` pour appeler `getProviderMode()`.
6. **Green** : ajouter section dropdown dans `app/pages/settings.vue`.
7. **Green** : MAJ `.env.example`.
8. **Self-review** + lint + tests + typecheck.

## 3. Tests fonctionnels

| Test | FR couvert |
|---|---|
| `contracts.test.ts > ProviderModeSchema valid` | FR-063 |
| `providerMode.test.ts > DB > env > default` (3 cas) | FR-063 |

## 4. Definition of Done

- [ ] Critères AC-1 à AC-7 cochés.
- [ ] Tests passent.
- [ ] Lint + typecheck verts.
- [ ] `_epic.md` + `PROGRESS.md` à jour.
