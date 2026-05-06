---
doc: STORY
id: STORY-108
epic: EPIC-16
title: Adapter Gemini text + route Nitro /api/helper/chat
slug: adapter-gemini-text-route-helper
status: proposed
priority: P2
requirements: [FR-073]
version: 1.0.0
last_updated: 2026-05-05
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# STORY-108 — Adapter Gemini text + route Nitro `/api/helper/chat`

## Analyse

La gateway `google-ai` existe déjà pour la génération d'images. On doit ajouter un adapter **texte** distinct pour le chatbot — il parle au même provider mais via un endpoint différent (`generateContent` avec modèle `gemini-2.0-flash-lite`). La clé API est déjà stockée (`GOOGLE_AI_API_KEY` / `safeStorage`).

La route Nitro `/api/helper/chat` doit :
- Accepter un `{ messages: [{role, content}], phase: 'wireframe' | 'mood' | 'uiux' }`.
- Sélectionner le system prompt correspondant à la phase.
- Appeler Gemini et retourner la réponse (streaming SSE préféré, JSON acceptable pour la V1).
- Persister la conversation dans une table `HelperConversation` en DB.

**Risques** :
- Gemini free tier a des limites de débit (60 req/min) — il faut gérer le 429 proprement.
- Le modèle `gemini-2.0-flash-lite` (ou équivalent gratuit) à confirmer au moment du dev : vérifier le catalogue actuel de l'API Gemini.

## Critères d'acceptation

| Critère | FR |
|---|---|
| Un adapter `server/providers/gemini-text.ts` fait appel à l'API Gemini `generateContent` avec un historique de messages | FR-073 |
| Le system prompt est sélectionné par phase (`wireframe` / `mood` / `uiux`) depuis `shared/contracts.ts` | FR-073 |
| La route `POST /api/helper/chat` valide l'input (Zod), appelle l'adapter, retourne la réponse | FR-073 |
| La conversation est persistée en DB (table `HelperConversation { id, sessionId, phase, messages Json, updatedAt }`) | FR-073 |
| Les erreurs 429 (rate limit) et 5xx sont propagées proprement (`ProviderError`) | FR-073 |
| La clé API Gemini réutilise `safeStorage` / env `GOOGLE_AI_API_KEY` sans duplication | FR-073 |

## Tâches techniques

1. **Analyse** : lire `server/providers/google-ai.ts`, `server/utils/safeStorage.ts`, schéma Prisma actuel.
2. **Prisma** : ajouter table `HelperConversation` (migration).
3. **`shared/contracts.ts`** : ajouter `HELPER_SYSTEM_PROMPTS` (3 phases, textes FR + instruction output EN).
4. **`server/providers/gemini-text.ts`** : adapter texte (historique messages, system prompt injecté, abort signal, gestion 429/5xx).
5. **`server/api/helper/chat.post.ts`** : route Nitro, validation Zod, appel adapter, persistance conversation.
6. **Tests** :
   - `gemini-text.test.ts` : mock fetch, system prompt correct par phase, historique transmis, abort, 429, 5xx. `// @requirement: FR-073`
   - Integration `POST /api/helper/chat` : validation Zod (phase invalide, messages vides), réponse texte, persistance DB. `// @requirement: FR-073`

## Self-review checklist

- [ ] `gemini-text.ts` < 150 lignes, responsabilité unique.
- [ ] System prompts dans `shared/contracts.ts` (pas en dur dans la route).
- [ ] Aucune clé API dans les logs ou la réponse client.
- [ ] Tests couvrent les erreurs 429 et 5xx explicitement.
