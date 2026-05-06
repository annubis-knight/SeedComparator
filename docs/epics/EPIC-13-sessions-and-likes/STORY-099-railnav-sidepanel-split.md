---
doc: STORY
id: STORY-099
title: Refonte shell — RailNav (Sessions + nav conditionnelle) + SidePanel séparé
epic: EPIC-13
status: done
priority: P1
requirements: [FR-060]
version: 1.1.0
last_updated: 2026-05-01
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-099 — RailNav + SidePanel séparé

## Phase 1 — Analyse

Le `SidePanel.vue` actuel mélange 4 responsabilités :
1. Navigation globale (4 nav-items).
2. Onglets contextuels Image/Providers.
3. CostMeter footer.
4. SessionHeader (ajouté par STORY-096).

Trop chargé. Refonte en **2 composants** distincts à gauche :
- `RailNav.vue` (le vrai shell de navigation) avec sessions intégrées.
- `SidePanel.vue` refondu (juste Image/Providers + collapse).

La section **NAV (4 items)** dans le RailNav devient **conditionnelle à la présence d'une session active** — sans session, l'utilisateur ne peut pas naviguer dans Accueil/Génération/Galerie/Réglages, seul le bloc Sessions est utilisable.

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-060 : `RailNav.vue` créé, contient :
  - Bouton ‹ collapse en haut (icône distincte du SidePanel).
  - Section NAV conditionnelle (`v-if="hasActiveSession"`) avec 4 nav-items.
  - Section SESSIONS toujours visible : "+ Nouvelle session", 5 dernières sessions, CTA "Voir toutes".
  - Footer : CostMeter compact.
- [x] FR-060 : `SidePanel.vue` refondu — juste les onglets Image/Providers + collapse propre.
- [x] FR-060 : `app.vue` rendu 3 zones — RailNav | SidePanel (conditionnel) | NuxtPage.
- [x] FR-060 : Vue centrale `/` affiche page neutre si `activeId` absent.
- [x] FR-060 : Clic session dans RailNav → set active + redirect `/`.
- [x] FR-060 : Clic "+ Nouvelle session" → clear active + redirect `/`.
- [x] FR-060 : Endpoint `GET /api/sessions/recent?limit=5` (nouveau, optimisé).
- [x] FR-060 : Au boot, si `activeId` localStorage valide en DB, reprise auto.

**Tâches** :
1. Créer `app/components/session/RailNav.vue`.
2. Créer endpoint `server/api/sessions/recent.get.ts`.
3. Refondre `app/components/session/SidePanel.vue` (purge nav + sessions).
4. Refondre `app/app.vue` (layout 3 zones).
5. Modifier `app/pages/index.vue` (gestion page neutre + redirect dernier session au boot).
6. Composable `useActiveSession` : ajouter `activate(sessionId)` (set + redirect).
7. Tests : `RailNav.test.ts` + ajustements `SidePanel.test.ts`.

## Phase 3-6

Standard.

## Révision 1.1.0 — 2026-05-01 (cleanup nav RailNav)

Après validation runtime, deux ajustements UX :

1. **Suppression de l'item "🖼 Galerie"** : redondant avec le lien CTA `→ Voir toutes les sessions` déjà présent dans la section Sessions du RailNav. Pointaient tous deux vers `/sessions`.
2. **Renommage "Accueil" → "Brief"** : reflète mieux la fonction de la page (`/home` héberge le Brief Assistant).
3. **Réorganisation 2 zones de nav** (pattern ChatGPT) :
   - **Section haute** (conditionnelle `v-if="hasActiveSession"`) : Brief, Génération.
   - **Section basse** (toujours visible, juste au-dessus du footer CostMeter) : Réglages.
   Rationale : Réglages doit rester accessible même sans session active (changer ses clés API, etc.).

Tests RailNav adaptés : 12 cas, 130/130 verts.
