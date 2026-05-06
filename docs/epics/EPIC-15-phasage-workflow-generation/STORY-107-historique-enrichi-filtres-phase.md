---
doc: STORY
id: STORY-107
epic: EPIC-15
title: Vue Historique enrichie — filtres phase + variant + visibilité conditionnelle
slug: historique-enrichi-filtres-phase
status: proposed
priority: P1
requirements: [FR-072, FR-059]
version: 1.0.0
last_updated: 2026-05-05
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# STORY-107 — Vue Historique enrichie

## Analyse

La page `/sessions` actuelle affiche une liste de sessions avec un toggle "likées uniquement". On doit la transformer en **galerie d'images** triable/filtrable, avec la notion de phase et de variant. La `GenerationCard` existante doit être étendue d'un mode `historyMode` qui affiche les badges de métadonnées.

La règle de visibilité conditionnelle (session active en RAM vs session fermée chargée depuis DB) s'appuie sur la STORY-106 : si la session est active, l'état Pinia contient aussi les non-likées, donc on peut les afficher. Si elle est fermée, seules les likées sont disponibles.

**Inconnues** :
- La page `/sessions` actuelle est-elle une liste de sessions ou une grille d'images ? À vérifier.
- Quel composant gère actuellement la galerie (`/sessions/[id]`) ?

## Critères d'acceptation

| Critère | FR |
|---|---|
| La page `/sessions` expose une grille d'images (réutilise `GenerationCard` en mode `historyMode`) | FR-072 |
| Filtres disponibles : phase (Wireframe/Mood/UI-UX/Tous), variant (A/B/C/Tous), modèle (multi-select), toggle "Likées uniquement / Toutes" | FR-059, FR-072 |
| Badge de phase coloré sur chaque carte (Wireframe=gris, Mood=violet, UI-UX=bleu) | FR-072 |
| Badge variant (A/B/C) visible sur chaque carte | FR-072 |
| Si session active en RAM : toggle "Toutes" disponible, affiche likées + non-likées | FR-059 |
| Si session fermée : seules les likées sont disponibles (toggle "Toutes" désactivé ou masqué) | FR-059 |
| Tri par défaut : date décroissante | FR-072 |

## Tâches techniques

1. **Analyse** : lire `app/pages/sessions/index.vue`, `app/pages/sessions/[id].vue`, `components/GenerationCard.vue`.
2. **`GenerationCard.vue`** : ajouter prop `historyMode: boolean` — en mode history, afficher badge phase + badge variant, masquer les actions de génération (stop, relance).
3. **`HistoryFilters.vue`** : nouveau composant, barre de filtres (phase + variant + modèle + toggle likées).
4. **`useHistoryFilters.ts`** : composable gérant l'état des filtres + la fonction de filtrage sur un tableau de générations.
5. **`app/pages/sessions/[id].vue`** : transformer en grille `GenerationCard historyMode` avec `HistoryFilters`, logic de visibilité conditionnelle (RAM vs DB).
6. **`app/pages/sessions/index.vue`** : garder la liste de sessions mais ajouter un lien "Voir toutes les images" → `/sessions/[id]`.
7. **Tests** :
   - `GenerationCard.test.ts` (extend) : mode `historyMode` affiche badge phase + variant, masque actions. `// @requirement: FR-072`
   - `useHistoryFilters.test.ts` : filtrage par phase, par variant, par modèle, toggle likées. `// @requirement: FR-059, FR-072`
   - `HistoryGrid.test.ts` : combinaison de filtres, tri date, visibilité conditionnelle (session active vs fermée). `// @requirement: FR-059`

## Self-review checklist

- [ ] `HistoryFilters` < 150 lignes.
- [ ] `useHistoryFilters` est un composable pur (pas de call API direct).
- [ ] La règle de visibilité conditionnelle est testée explicitement (pas juste un smoke test).
- [ ] Aucun import croisé `server/` depuis `app/`.
