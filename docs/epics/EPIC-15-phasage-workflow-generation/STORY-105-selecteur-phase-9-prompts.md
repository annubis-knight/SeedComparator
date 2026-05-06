---
doc: STORY
id: STORY-105
epic: EPIC-15
title: Sélecteur de phase + 9 prompts persistés par session
slug: selecteur-phase-9-prompts
status: proposed
priority: P1
requirements: [FR-069, FR-070, FR-057]
version: 1.0.0
last_updated: 2026-05-05
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# STORY-105 — Sélecteur de phase + 9 prompts persistés par session

## Analyse

La vue Génération expose actuellement 3 prompts A/B/C flat rattachés à la session. On doit passer à 9 prompts (3 phases × 3 variants) avec un sélecteur de phase qui pilote quels prompts sont affichés et édités. Le changement de phase doit être non-destructif (les prompts de la phase quittée sont sauvegardés avant le switch).

**Risques** :
- Migration Prisma : le champ `Session.prompts` actuel est un JSON plat — à transformer en map `{ wireframe, mood, uiux }`.
- Les composables `useActiveSession` et `PromptInputs` sont au cœur — il faut ne pas casser les sessions existantes.
- Les pré-prompts par défaut (`PROMPT_PREFIX_A/B/C` dans `shared/contracts.ts`) doivent être déclinés en 3 variantes de phase.

**Inconnues** :
- Vérifier comment `Session.prompts` est actuellement sérialisé en DB (champ Prisma Json ?).
- Vérifier si `PromptInputs.vue` lit les prompts depuis le composable ou depuis une prop.

## Critères d'acceptation

| Critère | FR |
|---|---|
| Un sélecteur `Wireframe / Mood / UI-UX Design` est affiché au-dessus des tabs A/B/C dans la vue Génération | FR-069 |
| Cliquer sur une phase sauvegarde les 3 prompts courants (A/B/C) dans la phase active, puis charge les 3 prompts de la phase ciblée | FR-069, FR-070 |
| La navigation entre phases est libre (pas de séquence forcée, accès direct à n'importe quelle phase) | FR-069 |
| La phase active est mémorisée en session (`Session.activePhase`) et rechargée au retour sur la session | FR-069 |
| Chaque phase dispose de prompts par défaut distincts dans `shared/contracts.ts` | FR-070 |
| `Session.promptsByPhase` est une map JSON `{ wireframe: {a,b,c}, mood: {a,b,c}, uiux: {a,b,c} }` persistée en DB | FR-070 |
| Une migration Prisma gère la transition depuis l'ancien champ prompts | FR-070 |
| Chaque `Generation` porte un champ `phase: 'wireframe' \| 'mood' \| 'uiux'` tracé en DB | FR-069 |

## Tâches techniques

1. **Analyse** : lire `shared/contracts.ts` (PROMPT_PREFIX), `composables/useActiveSession.ts`, `components/PromptInputs.vue`, schéma Prisma (`Session`, `Generation`).
2. **Migration Prisma** : ajouter `promptsByPhase Json?` et `activePhase String @default("wireframe")` sur `Session` + `phase String @default("wireframe")` sur `Generation`.
3. **`shared/contracts.ts`** : ajouter `PROMPT_DEFAULTS_BY_PHASE` (3 phases × 3 variants = 9 valeurs).
4. **`useActiveSession.ts`** : ajouter `activePhase` ref, `setPhase(phase)` (sauvegarde + switch), getter `currentPrompts`.
5. **`PromptInputs.vue`** : lire/écrire les prompts via `currentPrompts` du composable, plus de binding direct sur un champ flat.
6. **`PhaseSelector.vue`** : nouveau composant (3 boutons, style pill, phase active surlignée).
7. **`pages/index.vue`** (ou composant parent) : intégrer `PhaseSelector` au-dessus de `PromptInputs`.
8. **`POST /api/generate`** : passer `phase` dans le body, le propager au `batchOrchestrator`, le persister sur chaque `Generation` créée.
9. **Tests** :
   - `useActiveSession.test.ts` : switch phase → sauvegarde prompts A → charge prompts B, `activePhase` persisté, rechargement sur reprise session. `// @requirement: FR-069, FR-070`
   - `PhaseSelector.test.ts` : affichage 3 phases, phase active surlignée, émission `phase-change`. `// @requirement: FR-069`
   - `PromptInputs.test.ts` (extend) : switch phase change les valeurs affichées. `// @requirement: FR-070`
   - Integration `POST /api/generate` : `Generation.phase` persisté en DB. `// @requirement: FR-069`

## Self-review checklist (à remplir avant validation)

- [ ] Tests couvrent chaque critère d'acceptation avec `@requirement` tag.
- [ ] Migration Prisma ne perd pas les données existantes (prompts legacy → wireframe par défaut).
- [ ] Aucun `any` introduit.
- [ ] `PhaseSelector` ne dépasse pas ~100 lignes.
- [ ] `useActiveSession` reste < 200 lignes après extension.
