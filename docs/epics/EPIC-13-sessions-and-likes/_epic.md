---
doc: EPIC
id: EPIC-13
title: Sessions persistantes + likes + galerie filtrée
slug: sessions-and-likes
status: done
priority: P1
requirements: [FR-057, FR-058, FR-059, FR-060]
stories_total: 4
stories_done: 4
stories_in_progress: 0
progress: 100%
version: 1.2.0
last_updated: 2026-05-01
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# EPIC-13 — Sessions persistantes + likes

## Objectif

Transformer l'expérience utilisateur en outil de **travail itératif** style ChatGPT :

1. **Sessions persistantes** : l'utilisateur ouvre une session, fait plusieurs batchs successifs au sein d'une même conversation, et peut y revenir plus tard. Plus de "1 batch = 1 session jetable".
2. **Likes** : l'utilisateur identifie ses favoris parmi les centaines de variantes générées. Seuls les likes sont **persistés sur disque**, automatiquement classés dans un sous-dossier au nom de la session.
3. **Galerie filtrée** : retrouver rapidement uniquement ses likes pour les présenter au client / les utiliser comme inspiration future.

## Stories

| ID | Titre | Statut |
|---|---|---|
| STORY-096 | Sessions persistantes + active + reprise + nouvelle session | done |
| STORY-097 | Like par image + sauvegarde auto sous-dossier session | done |
| STORY-098 | Galerie filtrée par likes (toggle dans `/sessions` + détail) | done |
| STORY-099 | Refonte shell — RailNav (Sessions + nav conditionnelle) + SidePanel séparé | done |

## Critère de fin d'épique

- [x] Les 3 stories `done`.
- [x] Pipeline `lint + typecheck + test + build + check:secrets` 100% vert.
- [ ] Smoke test runtime : à valider côté utilisateur — créer une session, faire 3 batchs, liker quelques images, fermer/rouvrir l'app, retrouver la session active avec ses likes persistés sur disque.
