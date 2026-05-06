---
doc: STORY
id: STORY-060
title: Service imageCache (cache temp en mémoire)
epic: EPIC-7
status: done
priority: P0
requirements: [FR-026]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-060 — imageCache

## Livré

- `server/services/imageCache.ts` : `Map<generationId, { buffer, mime, createdAt }>`.
- API : `putImage`, `getImage`, `deleteImage`, `clearAll`, `imageToDataUrl`.
- Appelé par `generate.post.ts` au callback `onResult` succès → `putImage(genId, buffer, mime)`.
- Lu par `sessions/[id].get.ts` → `imageToDataUrl(genId)` pour rendre l'image inline en `data:image/png;base64,...`.

## Pourquoi en mémoire et pas sur disque

- **FR-026 strict** : aucune écriture disque automatique.
- Le cache vit le temps de la session Electron uniquement. Si le serveur Nitro redémarre, les images en cache sont perdues — c'est attendu.
- L'utilisateur sauvegarde explicitement via `/api/save/image` ou `/api/save/session` pour persister sur disque.

## Validation

- Smoke runtime : la séquence `générer → ouvrir détail → image visible` fonctionne (test via `npm run dev`).
- `// @requirement: FR-026` — implémenté.

## Self-review

- [x] Aucune persistance disque tant que l'utilisateur ne clique pas Sauvegarder.
- [x] Pas de risque de fuite mémoire en V1 (volume usage personnel — quelques dizaines d'images max par session).
- [ ] Backlog post-V1 : ajouter une LRU avec limite (ex: 200 images / 500 MB).
