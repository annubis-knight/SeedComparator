---
doc: STORY
id: STORY-106
epic: EPIC-15
title: Cycle de vie mémoire vive vs DB — non-likées RAM, purge close, délike supprime
slug: cycle-vie-memoire-vive-db
status: proposed
priority: P1
requirements: [FR-071, FR-058]
version: 1.0.0
last_updated: 2026-05-05
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# STORY-106 — Cycle de vie mémoire vive vs DB

## Analyse

Actuellement les générations sont persistées en DB automatiquement (FR-025). On veut séparer deux niveaux :
- **RAM (Pinia)** : toutes les générations de la session active, likées ou non.
- **DB** : uniquement les likées.

À la fermeture de l'app (événement `app-quit` Electron), les non-likées disparaissent. Au délike, le fichier disque + sidecar + l'entrée DB sont supprimés, mais la génération reste en RAM tant que la session est active.

**Risques** :
- Vérifier si `FR-025` (persistance auto des métadonnées) s'applique encore — il faudra peut-être le restreindre aux likées.
- L'IPC Electron pour `app-quit` doit déclencher une action Pinia de purge.
- Le comportement actuel de `POST /api/generate` (qui crée des `Generation` en DB) devra changer : ne plus persister automatiquement, ou persister dans une table temporaire purgeable.

**Inconnues** :
- Comment est actuellement géré le `app-quit` dans Electron ? Y a-t-il déjà un handler ?
- `Generation` est-elle créée au début de la génération (pending) ou à la fin (success) ?

## Critères d'acceptation

| Critère | FR |
|---|---|
| Les générations non-likées ne sont pas écrites en DB pendant la session | FR-071 |
| La fermeture de l'app (`app-quit`) purge l'état Pinia des non-likées | FR-071 |
| Au boot, seules les générations `liked=true` sont rechargées depuis la DB dans l'état Pinia | FR-071 |
| Le délike supprime le fichier disque + sidecar + l'entrée DB | FR-058 |
| L'image d'une génération délikée reste accessible en RAM tant que la session est active | FR-058 |
| La génération est associée à sa phase (`phase`) dans tous les cas (RAM et DB) | FR-071 |

## Tâches techniques

1. **Analyse** : lire `server/api/generate.ts`, `composables/useGenerationSession.ts` (ou équivalent), handler Electron `app.on('before-quit')`, `server/api/generations/[id]/like.ts`.
2. **`POST /api/generate`** : ne plus insérer `Generation` en DB directement — retourner l'objet complet au client, le client le stocke en Pinia. Ou : insérer en DB avec un flag `persisted: false` et purger au quit.
3. **Composable `useGenerationSession`** : stocker les générations courantes en Pinia, sans appel DB pour les non-likées.
4. **Handler `app-quit`** (Electron `electron/main.ts`) : émettre un IPC `generations:purge-unlked` avant quit.
5. **`DELETE /api/generations/[id]/like`** (délike) : supprimer l'entrée DB + fichier disque + sidecar.
6. **Boot** : au chargement d'une session, appeler `GET /api/sessions/[id]/generations?liked=true` pour hydrate Pinia uniquement avec les likées.
7. **Tests** :
   - `useGenerationSession.test.ts` : non-likées absentes de DB, purge au quit, rechargement boot (likées only). `// @requirement: FR-071`
   - Integration `DELETE /api/generations/[id]/like` : fichier + sidecar + DB supprimés. `// @requirement: FR-058`
   - Integration `GET /api/sessions/[id]/generations?liked=true` : retourne uniquement les likées. `// @requirement: FR-071`

## Self-review checklist

- [ ] FR-025 (persistance auto) est explicitement restreint ou remplacé sans régression.
- [ ] Le handler `app-quit` ne bloque pas la fermeture (fire-and-forget ou sync rapide).
- [ ] Aucune régression sur les sessions existantes avec des likées déjà en DB.
- [ ] Tests couvrent le cycle complet : générer → non-likée absente DB → liker → en DB → déliker → supprimée DB.
