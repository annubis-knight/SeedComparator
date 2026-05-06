---
doc: STORY
id: STORY-080
title: Side panel rétractable + onglets verticaux
epic: EPIC-9
status: done
priority: P1
requirements: [FR-035, FR-036]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-080 — Side panel rétractable + onglets verticaux

## Phase 1 — Analyse

La sidebar actuelle de `app/pages/index.vue` est un `<aside>` fixe de 360px contenant en flux vertical : PromptInputs, RatioSelector, ModelSelector, boutons d'action. Aucune structure d'onglets, aucun mécanisme de collapse.

**Inconnues techniques** :
- Quel pattern d'animation pour le collapse (CSS transition vs Vue `<Transition>`) ? → CSS transition sur `width` + opacity, simple et performant.
- Où persister l'état collapsed ? → `localStorage` via composable `useSidePanel`.

**Risques** :
- Casser le layout de la page index actuelle.
- Mauvaise accessibilité (focus trap au collapse, role aria).

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-035 : un bouton toggle replie/déploie le panneau.
- [x] FR-035 : l'état est lu/écrit dans `localStorage`.
- [x] FR-036 : le panneau a deux onglets « Image » et « Providers ».
- [x] FR-036 : le rail vertical d'icônes reste visible en mode replié.

**Tâches techniques** :
1. Créer `app/composables/useSidePanel.ts` (state collapsed + activeTab + localStorage).
2. Créer `app/components/session/SidePanel.vue` : structure (rail + zone contenu), bouton collapse.
3. Créer `app/components/session/ImageConfigPanel.vue` : encapsule RatioSelector + placeholders pour quality/nbImages (story 082).
4. Créer `app/components/session/ProvidersPanel.vue` : encapsule ModelSelector existant.
5. Refactor `app/pages/index.vue` : remplace l'aside par `<SidePanel>`.
6. Tests : `useSidePanel.test.ts`, `SidePanel.test.ts`.

## Phase 3 — Dev (TDD)

Cycles Red/Green/Refactor sur le composable et le composant SidePanel.

## Phase 4 — Self-review

- [ ] Pas de fuite de `$fetch` dans le composant.
- [ ] Pas d'accès direct à `localStorage` hors du composable.
- [ ] Aucun `any`.

## Phase 5 — Validation

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`

## Phase 6 — MAJ doc

Bumper `version` + `last_updated` de cette story, mettre à jour `_epic.md`, `PROGRESS.md`.
