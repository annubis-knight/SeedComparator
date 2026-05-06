---
doc: STORY
id: STORY-096
title: Sessions persistantes (1 session = N batchs successifs)
epic: EPIC-13
status: done
priority: P1
requirements: [FR-057]
version: 1.0.0
last_updated: 2026-05-01
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-096 — Sessions persistantes

## Phase 1 — Analyse

Aujourd'hui chaque clic "Générer" crée une nouvelle `Session` en DB. Côté utilisateur, ça devient un cimetière de sessions de 3 images chacune. On veut le pattern ChatGPT : une session = un projet d'exploration, N batchs successifs.

**Inconnues** :
- Migration : faut-il ajouter un champ `name` à `Session` ? Oui, pour pouvoir le nommer/renommer.
- Le `brief` est attaché à la session : si on rajoute un batch sur une session existante, on **garde** le brief initial (ne pas l'écraser).

## Phase 2 — Plan

**Critères d'acceptation** :
- [x] FR-057 : `Session.name: String?` ajouté en DB (auto-rempli au premier batch avec format horodaté).
- [x] FR-057 : composable `useActiveSession` côté frontend (state `activeSessionId` persistée en localStorage).
- [x] FR-057 : `POST /api/generate` accepte un `sessionId` optionnel — si fourni et valide, rattache les nouvelles `Generation` à cette session ; sinon en crée une nouvelle.
- [x] FR-057 : bouton "+ Nouvelle session" dans le SidePanel.
- [x] FR-057 : reprise auto de la dernière session active au reload.
- [x] FR-057 : `GET /api/sessions` (liste) ajouté pour la liste UI rapide.
- [x] FR-057 : nom éditable via UI dans le SidePanel ou page session.

**Tâches** :
1. Migration Prisma `add_name_to_session` (`name: String?`).
2. Composable `app/composables/useActiveSession.ts`.
3. Endpoint `server/api/sessions/index.get.ts` (liste).
4. Endpoint `server/api/sessions/[id]/rename.patch.ts`.
5. Modifier `server/api/generate.post.ts` : accepter `sessionId`, le réutiliser si présent et valide.
6. Modifier `useGenerationSession.start()` : passer `sessionId` du composable actif.
7. Composant `SessionHeader.vue` : nom session + bouton renommer + bouton "+ Nouvelle session".
8. Tests : composable + endpoints.

## Phase 3-6

Standard.
