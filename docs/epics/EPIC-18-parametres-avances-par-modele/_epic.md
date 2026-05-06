---
doc: EPIC
id: EPIC-18
title: Paramètres avancés mutualisés par modèle (UI playground-grade)
slug: parametres-avances-par-modele
status: done
priority: P1
requirements: [FR-077, FR-078, FR-079, FR-080, FR-081, FR-082, FR-083, FR-084, FR-085]
stories_total: 9
stories_done: 9
stories_in_progress: 0
progress: 100%
version: 1.1.0
last_updated: 2026-05-06
synced_with: [../../EPICS.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md, ../../ARCHITECTURE.md]
---

# EPIC-18 — Paramètres avancés mutualisés par modèle

## Objectif

Exposer les paramètres spécifiques de chaque modèle d'image (Flux, SD 3.5, Imagen 4, Gemini Image, GPT Image, DALL·E…) dans une UI dynamique alignée sur les conventions des playgrounds officiels (sliders, segmented controls, toggles, dropdowns), avec un **catalogue mutualisé de traits** pour éviter toute duplication entre adapters.

Aujourd'hui le pipeline ne transmet que `prompt`, `ratio`, `seed`. Le reste (`guidance_scale`, `num_inference_steps`, `negative_prompt`, `quality`, `style`, `personGeneration`, `temperature`…) est **codé en dur** dans chaque adapter — du potentiel inexploité, et la feature "qualité / images par prompt" est affichée non-implémentée dans `ImageConfigPanel.vue`.

## Principes directeurs

1. **Catalogue de traits unique** (`server/providers/paramTraits.ts`). Chaque trait porte : key, label FR, tooltip pédagogique, type Zod, métadonnées UI (`kind`, range, options, défaut). Un trait défini **une seule fois** est référencé par N modèles.
2. **Composition par modèle** (`modelParamProfiles.ts`). Un modèle = liste de traits + overrides locaux (ex : `numInferenceSteps` a un défaut différent sur Flux Pro vs Schnell).
3. **Distinction fondamentale `scope`** :
   - `scope: 'global'` — valeur partagée entre tous les modèles concernés au sein d'une session (ex : `guidanceScale`, `negativePrompt`, `temperature`). 1 contrôle dans le panneau global.
   - `scope: 'per-generation'` — valeur intimement liée à une instance précise (ex : `seed`, `referenceImage`). Affichée et éditable sur la carte de génération et dans la vue détail/relance.
4. **UI alignée sur les playgrounds officiels**. Slider continu pour CFG/temperature, slider à crans pour steps, segmented control pour quality/safety_tolerance, toggle pour booléens, dropdown pour enums longs, input + bouton dé pour seed. ~10 `kind` plafonnés, pas d'inflation.
5. **Tooltip d'information obligatoire sur chaque paramètre** (icône `i`, hover/focus, accessible).
6. **Estimation de coût réactive** aux paramètres qui affectent le prix (ex : `quality=hd` sur DALL·E 3 → ×2).
7. **Persistance complète** : `Generation.params Json` figé en DB pour rejouabilité.

## Couverture des modèles

Tous les modèles du registry V1 (cf. `server/providers/registry.ts`) :

- **OpenAI** : `dall-e-2`, `dall-e-3`, `gpt-image-1-mini`, `gpt-image-1`, `gpt-image-1.5`, `gpt-image-2`
- **Google AI** : `imagen-4-fast`, `imagen-4`, `imagen-4-ultra`, `gemini-2.5-flash-image`, `gemini-3.1-flash-image-preview`, `gemini-3-pro-image-preview`
- **Fal.ai** : `flux-1.1-schnell`, `flux-1.1-pro`, `sd-3.5-large`

## Stories

| ID | Titre | Statut |
|---|---|---|
| STORY-120 | Catalogue de traits + profils par modèle (backend) | done |
| STORY-121 | Adapters — consommation des params résolus (global ∪ per-gen) | done |
| STORY-122 | Composants Vue atomiques de paramètres (sliders, segmented, toggle…) | done |
| STORY-123 | Composant `InfoTooltip` réutilisable (icône i + tooltip accessible) | done |
| STORY-124 | Panneau global `ModelParamsPopover` (scope=global) | done |
| STORY-125 | Estimation de coût réactive aux paramètres `affectsCost` | done |
| STORY-126 | Persistance `Generation.params` + vue détail enrichie | done |
| STORY-128 | UI per-generation : seed sur carte + relance avec seed verrouillée + image de référence | done |
| STORY-127 | Documentation (REQUIREMENTS, ARCHITECTURE, PRD) | done |

Ordre conseillé : 120 → (122, 123) en parallèle → (121, 124) en parallèle → 125 → 126 → 128 → 127.

## Critère de fin d'épique

- [ ] 9 stories `done`.
- [ ] Chaque famille de modèles expose ≥3 paramètres spécifiques au-delà du contrat commun (`prompt`, `ratio`).
- [ ] L'UI n'affiche jamais un paramètre qui ne s'applique pas au modèle sélectionné.
- [ ] Tous les paramètres affichés portent un tooltip non-vide (test composant garde-fou).
- [ ] Une session avec params custom est rejouable à l'identique depuis la vue détail.
- [ ] Aucun paramètre invalide ne franchit l'endpoint (validation Zod côté serveur).
- [ ] Pipeline `lint + typecheck + test + build + check:secrets` 100 % vert.
- [ ] Smoke test runtime : choisir Flux Pro + Imagen 4 + DALL·E 3, ouvrir le popover de chaque modèle, vérifier que les contrôles sont cohérents avec ce que propose le playground officiel, lancer une génération, vérifier que la seed est figée par carte et qu'on peut relancer un seul modèle avec une seed modifiée.

## Hors scope

- Profils de paramètres réutilisables ("Préréglages Flux Pro photo réaliste") — post-V1.
- LoRA, ControlNet, IP-Adapter avancés sur SD 3.5 — sprint édition d'image (post-V1).
- Configuration des paramètres par phase (Wireframe / Mood / UI-UX) — V2 si besoin émerge.
