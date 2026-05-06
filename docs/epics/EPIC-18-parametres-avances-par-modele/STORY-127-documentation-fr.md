---
doc: STORY
id: STORY-127
epic: EPIC-18
title: Documentation (REQUIREMENTS, ARCHITECTURE, PRD)
slug: documentation-fr
status: done
priority: P1
requirements: [FR-077, FR-078, FR-079, FR-080, FR-081, FR-082, FR-083, FR-084, FR-085]
version: 1.0.0
last_updated: 2026-05-06
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md, ../../ARCHITECTURE.md, ../../PRD.md]
---

# STORY-127 — Documentation

## Analyse

Story de clôture d'épique. À ce stade, les 8 stories techniques sont done. On consolide la documentation canonique pour que le projet reste cohérent et que les futures épiques s'appuient sur des sources à jour.

**Documents impactés** :
- `docs/REQUIREMENTS.md` — passer FR-077 à FR-085 de `proposed` à `verified`, mettre à jour la matrice de traçabilité (lien vers les tests de chaque FR).
- `docs/ARCHITECTURE.md` — étendre §3 (Providers & modèles) avec la mention du catalogue de traits et du pattern de composition. Ajouter §11 ou compléter §4 (Pattern Adapter) pour décrire le `ParamFieldMeta` et le mapping `toApiKey`.
- `docs/PRD.md` — ajouter une mention dans les user stories que l'utilisateur peut "régler finement chaque modèle selon ses spécificités, avec aide contextuelle (tooltips)". Pas une refonte massive, juste un ajout dans US relatives à la génération.
- `docs/EPICS.md` — passer EPIC-18 en `done`, mettre à jour les pourcentages.
- `PROGRESS.md` — déplacer les 9 stories en section Done, recalculer le %.
- `README.md` — quickstart à jour si une commande a changé (probablement non, mais à vérifier).

**Risques** :
- Oubli d'un document : la liste `synced_with` aide à ne rien rater.
- Désynchronisation entre exemples de code dans la doc et code réel : on illustre avec des extraits courts, on évite les diagrammes lourds qui se périment.

## Critères d'acceptation

| Critère | FR |
|---|---|
| `docs/REQUIREMENTS.md` contient FR-077 à FR-085 avec énoncé final, vérification (test associé), statut `verified` | FR-077..FR-085 |
| `verified_count` dans le front-matter de REQUIREMENTS.md est incrémenté de 9 ; `proposed_count` ajusté | FR-077..FR-085 |
| `docs/ARCHITECTURE.md` §3 ou §4 mentionne le catalogue `paramTraits.ts` et le pattern de composition `MODEL_PROFILES` | FR-077 |
| `docs/ARCHITECTURE.md` documente la distinction `scope: 'global' \| 'per-generation'` | FR-078 |
| `docs/PRD.md` mentionne le réglage par modèle (US dédiée ou ajout dans US existante) | FR-082 |
| `docs/EPICS.md` montre EPIC-18 en `done` 100% | FR-077..FR-085 |
| `PROGRESS.md` est à jour | FR-077..FR-085 |
| Tous les front-matters touchés ont `version` bumpé et `last_updated` à jour | — |
| Les listes `synced_with` sont cohérentes (pas de référence orpheline) | — |

## Tâches techniques

1. Bumper et mettre à jour `REQUIREMENTS.md` : FR-077 à FR-085 statut `verified`, ajouter ligne dans matrice de traçabilité.
2. Étendre `ARCHITECTURE.md` §3/§4 avec catalogue traits + scope.
3. Ajouter mention dans `PRD.md` (1-2 lignes dans une US existante).
4. Mettre à jour `EPICS.md` (statut + %).
5. Mettre à jour `PROGRESS.md`.
6. Vérifier `README.md` (quickstart inchangé probable).
7. Vérifier cohérence `synced_with` partout.

## Notes d'implémentation

- Story finale, aucun code de production touché.
- Aucun test à écrire — c'est de la doc.
- Rester concis : pas de réécriture massive, juste les mises à jour ciblées listées ci-dessus.
