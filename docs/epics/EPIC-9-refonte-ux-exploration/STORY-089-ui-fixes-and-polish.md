---
doc: STORY
id: STORY-089
title: Corrections UI (flex hauteur, placeholder, chevrons, dark slate, bouton Générer)
epic: EPIC-9
status: done
priority: P1
requirements: [FR-048, FR-049, FR-050]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-089 — Corrections UI

## Phase 1 — Analyse

6 corrections issues du retour utilisateur :

1. **Bug flex hauteurs** (FR-049) : la cascade `flex-1` n'arrive pas jusqu'aux cartes en mode flex.
2. **Placeholder image manquant** (FR-048) : l'état idle ne montre pas d'icône, juste un fond qui peut collapse.
3. **Collapse prompts via chevron seul** : suppression de la barre compacte, juste un chevron à côté du label "Prompt".
4. **Chevron sidepanel en haut** : déplacé du bas du rail au sommet (premier élément).
5. **Bouton Générer + Stop** : déplacés à côté des tabs A/B/C dans PromptInputs.
6. **Dark mode Slate doux** (FR-050) : tokens.css refondu pour reduire la dureté visuelle.

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-048 : `GenerationCard` en idle affiche icône SVG image + label, hauteur min garantie.
- [x] FR-049 : en mode flex, les colonnes s'étirent jusqu'en bas du viewport.
- [x] FR-050 : nouveaux tokens dark slate appliqués globalement.
- [x] Collapse prompts via chevron `▾/▸` à côté du label, pas de barre intermédiaire.
- [x] Chevron sidepanel en premier item du rail.
- [x] Boutons Générer/Stop dans PromptInputs (slot ou prop).

**Tâches** :
1. Tokens.css : nouvelle palette slate.
2. SidePanel.vue : déplacer le chevron en haut.
3. PromptInputs.vue : ajouter slot "actions" pour bouton Générer/Stop, collapse interne via chevron.
4. pages/index.vue : retirer la barre compacte, passer les boutons dans le slot.
5. GenerationGrid.vue + GenerationCard.vue : cascade `flex-1 min-h-0 h-full` complète.
6. GenerationCard.vue : nouveau placeholder SVG icône + label, min-height token.

## Phase 3-6

Standard.
