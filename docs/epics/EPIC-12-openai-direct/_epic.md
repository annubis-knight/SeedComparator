---
doc: EPIC
id: EPIC-12
title: OpenAI direct (gateway openai + 5 modèles)
slug: openai-direct
status: done
priority: P1
requirements: [FR-056]
stories_total: 1
stories_done: 1
stories_in_progress: 0
progress: 100%
version: 1.0.0
last_updated: 2026-05-01
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-12 — OpenAI direct

## Objectif

Ajouter une 4ᵉ gateway `openai` qui parle directement à l'API OpenAI Platform (clé `sk-...`), distincte d'OpenRouter (qui reste en place pour `gpt-image-1.5`).

Avantages :
- **Économie** : pas de marge OpenRouter (typiquement 5-10%) sur les modèles OpenAI consommés en volume.
- **Catalogue élargi** : modèles non routés par OpenRouter (DALL-E 2, gpt-image-1-mini, et surtout **GPT Image 2** sorti 2026-04-21).
- **Accès au flagship 2026** : GPT Image 2 (#1 Image Arena) avec text rendering parfait, photoréalisme, jusqu'à 4K.

## Stories

| ID | Titre | Statut |
|---|---|---|
| STORY-095 | Adapter openai + 5 modèles sous brand OpenAI | done |

## Critère de fin d'épique

- [x] STORY-095 done.
- [x] DB seedée : provider `openai` + 5 modèles (gpt-image-1-mini, dall-e-2, dall-e-3, gpt-image-1, gpt-image-2).
- [x] Adapter `openai.ts` testé : 14 tests unit (prompt exact, auth, b64_json/quality params différenciés par famille, 401/429/500, abort, decode).
- [x] `gpt-image-1.5` (via OpenRouter) coexiste — id distinct, brand OpenAI partagée.
- [ ] L'utilisateur peut saisir une `OPENAI_API_KEY` dans Réglages → Passerelles (à vérifier runtime côté utilisateur).
- [ ] Une génération `gpt-image-2` retourne une image base64 valide (à vérifier runtime avec vraie clé).
