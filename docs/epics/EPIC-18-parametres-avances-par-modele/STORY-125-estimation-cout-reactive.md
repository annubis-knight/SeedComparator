---
doc: STORY
id: STORY-125
epic: EPIC-18
title: Estimation de coût réactive aux paramètres affectsCost
slug: estimation-cout-reactive
status: done
priority: P1
requirements: [FR-083]
version: 1.0.0
last_updated: 2026-05-06
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# STORY-125 — Estimation de coût réactive

## Analyse

Certains paramètres impactent le prix de l'image. Cas connu : `quality: 'hd'` sur DALL·E 3 = ×2 le tarif. `quality: 'high'` sur GPT Image vs `low` impacte le coût aussi (token-based). Steps élevés sur SD 3.5 augmentent le temps mais pas directement le prix Fal (forfait par image), donc pas tous les paramètres impactent le prix.

Solution : chaque trait peut porter `affectsCost: true` + une fonction `costMultiplier(value): number` (ou `costAdjustment` absolu). `costEstimator` consomme ces données et recalcule le coût d'une génération à partir du `pricePerImage` × le multiplicateur résolu.

L'UI :
- Le tooltip `i` du paramètre `affectsCost` indique l'impact ("+0,04 $ / image en `hd`").
- L'estimation pré-génération (`CostMeter` + modal de confirmation FR-011) tient compte des overrides.
- Le compteur de coût session reste basé sur le coût **réel** retourné par chaque génération (post-API) — donc inchangé.

**Risques** :
- Le multiplicateur n'est qu'une **estimation** : OpenAI gpt-image facture par token, on ne peut pas être exact à l'avance. Documenter dans le tooltip que c'est indicatif.
- Si un trait `affectsCost` voit son sémantique changer côté provider, on doit mettre à jour le multiplicateur. Centralisation dans `paramTraits.ts` aide.

**Inconnues** :
- Confirmer le ×2 DALL·E 3 hd (vs standard). Probable mais à vérifier dans la doc OpenAI 2026.

## Critères d'acceptation

| Critère | FR |
|---|---|
| Le type `ParamFieldMeta` étendu peut porter `affectsCost?: { multiplier?: (v: unknown) => number; addition?: (v: unknown) => number }` | FR-083 |
| Au moins ces traits sont annotés `affectsCost` : `openaiQuality` (DALL·E 3 hd ×2 ; GPT Image low/medium/high), `imagenAddWatermark` (non, ne change pas le prix — exemple à exclure) | FR-083 |
| `costEstimator` calcule le coût d'une génération comme : `pricePerImage × ∏ multipliers + Σ additions`, en parcourant les overrides des traits `affectsCost` du modèle | FR-083 |
| `CostMeter` (session) et la modal d'estimation pré-génération reflètent le coût ajusté | FR-083 |
| Le tooltip `InfoTooltip` du paramètre `affectsCost` mentionne l'impact en clair (ex : "Augmente le coût × 2 par rapport à `standard`") | FR-083 |
| Tests unitaires sur `costEstimator` couvrant : pas d'override (= coût de base), override `affectsCost` (multiplicateur appliqué), plusieurs overrides cumulés | FR-083 |
| Test integration `POST /api/generate` : le coût retourné dans `GenerationDTO.costUsd` correspond au coût ajusté quand l'utilisateur a opté pour `quality=hd` | FR-083 |

## Tâches techniques

1. Étendre `ParamFieldMeta` dans `shared/contracts.ts` pour porter `affectsCost`.
2. Annoter les traits concernés dans `paramTraits.ts`.
3. Refacto `costEstimator.ts` : signature `estimate(modelId, count, overrides)` au lieu de `estimate(modelId, count)`.
4. Brancher dans `useGenerationSession` (lit les overrides) → `CostMeter` + modal.
5. Mise à jour des tooltips concernés (le texte mentionne l'impact).
6. Tests unitaires + integration.

## Notes d'implémentation

- Le multiplicateur DALL·E 3 hd ×2 est documenté côté OpenAI (à vérifier au moment de l'implémentation, prix 2026).
- Pour gpt-image qui est token-based : on documente le tooltip avec une **fourchette indicative** plutôt qu'un chiffre exact (`low ≈ 0.011 $`, `high ≈ 0.053 $`). Pas d'illusion de précision.
- Le coût **réel** de chaque génération vient toujours de la réponse API (champ `costUsd` dans `GenerateOutput`). L'estimation est uniquement pour la prévisualisation pré-lancement.
