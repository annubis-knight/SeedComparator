---
doc: STORY
id: STORY-010
title: Wrapper safeStorage Electron + IPC d'accès
epic: EPIC-2
status: done
priority: P0
requirements: [FR-001, NFR-001]
version: 1.0.0
last_updated: 2026-04-28
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-010 — Wrapper safeStorage + IPC

## Livré

- `electron/main.ts` :
  - Handlers IPC `keys:get`, `keys:set`, `keys:list`.
  - `loadEncryptedKeys()` / `saveEncryptedKeys()` via `safeStorage.encryptString()`.
  - Stockage : `userData/api-keys.bin` chiffré OS (DPAPI Windows / Keychain mac / libsecret Linux).
- `electron/preload.ts` : expose `window.seedApi.keys` au renderer.
- `app/types/global.d.ts` : déclaration TS de `Window.seedApi`.

## Validation

- [x] Aucune clé n'est jamais sérialisée en clair sur disque (vérifié par lecture du fichier `api-keys.bin`).
- [x] Aucune clé n'apparaît dans le bundle frontend (`npm run check:secrets` ✅).
- [x] Côté Nitro, `server/services/apiKeys.ts` garde un cache mémoire alimenté par les routes — la clé ne sort jamais du process serveur.
