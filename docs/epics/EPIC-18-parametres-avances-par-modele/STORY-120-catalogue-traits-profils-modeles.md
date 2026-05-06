---
doc: STORY
id: STORY-120
epic: EPIC-18
title: Catalogue de traits + profils par modèle (backend)
slug: catalogue-traits-profils-modeles
status: done
priority: P1
requirements: [FR-077, FR-078]
version: 1.0.0
last_updated: 2026-05-06
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# STORY-120 — Catalogue de traits + profils par modèle

## Analyse

Aujourd'hui chaque adapter (`fal.ts`, `openai.ts`, `google-ai.ts`) hardcode ses paramètres dans le body API : `image_size`, `quality`, `personGeneration`, etc. Aucune source de vérité partagée, aucune métadonnée UI exploitable côté frontend, aucune validation des overrides.

On introduit un **catalogue de traits unique** (`server/providers/paramTraits.ts`) où chaque trait porte tout ce qu'il faut savoir : key canonique, label FR, tooltip pédagogique, schéma Zod de validation, métadonnées UI (`kind`, range, options, défaut), `scope` (`global` ou `per-generation`), et optionnellement `affectsCost`.

Un fichier compagnon `modelParamProfiles.ts` compose, par modèle, la liste des traits utilisés + des overrides locaux (un défaut différent, un range plus restreint). L'endpoint `GET /api/models` résout cette composition et renvoie au frontend une liste plate de `ParamFieldMeta` par modèle — le frontend ignore la notion de trait.

**Risques** :
- Le nom canonique d'un trait (ex : `guidanceScale`) peut entrer en conflit avec des conventions d'API (ex : Fal utilise `guidance_scale`, Imagen utilise un nom différent). On gère via une fonction `toApiKey(modelId, traitKey)` au moment de la sérialisation API — mais cette fonction est dans STORY-121, pas ici.
- Le schéma Zod doit produire des erreurs claires côté serveur (pour STORY-121). On standardise les messages d'erreur dans cette story.

**Inconnues** :
- Vérifier si tous les `kind` UI prévus (slider-continuous, slider-stepped, segmented, select, radio, toggle, number-with-random, textarea, number) couvrent bien les besoins de **tous** les modèles listés. Ouvrir une fenêtre pour ajouter `file-upload` si besoin de `referenceImage` côté STORY-128 (per-generation).

## Critères d'acceptation

| Critère | FR |
|---|---|
| `server/providers/paramTraits.ts` existe et exporte un objet `PARAM_TRAITS` constant typé | FR-077 |
| Chaque trait porte au minimum : `key`, `label`, `tooltip` (non-vide), `kind`, `zod`, `default`, `scope` | FR-077 |
| Les `kind` autorisés sont un union type fermé : `'slider-continuous' \| 'slider-stepped' \| 'segmented' \| 'select' \| 'radio' \| 'toggle' \| 'number-with-random' \| 'textarea' \| 'number'` | FR-077 |
| Le catalogue couvre au moins les traits suivants : `seed`, `guidanceScale`, `numInferenceSteps`, `negativePrompt`, `safetyTolerance`, `outputFormat`, `outputCompression`, `enableSafetyChecker`, `numImages`, `openaiQuality`, `openaiStyle`, `openaiBackground`, `openaiModeration`, `imagenPersonGeneration`, `imagenAddWatermark`, `imagenNegativePrompt`, `geminiTemperature`, `geminiImageSize`, `falImageUrl`, `falImagePromptStrength` | FR-077 |
| `seed` et `falImageUrl` portent `scope: 'per-generation'` ; tous les autres portent `scope: 'global'` | FR-078 |
| `server/providers/modelParamProfiles.ts` exporte un objet `MODEL_PROFILES: Record<string, ModelProfile>` couvrant les 15 modèles du registry | FR-077 |
| Une fonction `resolveModelParamFields(modelId)` retourne la liste plate `ParamFieldMeta[]` (traits + overrides appliqués), prête à être sérialisée en JSON | FR-077 |
| Une fonction `validateModelParams(modelId, params, scope)` valide un objet de params via le Zod composé du modèle pour le scope donné — rejette toute clé inconnue et toute valeur hors-range | FR-077 |
| Une fonction `defaultsForModel(modelId, scope)` retourne le record `{ key: defaultValue }` du modèle pour le scope donné | FR-077 |
| `GET /api/models` enrichit chaque `ModelDTO` avec `paramFields: ParamFieldMeta[]` (uniquement les traits `scope: global` à ce stade — les `per-generation` seront ajoutés en STORY-128) | FR-077 |
| Tests unitaires sur `resolveModelParamFields` (pas de duplication, overrides appliqués), `validateModelParams` (cas valides + invalides), `defaultsForModel` (consistance) — couverture cible 100 % de ces deux fichiers | FR-077 |
| Aucun trait n'a un `tooltip` vide ou égal à son `label` (test garde-fou qui itère sur `PARAM_TRAITS`) | FR-077 |

## Tâches techniques (TDD strict)

1. **Red** : écrire les tests pour `resolveModelParamFields`, `validateModelParams`, `defaultsForModel` et le garde-fou tooltip.
2. **Green** : créer `paramTraits.ts` (catalogue) puis `modelParamProfiles.ts` (composition) puis `paramResolver.ts` (les 3 fonctions).
3. **Green** : étendre le DTO `ModelDTO` dans `shared/contracts.ts` (`paramFields: ParamFieldMeta[]`), ajuster l'endpoint `GET /api/models`.
4. **Refactor** : nommage, JSDoc sur chaque trait expliquant pourquoi il existe et quel(s) modèle(s) il sert.

## Notes d'implémentation

- Le `kind` `slider-stepped` est destiné aux entiers à petit cardinal (steps 1–8 sur Schnell, 1–50 sur Pro/SD). Le `slider-continuous` est pour les flottants (CFG 1–20, temperature 0–2).
- Les ranges et défauts sont issus de la recherche faite dans la conv (`num_inference_steps`: 4 sur Schnell, 28 sur Pro/SD ; `guidance_scale`: 3.5 défaut Flux/SD ; `safety_tolerance`: 1–6 chez Fal Pro Ultra).
- Les overrides `MODEL_PROFILES['flux-1.1-schnell'].overrides.numInferenceSteps = { default: 4, max: 8 }` ne touchent pas le trait original — ils sont appliqués au résultat de `resolveModelParamFields`.
- Aucun appel API réseau dans cette story — c'est de la déclaration et de la validation pure. Tests rapides, 0 dépendance réseau.
