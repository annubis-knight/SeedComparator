---
doc: STORY
id: STORY-090
title: Adapter google-ai (Imagen via Gemini API)
epic: EPIC-10
status: done
priority: P1
requirements: [FR-051]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-090 — Adapter google-ai (Imagen)

## Phase 1 — Analyse

API utilisée : **Gemini API** (Google AI Studio) — endpoint `https://generativelanguage.googleapis.com/v1beta/models/{modelName}:predict?key={API_KEY}`.

Auth : header est aussi accepté (`x-goog-api-key`) mais le query param `?key=...` est plus simple. Pour rester cohérent avec les autres adapters (qui utilisent un header `Authorization`), on préfère `x-goog-api-key` côté header.

Format de requête Imagen :
```json
{
  "instances": [{ "prompt": "..." }],
  "parameters": {
    "sampleCount": 1,
    "aspectRatio": "16:9" | "1:1" | "9:16" | "4:3" | "3:4",
    "personGeneration": "ALLOW_ADULT"
  }
}
```

Réponse :
```json
{
  "predictions": [
    { "bytesBase64Encoded": "...", "mimeType": "image/png" }
  ]
}
```

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-051 : adapter `google-ai.ts` qui implémente `ImageGenerator` pour 3 modèles Imagen.
- [x] FR-009 : prompt transmis byte-pour-byte.
- [x] FR-016 : mappage HTTP 401/429/500 → ProviderError correspondant.
- [x] FR-014 : abort propagé.
- [x] Provider DB seedé : `google-ai` (displayName "Google AI Studio").
- [x] 3 modèles Imagen seedés sous brand "Google".
- [x] Mock generator branché en mode mock.

**Tâches** :
1. Créer `server/providers/google-ai.ts` (adapter + définitions modèles).
2. Étendre `server/providers/types.ts` : `source: 'openrouter' | 'fal' | 'google-ai'`.
3. Mettre à jour `server/providers/registry.ts` (real + mock).
4. Mettre à jour `prisma/seed.ts` (provider `google-ai` + 3 modèles).
5. Mettre à jour `server/api/generate.post.ts` si besoin (rien à changer normalement).
6. Tests : `tests/unit/server/providers/google-ai.test.ts`.

## Phase 3 — Dev (TDD)

Cycles Red/Green/Refactor sur l'adapter.

## Phase 4-6

Standard.
