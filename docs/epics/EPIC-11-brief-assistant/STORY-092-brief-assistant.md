---
doc: STORY
id: STORY-092
title: Page Accueil + analyse de site + LLM brief→prompts
epic: EPIC-11
status: done
priority: P1
requirements: [FR-053]
version: 1.1.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
note: "Refondu en v2 par STORY-093 — voir cette dernière pour le formulaire allégé + complétion + pré-prompts par défaut."
---

# STORY-092 — Brief Assistant

## Phase 1 — Analyse

Story large mais cohérente :
- Frontend : nouvelle page `/home`, formulaire structuré, dynamique d'ajout d'URLs, panel de progression SSE, panel contexte (markdown + screenshots), redirection /generate.
- Backend : nouvelle route `/api/brief` (POST + SSE), service crawler (cheerio), service screenshot (Playwright), service palette (node-vibrant), adapter `openrouter-text` (LLM Haiku texte + vision).
- DB : champ `Session.brief: Json?` ajouté.
- Persistance : localStorage côté client + Session.brief en DB.

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] Formulaire 5 champs (3 obligatoires + 2 optionnels) + URLs dynamiques.
- [x] Crawl par URL : fetch + screenshot + palette + vision LLM.
- [x] Concurrence 2, timeout 8s/page, 30s global.
- [x] URL invalide ou en échec → erreur bloquante, rien n'est généré.
- [x] LLM Haiku reçoit markdown contextuel + 5 champs → produit 3 prompts (A naturel / B keywords / C structuré).
- [x] SSE feedback live (page par page + état).
- [x] Bouton Annuler durant l'analyse.
- [x] Au succès : redirection automatique vers `/generate`, prompts pré-remplis.
- [x] Persistance localStorage + Session.brief en DB.
- [x] Affichage du contexte extrait (markdown + screenshots mini) dans `<details>` dépliable.

**Tâches** :
1. Migration Prisma `add_brief_to_session`.
2. Install deps : cheerio, playwright, node-vibrant.
3. Service `server/services/crawler.ts` (fetch + extract texte par cheerio).
4. Service `server/services/screenshot.ts` (Playwright headless, mini + full).
5. Service `server/services/palette.ts` (node-vibrant).
6. Adapter `server/providers/openrouter-text.ts` (Haiku texte + vision).
7. Endpoint `server/api/brief.post.ts` SSE.
8. Composable `app/composables/useBriefAssistant.ts`.
9. Page `app/pages/home.vue` (formulaire + composants).
10. Composants `BriefForm.vue`, `CrawlProgress.vue`, `ContextPanel.vue`.
11. Nav SidePanel : ajout 🏠 Accueil (déplacement de Exploration en 🎨).
12. Tests : adapter, services, page accueil.
13. Doc.

## Phase 3-6

Standard.

## Note de révision (2026-04-29)

La V1 livrée par cette story (formulaire 5 champs avec 3 obligatoires : client / sujet / DA) a été **refondue par STORY-093** suite à un retour utilisateur orienté outil d'inspiration. Voir [STORY-093](./STORY-093-prefixes-and-completion.md) pour le détail des changements (formulaire allégé tout-optionnel, pré-prompts par défaut, logique de complétion LLM, banque vocabulaire enrichie). Cette story reste `done` car elle a livré l'infrastructure (crawler, screenshot, palette, vision LLM, SSE, persistance) qui est toujours en place ; seuls les contrats utilisateur ont été révisés par 093.
