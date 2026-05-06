---
doc: EPIC
id: EPIC-16
title: Assistant créatif LLM (chatbot Gemini par phase)
slug: assistant-creatif-llm
status: proposed
priority: P2
requirements: [FR-073]
stories_total: 2
stories_done: 0
stories_in_progress: 0
progress: 0%
version: 1.0.0
last_updated: 2026-05-05
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-16 — Assistant créatif LLM

## Objectif

Ajouter un **chatbot contextuel par phase** qui aide l'utilisateur à rédiger des prompts image efficaces. L'assistant :

- Parle **français** à l'utilisateur.
- Génère des **prompts en anglais** identifiés dans des blocs `\`\`\`prompt … \`\`\`` avec un bouton "Insérer dans A/B/C".
- Adapte son system prompt à la phase active (Wireframe / Mood / UI-UX Design).
- Utilise **Gemini API free tier** (`gemini-2.0-flash-lite` ou équivalent) via la gateway `google-ai` déjà configurée.
- Persiste la conversation par session × phase en DB (table `HelperConversation`).

## Stories

| ID | Titre | Statut |
|---|---|---|
| STORY-108 | Adapter Gemini text + route Nitro `/api/helper/chat` | proposed |
| STORY-109 | Modale chatbot par phase + insertion blocs prompt dans A/B/C | proposed |

## Critère de fin d'épique

- [ ] 2 stories `done`.
- [ ] Pipeline `lint + typecheck + test + build + check:secrets` 100% vert.
- [ ] Smoke test runtime : ouvrir l'assistant en phase Wireframe, poser une question en français, obtenir un bloc `\`\`\`prompt\`\`\`` en anglais, cliquer "Insérer dans A", vérifier que le textarea A est mis à jour.
