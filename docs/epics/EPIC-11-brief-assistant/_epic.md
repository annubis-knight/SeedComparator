---
doc: EPIC
id: EPIC-11
title: Brief Assistant — page Accueil + génération assistée de prompts
slug: brief-assistant
status: done
priority: P1
requirements: [FR-053, FR-054]
stories_total: 2
stories_done: 2
stories_in_progress: 0
progress: 100%
version: 1.3.0
last_updated: 2026-04-29
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-11 — Brief Assistant

## Objectif (révisé v1.3.0)

Outil d'**exploration créative et d'inspiration** pour générer des hauts de landing page. L'utilisateur ne saisit pas un brief client classique : il fournit (optionnellement) quelques précisions de direction artistique (DA, mood, UI/UX, typo, palette + URLs d'inspiration), et le système enrichit 3 variantes de prompts image qui ciblent toujours un haut de landing avec hero, peu importe le brief.

L'analyse du site existant (texte + visuel + palette) enrichit le contexte fourni au LLM, pour qu'il puisse s'inspirer (sans copier) de l'identité visuelle déjà en place.

**Philosophie** : maximiser la diversité créative entre les 3 prompts pour stimuler l'inspiration humaine — pas reproduire fidèlement un brief.

## Stories

| ID | Titre | Statut |
|---|---|---|
| STORY-092 | Page Accueil + crawler + screenshots + LLM brief→prompts (V1) | done |
| STORY-093 | Pré-prompts par défaut + complétion + formulaire allégé + banque enrichie (V2) | done |

**Notes** :
- STORY-092 a livré l'infrastructure (crawler cheerio, screenshot Playwright, palette node-vibrant, vision LLM, endpoint SSE, page Accueil V1, persistance localStorage + DB).
- STORY-093 a refondu les contrats utilisateur (formulaire allégé tout-optionnel, pré-prompts statiques, logique de complétion LLM, banque vocabulaire enrichie avec catégories web design + typo).

## Critère de fin d'épique

- [x] STORY-092 done (infrastructure).
- [x] STORY-093 done (refonte outil d'inspiration).
- [x] L'utilisateur peut atteindre `/home` via la navbar.
- [x] Le formulaire brief avec URL(s) fonctionne en mode mock (sans clé OpenRouter).
- [x] Tous les champs sont optionnels — possibilité de cliquer Prompter sans rien remplir → 3 directions créatives complètement différentes.
- [x] Pré-prompts par défaut chargés dans les 3 textareas A/B/C de `/generate` au premier chargement, bouton ↺ pour réinitialiser.
- [x] Banque de vocabulaire prompt engineering **318 termes**, **13 catégories** construite à partir de sources fiables datées (MJ V7, Flux, Imagen 4, GPT Image, lighting cinéma, art mouvements, web design styles, typography styles).
- [x] Sources documentées dans [docs/prompt-vocabulary-sources.md](../../prompt-vocabulary-sources.md) avec date de consultation 2026-04-29.
- [x] Pipeline `npm run lint && typecheck && test && build && check:secrets` 100% vert.
- [ ] Avec une vraie clé OpenRouter, le brief produit 3 prompts cohérents en moins de 30 secondes pour un site de complexité moyenne (à valider runtime côté utilisateur).
