---
doc: STORY
id: STORY-015
title: Script check:secrets qui scanne le bundle frontend
epic: EPIC-2
status: done
priority: P0
requirements: [NFR-001]
version: 1.0.0
last_updated: 2026-04-28
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-015 — check:secrets

## Livré

- `scripts/check-secrets.mjs` : scanne `.output/public/` pour les patterns `sk-[A-Za-z0-9]{20,}`, `\bfal_[A-Za-z0-9_-]{16,}`, `Bearer\s+[A-Za-z0-9_-]{20,}`. Exit 1 si match.
- Script npm `check:secrets` ajouté.

## Validation

- [x] Build complet → `npm run check:secrets` retourne `OK — no API key patterns found in frontend bundle`.
- [x] NFR-001 verified.
