---
doc: STORY
id: STORY-121
epic: EPIC-18
title: Adapters — consommation des params résolus (global ∪ per-gen)
slug: adapters-consommation-params
status: done
priority: P1
requirements: [FR-079]
version: 1.0.0
last_updated: 2026-05-06
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# STORY-121 — Adapters : consommation des paramètres résolus

## Analyse

Une fois STORY-120 livrée, le pipeline a un catalogue + des profils + une validation. Reste à câbler ça dans les adapters réels. Aujourd'hui :

- `fal.ts` envoie `{ prompt, image_size, seed }`. On doit en plus envoyer `num_inference_steps`, `guidance_scale`, `safety_tolerance`, `output_format`, `enable_safety_checker`, et pour Flux Pro Ultra `image_url` + `image_prompt_strength`, pour SD 3.5 `negative_prompt`.
- `openai.ts` envoie `quality` figé à `auto`/`standard`. On doit prendre la valeur résolue + ajouter `style` (DALL·E 3), `background` (gpt-image), `output_compression`, `moderation`.
- `google-ai.ts` (Imagen) envoie `personGeneration: 'ALLOW_ADULT'` figé. On doit prendre la valeur résolue + `seed`, `negativePrompt`, `addWatermark`. Pour Gemini Image, ajouter `temperature` dans `generationConfig`, `imageSize`.

Le `GenerateInput` étendu devient :
```ts
interface GenerateInput {
  prompt: string
  ratio: Ratio
  seed?: number | null            // legacy, sera intégré aux params
  globalParams: Record<string, unknown>      // résolu côté server (defaults ⊕ overrides utilisateur)
  perGenerationParams: Record<string, unknown>  // résolu côté server (vide ou rempli pour relance)
}
```

Chaque adapter reçoit ces params et fait son merge propre dans le body API, en utilisant une fonction `toApiKey(modelId, traitKey)` qui sait que `guidanceScale` → `guidance_scale` chez Fal mais → autre nom chez Imagen, etc.

**Risques** :
- Beaucoup de surface API à toucher d'un coup : on découpe par adapter (sous-tâche par adapter, mais 1 seule story car le pattern est identique).
- Les modèles Gemini Image (Nano Banana) acceptent peu de paramètres documentés — risque de payload rejeté si on envoie un champ inconnu. Garde-fou : ne sérialiser que les traits déclarés dans le profil du modèle.
- L'`ImageGenerator.generate` change de signature → impact sur `mock.ts`, `mockReal.ts` (ils doivent juste accepter le nouveau format et l'ignorer).

**Inconnues** :
- Vérifier que Fal accepte bien les paramètres en queue async (pas seulement en sync).
- Vérifier les noms exacts côté Imagen pour `addWatermark` et `negativePrompt` — la conv mentionne ces clés mais nommage à confirmer.

## Critères d'acceptation

| Critère | FR |
|---|---|
| `GenerateInput` est étendu avec `globalParams` et `perGenerationParams` (validés via STORY-120) | FR-079 |
| `fal.ts` consomme les params résolus pour Flux Schnell, Flux Pro, SD 3.5 — couvre `num_inference_steps`, `guidance_scale`, `safety_tolerance`, `output_format`, `enable_safety_checker`, `negative_prompt` (SD 3.5), `image_url` + `image_prompt_strength` (Flux Pro Ultra) | FR-079 |
| `openai.ts` consomme les params résolus pour DALL·E 2/3 et GPT Image 1/1-mini/1.5/2 — couvre `quality`, `style` (DALL·E 3), `background` (gpt-image), `output_compression`, `moderation` | FR-079 |
| `google-ai.ts` consomme les params résolus pour Imagen 4/Fast/Ultra — couvre `personGeneration`, `negativePrompt`, `seed`, `addWatermark`, et pour Gemini Image (Nano Banana) `temperature`, `imageSize` | FR-079 |
| Une fonction `toApiKey(modelId, traitKey)` (dans `paramApiMapping.ts`) traduit chaque clé canonique vers le nom attendu par l'API ciblée | FR-079 |
| Les adapters n'envoient **que** les paramètres déclarés dans le profil du modèle (pas de fuite de clé inconnue dans le body) | FR-079 |
| Les adapters mock (`mock.ts`, `mockReal.ts`) acceptent la nouvelle signature sans la consommer | FR-079 |
| Tests unitaires par adapter qui mockent `fetch` et vérifient que le body POST contient bien les valeurs des params (cas défauts + cas avec overrides) | FR-079 |
| Tests "anti-régression" : un appel sans aucun param explicite produit le **même** body qu'avant la story (les défauts du catalogue STORY-120 doivent reproduire le comportement actuel hardcodé) | FR-079 |

## Tâches techniques (TDD strict, par adapter)

Pour chaque adapter (`fal.ts`, `openai.ts`, `google-ai.ts`) :

1. **Red** : écrire un test qui mock `fetch` et vérifie que le body POST contient les params résolus (cas défaut + cas avec overrides).
2. **Green** : refacto du body builder en consommant `globalParams` + `perGenerationParams`.
3. **Refactor** : extraction du body builder dans une fonction pure testable séparément.

## Notes d'implémentation

- Sérialisation : pour chaque trait du profil du modèle, lire la valeur (overrides ⊕ défauts), la traduire via `toApiKey`, l'écrire dans le body. Pas de switch géant — le mapping vit dans des objets de constantes par source.
- Backward compat : `GenerateInput.seed` est conservé en V1 mais devient **optionnel et redondant** (la seed passe désormais par `perGenerationParams.seed`). Le `batchOrchestrator` fait la migration au moment de la composition.
- Aucun comportement utilisateur ne change tant que `globalParams` et `perGenerationParams` restent à `{}` — c'est la promesse anti-régression.
