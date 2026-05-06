---
doc: STORY
id: STORY-088
title: App shell unifié + collapse PromptInputs + aération renforcée
epic: EPIC-9
status: done
priority: P1
requirements: [FR-045, FR-046, FR-047]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-088 — App shell unifié + collapse + aération

## Phase 1 — Analyse

3 chantiers liés :
1. **Suppression du header global**, déplacement de la navigation et du `CostMeter` dans le `SidePanel` (FR-045).
2. **Collapse automatique** de `PromptInputs` au lancement d'une génération, redéploiement sur clic explicite "Modifier les prompts" (FR-046).
3. **Aération renforcée** : grid plus aéré, flex pleine hauteur avec image x2 et plus d'espace entre colonnes (FR-047).

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-045 : `app.vue` n'a plus de `<header>` ni de top-nav. `SidePanel` rendu globalement, contient nav (Exploration/Galerie/Réglages) + onglets contextuels (Image/Providers, visibles seulement sur `/`) + `CostMeter` en footer.
- [x] FR-046 : sur `/`, dès `inProgress` passe à `true`, `PromptInputs` se replie. Bouton "Modifier les prompts" visible quand replié, le redéploie.
- [x] FR-047 : grid `gap-10`, padding card `1.75rem`, sections `space-y-14`. Flex : colonne `min-h-screen-minus-shell`, image min `480px`, gap entre colonnes `gap-8`, gap entre brand-groups `gap-16`.

**Tâches** :
1. Refactor `SidePanel.vue` : ajout section nav, prop `showContextTabs`, slot footer.
2. Mise à jour `useSidePanel` si besoin (état nav active).
3. Refactor `app.vue` : suppression header, mount global `<SidePanel>`.
4. Ajout `useFormCollapsed` composable (collapse/expand de la section prompt input).
5. Refactor `pages/index.vue` : binding du collapse + bouton "Modifier les prompts".
6. Refactor `GenerationGrid.vue` : tokens spacing renforcés, flex en pleine hauteur, image x2.
7. Tests : extension `SidePanel.test.ts`, nouveaux tests `useFormCollapsed.test.ts`.

## Phase 3-6

Standard.
