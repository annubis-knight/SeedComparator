---
doc: STORY
id: STORY-001
title: Scaffolding Nuxt 3 (compat 4) + Electron + Tailwind + tokens glassmorphisme
epic: EPIC-1
status: done
priority: P0
requirements: [NFR-003]
version: 1.0.0
last_updated: 2026-04-28
synced_with: [_epic.md, ../../EPICS.md, ../../../PROGRESS.md]
---

# STORY-001 — Scaffolding initial

## 1. Analyse

Initialiser la structure du projet conforme à `docs/ARCHITECTURE.md` §8 : Nuxt 3 en mode SSR, wrapper Electron qui lance une `BrowserWindow` sur l'app Nuxt locale, Tailwind configuré avec tokens glassmorphisme dans `app/assets/css/tokens.css`. À la fin de cette story, `npm run dev` doit afficher une page Nuxt vide stylée dans une fenêtre Electron, et `npm run build` doit terminer sans erreur.

**Risques identifiés** :
- Compatibilité `nuxt-electron` vs `electron-vite` (tester d'abord `nuxt-electron` qui est plus intégré).
- Mode SSR Nuxt + Electron : vérifier que le serveur Nitro démarre avant l'ouverture de la fenêtre.
- Windows-specific : chemins absolus dans la config Electron.

**Inconnues** :
- Version de Node minimale exigée par Nuxt 3 / Electron 30+ → vérifier au démarrage.

## 2. Critères d'acceptation

| # | Critère | Exigence | Test |
|---|---|---|---|
| AC-1 | `npm install` s'exécute sans erreur | NFR-003 | manuel + CI |
| AC-2 | `npm run dev` ouvre une fenêtre Electron qui charge l'UI Nuxt | NFR-003 | smoke test E2E Playwright |
| AC-3 | `npm run build` produit un bundle sans erreur ni warning bloquant | NFR-003 | exit code 0 en CI |
| AC-4 | La page d'accueil affiche un thème sombre + au moins un élément glassmorphique de démo | — | snapshot visuel (manuel V1) |
| AC-5 | La structure de fichiers respecte `docs/ARCHITECTURE.md` §8 | — | grep des dossiers attendus |

## 3. Tâches techniques

1. `npm init` + ajout deps : `nuxt`, `vue`, `electron`, `nuxt-electron`, `tailwindcss`, `@nuxtjs/tailwindcss`.
2. `nuxt.config.ts` minimal + activation SSR + module Tailwind.
3. Création arborescence : `app/`, `server/`, `electron/`, `shared/`, `tests/`, `docs/stories/`.
4. `electron/main.ts` : lance Nuxt en local, ouvre `BrowserWindow`.
5. `app/assets/css/tokens.css` : variables CSS pour palette sombre + glassmorphisme.
6. `app/assets/css/tailwind.css` : import tokens + Tailwind base.
7. `app/app.vue` + `app/pages/index.vue` : page d'accueil minimaliste avec une carte glass.
8. Scripts `package.json` : `dev`, `build`, `start`, `lint`, `typecheck`, `test`.
9. Config ESLint + Prettier + tsconfig strict.
10. Smoke test Playwright : ouvre l'app, vérifie présence d'un élément clé.

## ✅ Notes runtime debug (post-livraison)

Bugs réellement attrapés en lançant `npm run dev` et corrigés :
- Composants Vue non résolus (`AppButton`, `AppModal`, `Lightbox`, etc.) : Nuxt préfixait par dossier (`UiAppButton`). Fix : `components: [{ path: '~/components/ui', pathPrefix: false }, ...]` dans `nuxt.config.ts`.
- `#internal/nuxt/paths` not defined : conflit `srcDir + ssr=true`. Fix : `future.compatibilityVersion: 4` + `ssr: false`.
- `#app-manifest` warning Vite : `experimental.appManifest: false`.
- electron-vite outDir collision : main et preload écrivaient au même endroit. Fix : `dist-electron/main/` + `dist-electron/preload/` séparés.

## 4. Self-Review (à remplir avant validation)

- [x] Tests AC-1 à AC-5 verts ?
- [x] Aucun fichier > 200 lignes ?
- [x] Pas de `any` dans le TS écrit ?
- [x] Structure `docs/ARCHITECTURE.md` §8 respectée ?
- [x] Pas de dépendance superflue installée ?
- [x] `synced_with` à jour dans cette story ?

## 5. Validation (à remplir avant `done`)

- [x] `npm run lint` ✅
- [x] `npm run typecheck` ✅
- [x] `npm run test` ✅
- [x] `npm run build` ✅
- [x] `npm run check:secrets` (si pertinent à ce stade) ✅

## 6. MAJ documentation (à faire au passage `done`)

- [x] Front-matter de cette story : `status: done`, bump `version`, `last_updated`.
- [x] `PROGRESS.md` : déplacer la ligne dans "Done", recalculer `v1_progress`.
- [x] `docs/REQUIREMENTS.md` : passer NFR-003 en `verified` si test associé vert.
- [x] `README.md` : documenter le quickstart (`npm install`, `npm run dev`).
- [x] Historique bump dans `PROGRESS.md`.
