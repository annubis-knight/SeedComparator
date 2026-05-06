---
doc: STORY
id: STORY-124
epic: EPIC-18
title: Paramètres avancés factorisés (canoniques + idiosyncratiques)
slug: panneau-global-modelparamspopover
status: done
priority: P1
requirements: [FR-082]
version: 4.0.0
last_updated: 2026-05-06
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# STORY-124 — Paramètres avancés factorisés

## Historique des versions

- **v1.0.0** — Popover flottant ouvert depuis une icône ⚙ sur `ModelSelector`. **Rejeté** (mauvaise UX : mélange sélection et configuration, masque les contrôles).
- **v2.0.0** — Sections pliables, une par modèle sélectionné, dans `ImageConfigPanel`. **Rejeté** (duplication forte : `outputFormat`, `quality` etc. apparaissent N fois si N modèles l'exposent).
- **v3.0.0** — Factorisation par paramètres **canoniques** mutualisés + sous-section "Spécifique par modèle" pour les idiosyncratiques. **Rejeté** (la sous-section dupliquait toujours : 4 modèles GPT Image montraient 4 fois "Fond" et "Compression"). Le critère "canonique vs idiosyncratique" était mal posé.
- **v4.0.0 (active)** — Factorisation **totale**. Tout trait identique entre N modèles est rendu **une seule fois**, peu importe sa portée. Plus de sous-section.

## Conception v4 : factorisation totale

**Règle unique** : pour chaque trait `scope: global` exposé par les modèles sélectionnés, on rend **un seul** contrôle. La factorisation est totale, peu importe que le trait soit "universel" (ex: `outputFormat` chez 7 modèles) ou "local" (ex: `openaiBackground` chez 4 modèles GPT Image, ou `openaiStyle` chez 1 seul modèle DALL·E 3).

Deux types de contrôles cohabitent dans la liste :

### A. Lignes canoniques (`CanonicalParamRow`)

Pour les concepts dont la sémantique **diverge** entre modèles : `quality` accepte `standard|hd` côté DALL·E mais `low|medium|high` côté GPT Image. Pas de signature commune. → on définit une **échelle canonique homogène** dans `shared/canonicalParams.ts` qui démultiplexe vers les valeurs natives propres à chaque modèle.

Catalogue canonique :

| Canonique | Type | Échelle | Pilote (multiplexé) |
|---|---|---|---|
| **quality** | slider 1–5 | Brouillon → Premium | `openaiQuality` (DALL·E 1-3 → standard, 4-5 → hd ; GPT Image low/medium/high) |
| **outputFormat** | segmented | lossless / balanced / compact | `outputFormat` côté OpenAI (png/webp/jpeg) et Fal (png/jpeg/jpeg) |
| **creativity** | slider 0–10 | Strict → Sauvage | `geminiTemperature` (0→0, 10→2 linéaire) ET `guidanceScale` (0→15, 10→1, **inversé**) |
| **inferenceEffort** | slider 1–5 | Minimal → Maximal | `numInferenceSteps` (Schnell : 1→1, 5→8 ; Pro/SD : 1→10, 5→50) |
| **safetyLevel** | segmented | strict / balanced / permissive | **Multiplexe 3 traits** : `safetyTolerance` + `enableSafetyChecker` (Fal) + `openaiModeration` (OpenAI) |
| **negativePrompt** | textarea | texte libre | `negativePrompt` (SD 3.5, Imagen 4/Fast/Ultra) |

Chaque canonique porte une `Map<modelId, (canonicalValue) => NativeOverrides>` qui démultiplexe la valeur vers les valeurs natives propres à chaque modèle. Le composable `useModelParams` continue de stocker les valeurs **natives** par modèle — la factorisation est purement UI.

### B. Lignes factorisées directes (`FactorizedTraitRow`)

Pour les traits dont la signature est **identique** entre tous les modèles qui les exposent (mêmes options, même range, même sémantique). Pas besoin de canonique : on rend le trait tel quel et on propage la valeur à tous les modèles concernés simultanément. Exemples :

- `openaiBackground` (`auto|transparent|opaque`) — chez 4 modèles GPT Image, **un seul** contrôle.
- `outputCompression` (0–100) — chez 4 modèles GPT Image, **un seul** slider.
- `imagenPersonGeneration` (`allow_adult|allow_all|dont_allow`) — chez 3 modèles Imagen, **un seul** contrôle.
- `imagenAddWatermark` (toggle) — chez 3 modèles Imagen.
- `geminiImageSize` (`512|1K|2K|4K`) — chez 3 modèles Gemini.
- `openaiStyle` (`vivid|natural`) — chez 1 modèle DALL·E 3 (le contrôle apparaît avec "Appliqué à 1 modèle").

Le composant `FactorizedTraitRow.vue` reçoit `field` + `modelIds` + `models`. Au changement, il appelle `setParam(modelId, field.key, value)` pour **chaque** `modelId` concerné. Pas de `ParamRow` interne — il porte son propre header (label + tooltip + compteur "Appliqué à N modèles") et utilise `ParamControl.vue` (dispatch sans wrapper) pour le contrôle nu.

### Shadow store

Les sliders `creativity` et `quality` ne sont pas réversiblement reconstructibles depuis la seule valeur native (l'inversion + l'arrondi rendent le reverse-mapping ambigu). On stocke donc la valeur canonique en parallèle dans `useModelParams` sous des clés préfixées `__canonical__quality`, `__canonical__creativity`, etc. Avant l'envoi serveur, le composable expose `cleanOverridesForServer` qui filtre ces clés (le Zod backend `.strict()` les rejetterait sinon).

## Architecture des fichiers

- `shared/canonicalParams.ts` — catalogue + mappings de démultiplexage (consommé client + server)
- `app/components/session/ImageConfigPanel.vue` — host : ratio + liste plate factorisée
- `app/components/session/CanonicalParamRow.vue` — contrôle canonique, démultiplexe vers les valeurs natives
- `app/components/session/FactorizedTraitRow.vue` — contrôle direct, propage à tous les modèles concernés (v4)
- `app/components/params/ParamControl.vue` — dispatcher sans wrapper, pour les contrôles qui portent leur propre header (v4)
- `app/components/params/ParamField.vue` — dispatcher avec wrapper label+tooltip (usages standards)
- `app/composables/useModelParams.ts` — `cleanOverridesForServer` (filtre le shadow store canonique avant l'envoi serveur)

Composants supprimés au fil des révisions :
- `ModelParamsPopover.vue` (v1, supprimé en v2)
- `ModelParamsSection.vue` (v2, supprimé en v3)
- `IdiosyncraticParamsSection.vue` (v3, supprimé en v4)

## Tests

- `tests/unit/shared/canonicalParams.test.ts` — 21 tests sur le catalogue et les mappings.
- `tests/unit/components/CanonicalParamRow.test.ts` — 10 tests sur le démultiplexage UI.
- `tests/unit/components/FactorizedTraitRow.test.ts` — 5 tests sur la factorisation directe (label unique, propagation à N modèles, compteur singulier/pluriel, slider numérique).
- `tests/unit/components/ImageConfigPanel.test.ts` — 8 tests : factorisation totale (pas de doublon "Fond" pour 4 modèles GPT Image), pas de section "Spécifique par modèle" résiduelle, propagation, scope=per-generation absent.
- `tests/unit/composables/useModelParams.test.ts` — 7 tests dont 2 sur `cleanOverridesForServer`.

## Analyse

Une fois STORY-120 (catalogue + endpoint enrichi), STORY-122 (composants atomiques) et STORY-123 (tooltip) livrées, on peut assembler le **panneau global de paramètres par modèle**.

Cible : ajouter une icône ⚙ sur chaque ligne du `ModelSelector.vue`. Au clic, un popover/drawer s'ouvre listant les `ParamFieldMeta` du modèle (filtrés `scope: 'global'`). L'utilisateur règle, ferme. Un point bleu (badge "modifié") apparaît sur le modèle si au moins un paramètre dévie du défaut.

Les valeurs vivent dans le composable `useGenerationSession` (ou dédié `useModelParams`) : `Record<modelId, Record<paramKey, value>>`. Au lancement de la génération, `useGenerationSession` envoie ces overrides dans `GenerateRequest.globalParams`.

Le panneau "Configuration de l'image" actuel (`ImageConfigPanel.vue`) qui affiche `Qualité` et `Images par prompt` en mode "Disponible quand le provider le supporte (FR-038)" est nettoyé : ces deux lignes deviennent obsolètes (ils étaient des stubs non implémentés). Le ratio reste global de session, hors scope de l'épique.

**Risques** :
- Surcharge UX : le popover doit rester compact. Si un modèle a >8 paramètres, scrollable. Si nombre raisonnable (≤6), tout visible.
- Le badge "modifié" doit refléter exactement la dérive vs défaut, pas vs dernière valeur sauvegardée. Test garde-fou.
- Ne pas casser la fluidité : ouvrir le popover ne doit pas refetch les modèles.

**Inconnues** :
- Décider entre **popover** (apparait à côté du modèle) ou **drawer latéral** (panneau plus large à droite). Décision préliminaire : popover. À valider en QA visuelle.

## Critères d'acceptation

| Critère | FR |
|---|---|
| Sur chaque ligne de `ModelSelector.vue`, une icône ⚙ est visible à droite et cliquable | FR-082 |
| Cliquer sur ⚙ ouvre un `ModelParamsPopover.vue` ancré sur la ligne du modèle | FR-082 |
| Le popover liste **uniquement** les `paramFields` de scope `global` du modèle (les `per-generation` sont gérés ailleurs, STORY-128) | FR-082 |
| Chaque champ est rendu via le bon composant atomique (STORY-122) en fonction de `field.kind` | FR-082 |
| L'icône `i` du tooltip (STORY-123) est présente sur chaque ligne, infobulle = `field.tooltip` | FR-082 |
| Si l'utilisateur modifie au moins un param, un point bleu apparaît sur la ligne du modèle dans `ModelSelector` | FR-082 |
| Un bouton "Réinitialiser les défauts" en bas du popover remet tous les params à leurs `default` | FR-082 |
| Les valeurs sont mémorisées dans un composable `useModelParams` (ou intégrées à `useGenerationSession`) — un changement de page sans changer de session conserve les overrides | FR-082 |
| Au lancement de la génération, les overrides du modèle sélectionné sont envoyés dans `GenerateRequest.globalParams[modelId]` | FR-082 |
| Si un modèle est désactivé (clé manquante / fixture manquante), l'icône ⚙ est désactivée avec tooltip explicatif | FR-082 |
| Test composant Vue Test Utils : ouverture/fermeture du popover, badge "modifié" affiché ssi dévie du défaut, reset défauts fonctionne, valeurs émises au composable parent | FR-082 |
| Les anciens stubs "Qualité" et "Images par prompt" dans `ImageConfigPanel.vue` sont supprimés (remplacés par les paramètres dynamiques par modèle) | FR-082 |

## Tâches techniques

1. Étendre `useGenerationSession` (ou créer `useModelParams`) avec une map `paramOverrides: Record<modelId, Record<paramKey, value>>`.
2. Créer `ModelParamsPopover.vue` qui consomme `model.paramFields` et le composable.
3. Ajouter l'icône ⚙ + handler dans `ModelSelector.vue`.
4. Ajouter le badge "modifié" (point bleu) calculé depuis le composable.
5. Étendre `GenerateRequest` (Zod) pour accepter `globalParams: Record<string, Record<string, unknown>>`. Validation côté serveur via `validateModelParams` (STORY-120).
6. Mise à jour de `server/api/generate.post.ts` : passer `globalParams` à `batchOrchestrator` puis aux adapters.
7. Nettoyer `ImageConfigPanel.vue` : retirer les stubs Qualité / Images par prompt.

## Notes d'implémentation

- Sourcer la valeur affichée dans le composant atomique : `overrides[modelId]?.[key] ?? field.default`.
- Le clic en dehors du popover ferme — pas de bouton "Annuler" séparé. Les modifications sont live (pas de mode brouillon).
- Le popover ne propose **pas** de "sauvegarder comme préréglage" — feature post-V1 listée dans `_epic.md` "Hors scope".
