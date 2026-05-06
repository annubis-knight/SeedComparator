---
doc: STORY
id: STORY-021-022
title: Adapter OpenRouter (4 modèles)
epic: EPIC-3
status: done
priority: P0
requirements: [FR-009, FR-016, FR-033]
version: 1.0.0
last_updated: 2026-04-28
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-021/022 — Adapter OpenRouter

## Livré

- `server/providers/openrouter.ts` : factory `createOpenRouterGenerator()` pour 4 modèles (gemini-3.1-flash-lite, gemini-3.1-flash, gemini-3.1-pro, gpt-image-1.5).
- Mapping ratio → size (`1:1` → `1024x1024`, `16:9` → `1792x1024`, etc.).
- Décodage `b64_json` ou téléchargement de l'`url` retournée par l'API.
- Gestion erreurs : 401/403 → `unauthorized`, 429 → `rate_limited`, 5xx → `server_error`, AbortError → `aborted`.

## Validation (7 tests)

```ts
// @requirement: FR-009 — transmet le prompt utilisateur sans modification ✅
// @requirement: FR-001, NFR-001 — throw unauthorized si pas de clé API ✅
// @requirement: FR-016 — mappe 401 → ProviderError unauthorized ✅
// @requirement: FR-016 — mappe 429 → rate_limited ✅
// @requirement: FR-016 — mappe 500 → server_error ✅
// @requirement: FR-014 — propage AbortError → ProviderError aborted ✅
// @requirement: FR-033 — décode le b64_json et retourne un Buffer ✅
```
7/7 ✅ dans `tests/unit/server/providers/openrouter.test.ts`.
