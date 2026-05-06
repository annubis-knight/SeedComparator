---
doc: STORY
id: STORY-095
title: Adapter openai direct + 5 modèles sous brand OpenAI
epic: EPIC-12
status: done
priority: P1
requirements: [FR-056]
version: 1.0.0
last_updated: 2026-05-01
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-095 — Adapter openai direct

## Phase 1 — Analyse

API utilisée : **OpenAI Images API** — endpoint `https://api.openai.com/v1/images/generations`.

Auth : header `Authorization: Bearer sk-...`.

Format requête commun (text-to-image) :
```json
{
  "model": "gpt-image-2",
  "prompt": "...",
  "size": "1024x1024" | "1792x1024" | "1024x1792" | "auto",
  "n": 1,
  "quality": "low" | "medium" | "high" | "auto"
}
```

Réponse (en mode b64) :
```json
{
  "data": [
    { "b64_json": "..." }
  ]
}
```

Subtilité : par défaut OpenAI retourne `url` (l'image en S3 expire en 1h). Pour cohérence avec les autres adapters, on demande `response_format: "b64_json"` quand supporté (DALL-E 3, GPT Image 1.x). **GPT Image 2 retourne toujours du b64 par défaut**, pas besoin du paramètre. DALL-E 2 supporte `response_format`.

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-056 : adapter `openai.ts` qui implémente `ImageGenerator` pour 5 modèles.
- [x] FR-009 : prompt transmis byte-pour-byte.
- [x] FR-016 : mappage HTTP 401/429/500 → ProviderError correspondant.
- [x] FR-014 : abort propagé.
- [x] Provider DB seedé : `openai` (displayName "OpenAI Platform").
- [x] 5 modèles OpenAI seedés sous brand "OpenAI".
- [x] Mock generator branché en mode mock.
- [x] Coexistence avec `gpt-image-1.5` (via OpenRouter) — id distinct.

**Tâches** :
1. Créer `server/providers/openai.ts` (adapter + définitions modèles).
2. Étendre `server/providers/types.ts` : `ProviderSource` += `'openai'`.
3. Mettre à jour `server/providers/registry.ts` (real + mock).
4. Mettre à jour `prisma/seed.ts` (provider `openai` + 5 modèles).
5. Tests : `tests/unit/server/providers/openai.test.ts`.

## Phase 3-6

Standard.
