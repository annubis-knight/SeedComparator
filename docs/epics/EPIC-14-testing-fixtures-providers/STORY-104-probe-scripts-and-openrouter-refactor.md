---
doc: STORY
id: STORY-104
epic: EPIC-14
title: Refonte providers (OpenRouter sortant, Imagen 4, Gemini Image) + scripts probe CLI
status: done
version: 1.0.0
last_updated: 2026-05-04
priority: P1
requirements: [FR-051, FR-056, FR-061, FR-062, FR-067, FR-068]
synced_with: [_epic.md, ../../REQUIREMENTS.md, ../../../PROGRESS.md]
---

# STORY-104 — Refonte adapters images + scripts probe CLI

## 1. Analyse

**Problème découvert en runtime** : depuis la vue `/models/test`, le test live d'un modèle OpenRouter (`gemini-3.1-flash-lite`) plantait avec une erreur cryptique `Unexpected token '<', "<!DOCTYPE "...`. Diagnostic via curl :
- L'endpoint `/v1/images/generations` n'existe pas sur OpenRouter (c'est l'API OpenAI Platform). OpenRouter répond avec une page HTML 200 "Not Found".
- L'ID `google/gemini-3.1-flash-lite` n'est pas un modèle d'image (et n'existe d'ailleurs pas — c'est `google/gemini-3.1-flash-image-preview`).
- Le seed Prisma référençait des modèles Imagen 3 (déprécié, remplacé par Imagen 4).

**Décision archi** : tous les modèles d'image accessibles via OpenRouter le sont aussi via leur API native (Google AI Studio, OpenAI Platform). Donc on **retire OpenRouter du circuit images** : moins de marge à payer, format API direct plus stable, parsing plus simple.

**Effets de bord souhaités** :
- L'adapter `openrouter-text.ts` (Brief Assistant — LLM Claude Haiku via OpenRouter) reste **intact**. Il sert pour le texte uniquement.
- Refonte de l'adapter `google-ai.ts` pour gérer **deux familles** : Imagen (`:predict`) et Gemini Image (`:generateContent`).
- Content-Type guard ajouté à tous les adapters pour rejeter les pages d'erreur HTML 200.

**Besoin utilisateur** (en parallèle) : avoir des **scripts CLI dédiés** pour tester chaque modèle/provider hors UI, capturer les fixtures, sans dépenser à l'aveugle.

## 2. Critères d'acceptation

### Refonte adapters
- AC-1 : `OPENROUTER_MODELS` est vide. Aucun modèle image ne pointe sur le gateway `openrouter` en DB.
- AC-2 : `google-ai.ts` accepte deux `family` : `'imagen'` (predict) et `'gemini-image'` (generateContent). Catalogue : 3 Imagen 4 (fast/base/ultra) + 3 Gemini image (Nano Banana / 2 / Pro).
- AC-3 : Tous les adapters rejettent une réponse HTML (Content-Type guard) avec un `ProviderError` clair.
- AC-4 : Le seed Prisma supprime les anciens IDs (`gemini-3.1-flash-lite`, `imagen-3*`, `imagen-4-preview`) via `deleteMany` et insère les nouveaux.
- AC-5 : `gpt-image-1.5` est déplacé d'OpenRouter vers OpenAI direct (pricePerImage 0.030).

### Scripts probe CLI
- AC-6 : Un script `_shared.mjs` exporte `runProbes()` avec : plan + total cost + confirm interactif (`--yes` pour skip), capture fixture automatique, options CLI (`--only`, `--overwrite`, `--dry-run`, `--max-cost`).
- AC-7 : Un script par provider : `probe-openai.mjs`, `probe-google-ai.mjs`, `probe-fal.mjs`, `probe-openrouter.mjs` (dernier vide par défaut).
- AC-8 : Un orchestrateur `probe-all.mjs` chaîne les 3 (Fal → OpenAI → Google AI, ordre coût croissant).
- AC-9 : npm scripts : `probe:openai`, `probe:google-ai`, `probe:fal`, `probe:openrouter`, `probe:all`, `probe:dry-run`.
- AC-10 : Les fixtures écrites par les scripts sont **rejouables** en mode `mock-real` sans modification (même format que `fixtureWriter.ts`).
- AC-11 : Le prompt utilisé est exactement `PROMPT_PREFIX_A` (un seul prompt par modèle, suffisant pour valider l'intégration).

## 3. Implémentation (résumé)

| Fichier | Changement |
|---|---|
| `server/providers/google-ai.ts` | Refonte : 2 familles (imagen/gemini-image), catalogue `imagen-4-{fast,base,ultra}` + `gemini-{2.5-flash,3.1-flash,3-pro}-image*` |
| `server/providers/openrouter.ts` | `OPENROUTER_MODELS` vide. Adapter conservé pour compat (avec format chat/completions multimodal au cas où) |
| `server/providers/openai.ts` | Ajout `gpt-image-1.5` ($0.030). Content-Type HTML guard |
| `server/providers/fal.ts` | Content-Type HTML guard |
| `prisma/seed.ts` | Supprime anciens IDs, ajoute nouveaux. Brand "Google" regroupe Imagen + Gemini Image |
| `scripts/probe-providers/_shared.mjs` | Helpers : env loader, plan, confirm, fixture writer, ProbeError |
| `scripts/probe-providers/probe-{openai,google-ai,fal,openrouter}.mjs` | Un par provider |
| `scripts/probe-providers/probe-all.mjs` | Orchestrateur séquentiel |
| `package.json` | 6 scripts npm `probe:*` |
| `tests/unit/server/providers/google-ai.test.ts` | Refonte : 12 tests (8 imagen + 4 gemini-image) |
| `tests/unit/server/providers/openrouter.test.ts` | **Supprimé** (catalogue vide) |

## 4. Comment tester un modèle en CLI

```bash
# Plan + dry-run (gratuit, n'appelle pas l'API)
npm run probe:dry-run

# Tester un seul modèle
npm run probe:openai -- --only=dall-e-2

# Tester tout un provider
npm run probe:fal

# Tout tester
npm run probe:all

# Re-capturer une fixture existante
npm run probe:openai -- --only=dall-e-2 --overwrite

# Skip la confirmation
npm run probe:openai -- --yes

# Plafond de coût
npm run probe:all -- --max-cost=0.10
```

## 5. Definition of Done

- [x] AC-1 à AC-11 cochés.
- [x] Tests unit verts (164/164, dont 12 google-ai).
- [x] Lint + typecheck server vert.
- [x] Tous les scripts probe testés en `--dry-run` (pas d'appel réel sans autorisation utilisateur).
- [x] Doc à jour (ce fichier, REQUIREMENTS.md FR-067/FR-068, PROGRESS.md, README.md section CLI).
