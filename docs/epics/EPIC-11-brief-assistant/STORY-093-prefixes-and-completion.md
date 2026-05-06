---
doc: STORY
id: STORY-093
title: Pré-prompts par défaut + logique de complétion + formulaire allégé + banque vocabulaire enrichie
epic: EPIC-11
status: done
priority: P1
requirements: [FR-054]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-093 — Pré-prompts + complétion + outil d'inspiration

## Phase 1 — Analyse

Suite à un retour utilisateur sur l'usage réel de l'outil (sprint 2026-04-29) :

> "Le but de cet outil est l'**exploration créative** et l'**inspiration**, pas la fidélité à un brief client. Les prompts générés doivent toujours cibler un haut de landing page incluant une hero section, peu importe ce que l'utilisateur tape. Le formulaire actuel est overkill pour un outil d'inspiration."

L'analyse révèle 4 axes d'amélioration :

1. **Cadre commun garanti** : tous les prompts (A/B/C) doivent partager un préfixe statique qui pose le cadre (haut de landing, hero, typo display, direction éditoriale). Ce préfixe ne doit **jamais** être effacé par le LLM.
2. **Formulaire allégé** : les champs `client`, `subject`, `constraints` sont retirés (orientation brief client peu utile). On les remplace par des champs orientés direction artistique : `uiStyle`, `typography`, `palette`. Tous les champs deviennent **optionnels**.
3. **LLM en mode complétion** : au lieu de générer 3 prompts complets, le LLM génère 3 **compléments** qui s'ajoutent aux préfixes via un helper de concaténation.
4. **Banque de vocabulaire enrichie** avec catégories spécifiques web design : `web_design_styles` (swiss minimal, neo-brutalism, glassmorphism, bento grid, etc.) et `typography_styles` (bold display sans, editorial serif, monospace tech, etc.).

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-054 : 3 constantes `PROMPT_PREFIX_A/B/C` exportées depuis `shared/contracts.ts`.
- [x] FR-054 : helper `joinPromptVariant(variant, completion)` qui concatène avec le bon séparateur (espace pour A, virgule pour B, retour ligne pour C).
- [x] FR-054 : pré-prompts pré-remplis dans les 3 textareas A/B/C de `/generate` au premier chargement.
- [x] FR-054 : bouton ↺ "Réinitialiser aux pré-prompts par défaut" dans `PromptInputs.vue`.
- [x] FR-054 : `BriefRequest` schema révisé (5 champs optionnels : `artDirection`, `mood`, `uiStyle`, `typography`, `palette` + `urls`).
- [x] FR-054 : `BriefForm.vue` refondu — tous les champs optionnels, bouton "Prompter" actif sans rien remplir.
- [x] FR-054 : `BriefResult.prompts` contient désormais des **compléments** (pas des prompts complets).
- [x] FR-054 : `usePrompts()` côté `home.vue` concatène préfixe + complément avant redirect `/generate`.
- [x] FR-054 : system prompt LLM révisé (orientation outil d'inspiration, divergence créative encouragée, instructions explicites pour ne pas répéter les préfixes).
- [x] Banque vocabulaire enrichie avec `web_design_styles` (41 termes) + `typography_styles` (26 termes), version JSON bumpée à 1.1.0.
- [x] Sources `web_design_styles` documentées dans `docs/prompt-vocabulary-sources.md`.

**Tâches** :
1. Étendre `shared/contracts.ts` : ajouter `PROMPT_PREFIX_A/B/C`, `joinPromptVariant()`, refondre `BriefRequestSchema` et `BriefResult`.
2. Mettre à jour `server/data/prompt-vocabulary.json` v1.1.0 avec 2 nouvelles catégories.
3. Mettre à jour `docs/prompt-vocabulary-sources.md` (sources des nouvelles catégories).
4. Refondre `server/providers/openrouter-text.ts` : nouveau system prompt orienté complétion, `BriefInput` aligné, `mockGeneratedPrompts()` aligné.
5. Refondre `server/api/brief.post.ts` : champs renommés, conflit local `palette` résolu en `extractedPalette`.
6. Refondre `app/components/brief/BriefForm.vue` : 5 champs optionnels (DA, mood, UI/UX, typo, palette + URLs).
7. Refondre `app/pages/home.vue` : récap brief lecture seule (champs nouveaux), preview = `joinPromptVariant(préfixe + complément)`, redirect avec valeur concaténée.
8. `app/components/session/PromptInputs.vue` : ajout bouton ↺ + event `reset`.
9. `app/pages/index.vue` : `defaultPrompts()` au mount + handler `resetPromptsToDefaults`.

## Phase 3 — Dev

Pas de TDD strict (changements de surface, pas d'algos critiques). Les tests existants `PromptInputs` / `BriefForm` continuent à passer car les contrats publics ne sont pas brisés (props/emits compatibles).

## Phase 4 — Self-review

- [x] Aucun `any` introduit.
- [x] Pas de `$fetch` direct dans les composants (passe par composables).
- [x] Pas de clé API hors `server/`.
- [x] Helper `joinPromptVariant()` couvre les 3 variantes avec switch exhaustif.
- [x] BriefRequest schema valide → 0 champ obligatoire (tous optionnels avec défaut '').
- [x] Logger backend/frontend déjà en place sur les chemins critiques.

## Phase 5 — Validation

- [x] `npm run lint` : 0 erreur, 9 warnings pré-existants.
- [x] `npm run typecheck` : ✅.
- [x] `npm run test` : 96/96 ✅.
- [x] `npm run build` : ✅ (bundle server 6.44 MB, pas de régression depuis fix Playwright externals).
- [x] `npm run check:secrets` : ✅.

## Phase 6 — MAJ doc

- [x] `docs/REQUIREMENTS.md` v1.1.0 : ajout FR-054.
- [x] `docs/epics/EPIC-11-brief-assistant/_epic.md` v1.2.0 : ajout STORY-093, FR-054 dans requirements.
- [x] `docs/EPICS.md` : index avec STORY-093.
- [x] `PROGRESS.md` : compteurs + bumps.

## Livré

- **Préfixes statiques** ([shared/contracts.ts](../../../shared/contracts.ts)) : `PROMPT_PREFIX_A/B/C` + `joinPromptVariant()` + `PromptVariant` type.
- **Banque enrichie** ([server/data/prompt-vocabulary.json](../../../server/data/prompt-vocabulary.json)) v1.1.0, **318 termes** (vs 252 avant), 13 catégories.
- **System prompt révisé** ([server/providers/openrouter-text.ts](../../../server/providers/openrouter-text.ts)) : orientation complétion + divergence créative.
- **Formulaire allégé** ([app/components/brief/BriefForm.vue](../../../app/components/brief/BriefForm.vue)) : 5 champs optionnels.
- **Page home révisée** ([app/pages/home.vue](../../../app/pages/home.vue)) : récap nouveaux champs + concaténation préfixe + complément avant redirect.
- **PromptInputs avec reset** ([app/components/session/PromptInputs.vue](../../../app/components/session/PromptInputs.vue)) : bouton ↺.
- **Page index avec pré-prompts** ([app/pages/index.vue](../../../app/pages/index.vue)) : `defaultPrompts()` au mount + handler reset.
