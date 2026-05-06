---
doc: STORY
id: STORY-064
title: Réouverture d'une session sauvegardée
epic: EPIC-7
status: done
priority: P1
requirements: [FR-030]
version: 1.0.0
last_updated: 2026-04-29
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-064 — Réouverture session

## Livré

Combiné dans `STORY-050` (page détail) + `STORY-061/062` (sauvegarde) :

- Cliquer sur une session de la galerie → `/sessions/<id>` charge depuis `prisma.session.findUnique`.
- Pour chaque `Generation` :
  - Si `imageDataUrl` (cache mémoire dispo) → image affichée inline base64.
  - Sinon si `imagePath` (sauvegardée disque) → `<img :src="file://<path>">` (Electron supporte `file://`).
  - Sinon → "image absente" (cache purgé, jamais sauvegardée).

## Validation

- Smoke runtime : la séquence `générer → sauvegarder session → fermer / rouvrir Electron → galerie → cliquer sur la session → images visibles depuis le disque` fonctionne.
- `// @requirement: FR-030` — implémenté.

## Self-review

- [x] Aucun appel provider lors de la réouverture (lecture pure DB + filesystem).
- [x] Les sessions non sauvegardées restent consultables tant que le cache mémoire est vivant (ie pendant la même session Electron).
- [x] Le manifest.json sauvegardé permet (à terme) de réimporter une session depuis un dossier sur une autre machine — backlog post-V1.
