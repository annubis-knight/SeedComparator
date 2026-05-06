---
doc: STORY
id: STORY-062
title: Endpoint sauvegarde session entière (manifest.json)
epic: EPIC-7
status: done
priority: P0
requirements: [FR-028]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-062 — POST /api/save/session

## Livré

- `server/api/save/session.post.ts` :
  - Validation Zod (`SaveSessionRequestSchema`).
  - Construit un slug depuis le 1er prompt (30 chars max, sanitize alpha-num).
  - Crée `<folder>/YYYY-MM-DD-HH-mm_<slug>/`.
  - Pour chaque `Generation.status === 'success'` → écrit `image_<modelId>_<promptIdx>.png` depuis le cache.
  - Écrit `manifest.json` avec : sessionId, createdAt, prompts, ratio, generations[] (id, prompt, modelId/displayName, seed, status, costUsd, file), totalCostUsd.
  - Update `Session.saved = true`, `Session.saveFolder = <dirPath>`.
- Côté client (`sessions/[id].vue` → `saveSession()`) : dialog natif → POST.

## Validation

- Smoke runtime : la séquence `générer → /sessions/<id> → Sauvegarder` produit le dossier attendu avec les PNGs + manifest.json.
- `// @requirement: FR-028` — implémenté.

## Self-review

- [x] Le manifest.json est **portable** : il contient toute l'info nécessaire pour rejouer la session offline (sans la DB).
- [x] Les `Generation` en `failed` ou `aborted` sont **ignorées** (pas d'image fantôme dans le dossier).
- [x] `Session.saved` n'est pas un flag binaire pour la galerie : il sert à badger "sauvegardée" mais toutes les sessions restent listées (même non sauvegardées) — voir STORY-063.
