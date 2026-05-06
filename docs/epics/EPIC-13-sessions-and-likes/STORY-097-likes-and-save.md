---
doc: STORY
id: STORY-097
title: Like par image + sauvegarde auto sous-dossier session
epic: EPIC-13
status: done
priority: P1
requirements: [FR-058]
version: 1.0.0
last_updated: 2026-05-01
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-097 — Like par image

## Phase 1 — Analyse

Beaucoup d'images générées (5+ modèles × 3 prompts × N itérations = vite 100+ images par session). L'utilisateur a besoin d'un mécanisme rapide pour marquer ses favoris ET les persister.

Choix : le like = **action de sauvegarde**. Pas de "fav éphémère". Cliquer ❤️ écrit l'image sur disque, dé-cliquer la supprime.

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-058 : `Generation.liked: Boolean @default(false)` en DB (migration).
- [x] FR-058 : icône ❤️ sur `GenerationCard` quand `status=success`. Toggle visuel rempli/vide selon `gen.liked`.
- [x] FR-058 : endpoint `PATCH /api/generations/[id]/like` qui :
  - Au like : flip flag DB + écrit `<saveFolder>/<sessionName>/<id>.png` + sidecar `<id>.json`.
  - Au dé-like : flip flag DB + supprime fichier + sidecar.
- [x] FR-058 : si `saveFolder` (Setting) absent, premier like → dialog Electron, sauvegarde le path en Setting.
- [x] FR-058 : le bouton "⬇" Sauvegarder existant reste disponible pour sauvegarder ailleurs.
- [x] FR-058 : `LiveGeneration.liked: boolean` côté frontend, propagé par `useGenerationSession` au reçu de l'event SSE.

**Tâches** :
1. Migration Prisma `add_liked_to_generation`.
2. Endpoint `server/api/generations/[id]/like.patch.ts`.
3. Service `server/services/likeStorage.ts` (helpers `writeLikedImage` / `removeLikedImage`).
4. UI : bouton ❤️ dans `GenerationCard.vue` + émission `like` event.
5. Frontend `pages/index.vue` : handler `onLike` qui call l'API.
6. Composable `useGenerationSession` : ajouter `liked` à `LiveGeneration` + helper `setLiked`.
7. Tests : endpoint like (mock fs), composant GenerationCard (toggle ❤️).
