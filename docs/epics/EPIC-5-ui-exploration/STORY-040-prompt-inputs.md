---
doc: STORY
id: STORY-040
title: Composant PromptInputs (3 champs)
epic: EPIC-5
status: done
priority: P0
requirements: [FR-006]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-040 — PromptInputs

## Livré

- `app/components/session/PromptInputs.vue` : 3 textareas (A, B, C) avec placeholders distincts (langage naturel / mots-clés / style structuré).
- Modèle v-model `string[]` de longueur 3.
- Émet `update:modelValue` à chaque saisie.

## Validation (2 tests)

```ts
// @requirement: FR-006 — affiche 3 champs prompt ✅
// @requirement: FR-006 — émet update:modelValue quand on tape ✅
```

`tests/unit/components/PromptInputs.test.ts` : 2/2 ✅.

## Self-review

- [x] Champs B et C optionnels (un seul prompt actif suffit pour générer).
- [x] Le prompt est transmis brut, sans transformation.
