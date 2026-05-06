---
doc: PROGRESS
version: 3.4.3
last_updated: 2026-05-06
synced_with: [CLAUDE.md, docs/PRD.md, docs/REQUIREMENTS.md, docs/EPICS.md, docs/ARCHITECTURE.md, docs/epics/]
project_status: v1_plus_ux_refonte_plus_brief_assistant_v2_plus_openai_direct_plus_sessions_likes_plus_railnav_plus_testing_fixtures_plus_env_keys_plus_probe_cli_plus_phasage_workflow_in_progress_plus_splitpane_layout_done_plus_vocabulary_v1_2_done_plus_epic_18_done
v1_progress: 90%
stories_total: 78
stories_done: 70
stories_proposed_post_v1: 8
stories_documented: 78
tests_unit_passing: 228
tests_integration_passing: 14
tests_total: 242
models_total_db: 15
build_status: green
typecheck_status: green
secrets_status: green
---

# PROGRESS — SeedComparator

Tableau de bord du projet. **Source unique pour savoir où on en est.**

## Validation pipeline (état au 2026-04-29)

| Check | Commande | Résultat |
|---|---|---|
| Build | `npm run build` | ✅ vert (bundle server 6.44 MB) |
| Typecheck server | `npm run typecheck` | ✅ vert |
| Lint | `npm run lint` | ✅ 0 erreur (9 warnings pré-existants `any` dans tests/SSE) |
| Tests unit | `npm run test` | ✅ 96/96 |
| Tests integration | `npm run test:integration` | ✅ 5/5 |
| Secrets leak | `npm run check:secrets` | ✅ aucun match |
| Runtime smoke | manuel (Electron `npm run dev`) | ✅ |

## Indicateurs globaux (post-EPIC-14 + EPIC-15 in_progress)

| Indicateur | Valeur |
|---|---|
| Phase actuelle | V1 livré + EPIC-15 (phasage workflow) en cours — STORY-112 done, STORY-105/106/107 proposed + EPIC-16 (assistant LLM) en cours de planification |
| Stories totales | 78 |
| Stories `done` | 70 |
| Stories `proposed` (backlog + nouvelles) | 8 (STORY-012, STORY-014, STORY-051, STORY-105→109) |
| Avancement | 90 % |
| Exigences `verified` (test auto) | 37 / 73 |
| Exigences `implemented` (runtime OK, pas de test auto dédié) | 15 / 73 |
| Exigences `proposed` (non livré) | 21 / 73 |

## Sprint actuel — Brief Assistant V2 (2026-04-29)

**Livré aujourd'hui** :
- **STORY-092** (V1) : infrastructure Brief Assistant — page Accueil, crawler cheerio, screenshot Playwright, palette node-vibrant, vision LLM Haiku 4.5, endpoint SSE, persistance localStorage + DB.
- **STORY-093** (V2) : refonte orientée outil d'inspiration — formulaire allégé tout-optionnel (5 champs : DA, mood, UI/UX, typo, palette + URLs), pré-prompts statiques `PROMPT_PREFIX_A/B/C` dans `shared/contracts.ts`, helper `joinPromptVariant()`, logique LLM en mode complétion (pas prompts complets), bouton ↺ Réinitialiser dans `PromptInputs`, banque vocabulaire enrichie v1.1.0 avec catégories `web_design_styles` (41 termes) + `typography_styles` (26 termes).
- **Banque vocabulaire** : 318 termes / 13 catégories, sources fiables datées 2026-04-29 documentées dans [docs/prompt-vocabulary-sources.md](docs/prompt-vocabulary-sources.md).

**Action utilisateur restante** : valider le runtime avec une vraie clé OpenRouter (mockMode=false) pour confirmer que les 3 prompts produits par Haiku sont qualitatifs.

## Épiques

| Épique | Statut | FR/NFR couverts | Stories | Avancement |
|---|---|---|---|---|
| [EPIC-1](docs/epics/EPIC-1-fondations-techniques/_epic.md) | done | NFR-003 | 3/3 | 100% |
| [EPIC-2](docs/epics/EPIC-2-config-securite-cles-api/_epic.md) | in_progress | FR-001 → FR-005, NFR-001 | 4/6 | 67% |
| [EPIC-3](docs/epics/EPIC-3-adapters-providers/_epic.md) | done | FR-009, FR-015, FR-033, FR-034 | 5/5 | 100% |
| [EPIC-4](docs/epics/EPIC-4-generation-batch/_epic.md) | done | FR-006 → FR-016, FR-025 | 4/4 | 100% |
| [EPIC-5](docs/epics/EPIC-5-ui-exploration/_epic.md) | done | FR-013, FR-017 → FR-024, NFR-002 | 9/9 | 100% |
| [EPIC-6](docs/epics/EPIC-6-vue-approfondie/_epic.md) | in_progress | FR-021, FR-022 | 1/2 | 50% |
| [EPIC-7](docs/epics/EPIC-7-sauvegarde-galerie/_epic.md) | done | FR-026 → FR-030 | 5/5 | 100% |
| [EPIC-8](docs/epics/EPIC-8-activation-modeles/_epic.md) | done | FR-032 | 2/2 | 100% |
| [EPIC-9](docs/epics/EPIC-9-refonte-ux-exploration/_epic.md) | done | FR-035 → FR-052 + FR-055, NFR-004 | 12/12 | 100% |
| [EPIC-10](docs/epics/EPIC-10-imagen-google-ai/_epic.md) | done | FR-051 | 1/1 | 100% |
| [EPIC-11](docs/epics/EPIC-11-brief-assistant/_epic.md) | done | FR-053, FR-054 | 2/2 | 100% |
| [EPIC-12](docs/epics/EPIC-12-openai-direct/_epic.md) | done | FR-056 | 1/1 | 100% |
| [EPIC-13](docs/epics/EPIC-13-sessions-and-likes/_epic.md) | done | FR-057, FR-058, FR-059, FR-060 | 4/4 | 100% |
| [EPIC-14](docs/epics/EPIC-14-testing-fixtures-providers/_epic.md) | done | FR-061, FR-062, FR-063, FR-064, FR-067, FR-068 | 5/5 | 100% |
| [EPIC-15](docs/epics/EPIC-15-phasage-workflow-generation/_epic.md) | in_progress | FR-053, FR-054, FR-057(ext), FR-058(ext), FR-059(ext), FR-069, FR-070, FR-071, FR-072 | 1/4 | 25% |
| [EPIC-16](docs/epics/EPIC-16-assistant-creatif-llm/_epic.md) | proposed | FR-073 | 0/2 | 0% |
| [EPIC-17](docs/epics/EPIC-17-splitpane-layout/_epic.md) | done | FR-075, FR-076 | 2/2 | 100% |
| [EPIC-18](docs/epics/EPIC-18-parametres-avances-par-modele/_epic.md) | done | FR-077, FR-078, FR-079, FR-080, FR-081, FR-082, FR-083, FR-084, FR-085 | 9/9 | 100% |

## Stories — état détaillé

### 🟢 Done (58)

EPIC-1 : 001, 002, 003 · EPIC-2 : 010, 011, 013, 015 · EPIC-3 : 020, 021/022, 023/024 · EPIC-4 : 030, 031, 032, 033 · EPIC-5 : 040 → 048 · EPIC-6 : 050 · EPIC-7 : 060, 061, 062, 063, 064 · EPIC-8 : 070, 071 · EPIC-9 : 080 → 089, 091, 094 · EPIC-10 : 090 · EPIC-11 : 092, 093 · EPIC-12 : 095 · EPIC-13 : 096, 097, 098, 099 · EPIC-14 : 100, 101, 102, 103, 104 · EPIC-15 : 112 · EPIC-17 : 110, 111.

### ⚪ Proposed (backlog post-V1)

- **STORY-012** — Bouton "Tester la clé" + endpoint de ping (FR-002).
- **STORY-014** — UI de modification du seuil de coût (FR-005, partiel).
- **STORY-051** — Action "Relancer sur ce modèle" (FR-022).

### 🔵 Proposed (EPIC-15 — Phasage workflow)

- **STORY-105** — Sélecteur de phase + 9 prompts persistés par session (FR-069, FR-070, FR-057).
- **STORY-106** — Cycle de vie mémoire vive vs DB (FR-071, FR-058).
- **STORY-107** — Vue Historique enrichie — filtres phase + visibilité conditionnelle (FR-072, FR-059).

### 🔵 Proposed (EPIC-16 — Assistant créatif LLM)

- **STORY-108** — Adapter Gemini text + route Nitro `/api/helper/chat` (FR-073).
- **STORY-109** — Modale chatbot par phase + insertion blocs prompt dans A/B/C (FR-073).

### 🟢 Done (EPIC-18 — Paramètres avancés par modèle, livré 2026-05-06)

- **STORY-120** — Catalogue de traits + profils + résolveur (FR-077, FR-078). 17 tests unit.
- **STORY-121** — Adapters consomment les params résolus, anti-régression validée (FR-079). +9 tests.
- **STORY-122** — 9 composants Vue atomiques + dispatcher `ParamField` (FR-080). 12 tests.
- **STORY-123** — `InfoTooltip` réutilisable accessible (FR-081). 6 tests.
- **STORY-124** v4 — Factorisation **totale** des paramètres avancés : un trait = un contrôle, peu importe sa portée. Liste plate dans `ImageConfigPanel`. Deux types : `CanonicalParamRow` (échelles homogènes qui démultiplexent quand la sémantique diverge) et `FactorizedTraitRow` (rendu direct + propagation simultanée quand la signature est identique entre modèles). Plus de section "Spécifique par modèle" (FR-082). Tests : catalogue canonique ×21, `CanonicalParamRow` ×10, `FactorizedTraitRow` ×5, `ImageConfigPanel` ×8, composable ×7.
- **STORY-125** — Coût réactif aux traits `affectsCost` (DALL·E 3 hd ×2, GPT Image low/medium/high) (FR-083). +3 tests.
- **STORY-126** — Migration Prisma `Generation.params Json?`, DTO étendu, manifest export, sidecar likes (FR-084).
- **STORY-128** — `usePerGenerationParams` + UI seed cliquable + lock 🔒 sur GenerationCard (FR-085). 3 tests composable.
- **STORY-127** — Documentation finale (cette mise à jour).

## Honnêteté méthodologique

⚠️ **Aveu** : la boucle de travail définie dans CLAUDE.md §2 n'a pas été suivie story-par-story pendant l'implémentation initiale. Le code a été produit en bloc, puis :
1. Tous les tests ont été écrits et lancés (36 unit + 5 integration tous verts).
2. Le build, le typecheck et le check:secrets ont été lancés et ont passé.
3. Le runtime a été smoke-testé en live (curl) après debug du `npm run dev`.
4. Les fichiers `_epic.md` et `STORY-XXX.md` ont été rétro-documentés en reflétant l'état réel (option A choisie par l'utilisateur).

Les stories qui mentionnent `verified` ont un test automatique qui passe. Celles qui mentionnent `implemented` ont été validées au runtime mais sans test automatique dédié. Celles `proposed` n'ont pas été livrées en V1.

## Bugs runtime corrigés pendant le debug post-build

1. Composants Vue non résolus (préfixe par dossier Nuxt) → `components: [{ pathPrefix: false }, ...]`.
2. `#internal/nuxt/paths` not defined → `future.compatibilityVersion: 4` + suppression du `srcDir` explicite.
3. `#app-manifest` warning → `experimental.appManifest: false`.
4. electron-vite outDir collision → `dist-electron/main/` + `dist-electron/preload/` séparés.
5. Stream controller closing → flag `closed` + try/catch silencieux dans `/api/generate.post.ts`.
6. Vitest 2 vs 3 conflict → bump Vitest 3.
7. Vitest fetch mocking → `vi.stubGlobal('fetch', ...)` au lieu de `vi.spyOn`.
8. Env Vitest mixte (Node/happy-dom) → `environmentMatchGlobs` par dossier.
9. tsconfig.server.json étendait `'../**/*'` → restriction explicite.

## Historique des bumps

| Date | Doc impacté | Version | Raison |
|---|---|---|---|
| 2026-04-28 | CLAUDE.md | 1.1.0 | Boucle requirement-driven + structure stories par épique |
| 2026-04-28 | docs/ARCHITECTURE.md | 0.1.0→0.2.0 | Stack Nuxt 3.21 + compat 4, Electron 33 |
| 2026-04-28 | docs/PRD.md | 0.2.0 | Front-matter |
| 2026-04-28 | docs/REQUIREMENTS.md | 0.2.0 | Matrice de traçabilité avec tests réels |
| 2026-04-28 | docs/EPICS.md | 0.3.0 | Index avec statuts réels |
| 2026-04-28 | docs/epics/EPIC-1 à EPIC-8/_epic.md | 0.2.0 | Statuts done/in_progress + critères cochés |
| 2026-04-28 | PROGRESS.md | 1.0.0 | Rétro-documentation honnête post-implémentation |
| 2026-04-29 | docs/epics/EPIC-5/6/7/8/STORY-*.md | 1.0.0 | Création des 18 fichiers stories manquants pour EPIC-5, 6, 7, 8 |
| 2026-04-29 | docs/EPICS.md | 0.4.0 | Index mis à jour avec arborescence stories complète |
| 2026-04-29 | PROGRESS.md | 1.1.0 | Tracking : `stories_documented: 36` |
| 2026-04-29 | docs/epics/EPIC-2/STORY-012, STORY-014.md | 0.1.0 | Création des 2 fichiers stories `proposed` (post-V1) pour doc 100% exhaustive |
| 2026-04-29 | docs/EPICS.md | 0.5.0 | Index : ajout STORY-012 et STORY-014 dans l'arborescence EPIC-2 |
| 2026-04-29 | PROGRESS.md | 1.2.0 | `stories_documented: 36 → 36/36 incluant proposed` |
| 2026-04-29 | docs/REQUIREMENTS.md | 0.3.0 | Ajout FR-035 → FR-041 + NFR-004 (refonte UX EPIC-9) |
| 2026-04-29 | docs/epics/EPIC-9-refonte-ux-exploration/* | 1.0.0 | Création + livraison de l'épique refonte UX (5 stories done) |
| 2026-04-29 | docs/EPICS.md | 0.6.0 | Index : ajout EPIC-9 (5 stories) |
| 2026-04-29 | PROGRESS.md | 1.3.0 | EPIC-9 livré, 38/41 stories done, 63 tests unit (vs 36) |
| 2026-04-29 | docs/REQUIREMENTS.md | 0.4.0 | Ajout FR-042 (brand classification) + FR-043 (gateway UI) |
| 2026-04-29 | prisma/schema.prisma | — | Ajout `Model.brandId/brandDisplayName/brandSortOrder` + migration |
| 2026-04-29 | docs/epics/EPIC-9/STORY-085-086.md | 1.0.0 | Brand classification + gateway UI livrés (2 stories done) |
| 2026-04-29 | docs/EPICS.md | 0.7.0 | EPIC-9 passé à 7/7 stories |
| 2026-04-29 | PROGRESS.md | 1.4.0 | 40/43 stories done, 67 tests unit (vs 63) |
| 2026-04-29 | docs/REQUIREMENTS.md | 0.5.0 | Ajout FR-044 (regroupement par brand dans Grid+Flex) |
| 2026-04-29 | docs/epics/EPIC-9/STORY-087.md | 1.0.0 | STORY-087 done : sections brand en grid, headers brand uniques en flex |
| 2026-04-29 | docs/EPICS.md | 0.8.0 | EPIC-9 passé à 8/8 stories |
| 2026-04-29 | PROGRESS.md | 1.5.0 | 41/44 stories done, 70 tests unit (vs 67) |
| 2026-04-29 | docs/REQUIREMENTS.md | 0.6.0 | Ajout FR-045 (app shell unifié) + FR-046 (collapse prompts) + FR-047 (aération renforcée) |
| 2026-04-29 | docs/epics/EPIC-9/STORY-088.md | 1.0.0 | STORY-088 done : SidePanel = app shell global, collapse prompts, grid/flex aérés |
| 2026-04-29 | docs/EPICS.md | 0.9.0 | EPIC-9 passé à 9/9 stories |
| 2026-04-29 | PROGRESS.md | 1.6.0 | 42/45 stories done, 73 tests unit (vs 70) |
| 2026-04-29 | docs/REQUIREMENTS.md | 0.7.0 | Ajout FR-048 (placeholder image) + FR-049 (cascade flex hauteur) + FR-050 (dark slate) |
| 2026-04-29 | docs/epics/EPIC-9/STORY-089.md | 1.0.0 | STORY-089 done : corrections UI (flex hauteur, placeholder, chevrons, dark slate, bouton Générer dans tabs) |
| 2026-04-29 | docs/EPICS.md | 1.0.0 | EPIC-9 passé à 10/10 stories |
| 2026-04-29 | PROGRESS.md | 1.7.0 | 43/46 stories done, 77 tests unit (vs 73) |
| 2026-04-29 | docs/REQUIREMENTS.md | 0.8.0 | Ajout FR-051 (adapter google-ai Imagen) |
| 2026-04-29 | docs/epics/EPIC-10-imagen-google-ai/* | 1.0.0 | Création EPIC-10 + STORY-090 done (3 modèles Imagen via Gemini API) |
| 2026-04-29 | docs/EPICS.md | 1.1.0 | EPIC-10 ajouté, total 44/47 stories |
| 2026-04-29 | PROGRESS.md | 1.8.0 | 44/47 stories done, 87 tests unit (vs 77) |
| 2026-04-29 | docs/REQUIREMENTS.md | 0.9.0 | Ajout FR-052 (PromptSwitcher universel + Tous) |
| 2026-04-29 | docs/epics/EPIC-9/STORY-091.md | 1.0.0 | STORY-091 done : switcher Grid+Flex, mode "Tous" multiplie colonnes en flex |
| 2026-04-29 | docs/EPICS.md | 1.2.0 | EPIC-9 passé à 11/11 stories |
| 2026-04-29 | PROGRESS.md | 1.9.0 | 45/48 stories done, 96 tests unit (vs 87) |
| 2026-04-29 | docs/REQUIREMENTS.md | 1.0.0 | Ajout FR-053 (Brief Assistant) |
| 2026-04-29 | docs/epics/EPIC-11-brief-assistant/* | 1.0.0 | Création EPIC-11 + STORY-092 done (page Accueil + crawler + screenshots + LLM Haiku) |
| 2026-04-29 | prisma/schema.prisma | — | Ajout `Session.brief Json?` + migration |
| 2026-04-29 | docs/EPICS.md | 1.3.0 | EPIC-11 ajouté, total 46/49 stories |
| 2026-04-29 | PROGRESS.md | 2.0.0 | 46/49 stories done, brief assistant livré |
| 2026-04-29 | docs/prompt-vocabulary-sources.md | 1.0.0 | Sources fiables datées (MJ V7, Flux, Imagen 4, GPT Image, lighting cinéma, art mvts) |
| 2026-04-29 | server/data/prompt-vocabulary.json | 1.0.0 | Banque 252 termes en 11 catégories (lighting/composition/lens/cinema/art/illustration/3D/mood/textures/palettes) |
| 2026-04-29 | server/providers/openrouter-text.ts | — | System prompt révisé : cadrage souple (creative designer / hero / typo haute), banque injectée, diversité créative encouragée, temperature 0.85 |
| 2026-04-29 | shared/contracts.ts | — | Ajout PROMPT_PREFIX_A/B/C + joinPromptVariant() ; refonte BriefRequestSchema (5 champs optionnels : artDirection, mood, uiStyle, typography, palette + urls) |
| 2026-04-29 | server/data/prompt-vocabulary.json | 1.1.0 | Ajout catégories web_design_styles + typography_styles (66 nouveaux termes, total 318) |
| 2026-04-29 | server/providers/openrouter-text.ts | — | Logique "complétion" : LLM génère uniquement les compléments aux préfixes (pas des prompts complets) ; system prompt orienté outil d'inspiration / divergence créative |
| 2026-04-29 | app/pages/index.vue | — | Pré-prompts par défaut chargés dans les 3 textareas au mount + handler resetPromptsToDefaults |
| 2026-04-29 | app/components/session/PromptInputs.vue | — | Bouton ↺ Réinitialiser à côté du chevron de collapse |
| 2026-04-29 | app/pages/home.vue | — | Concaténation préfixe+complément via joinPromptVariant() avant redirect /generate |
| 2026-04-29 | docs/REQUIREMENTS.md | 1.1.0 | Ajout FR-054 (pré-prompts par défaut + logique complétion) |
| 2026-04-29 | docs/epics/EPIC-11-brief-assistant/STORY-093-prefixes-and-completion.md | 1.0.0 | Création STORY-093 (refonte outil d'inspiration : préfixes + complétion + formulaire allégé + banque enrichie) |
| 2026-04-29 | docs/epics/EPIC-11-brief-assistant/STORY-092-brief-assistant.md | 1.1.0 | Note de révision pointant vers STORY-093 |
| 2026-04-29 | docs/epics/EPIC-11-brief-assistant/_epic.md | 1.3.0 | Ajout STORY-093, philosophie "outil d'inspiration", critères refondus |
| 2026-04-29 | docs/EPICS.md | 1.4.0 | Index : EPIC-11 passé à 2/2 stories, total 47/50 |
| 2026-04-29 | PROGRESS.md | 2.1.0 | Sprint 092+093 livré : Brief Assistant V2 (orienté inspiration), 47/50 stories done |
| 2026-04-29 | docs/REQUIREMENTS.md | 1.2.0 | Ajout FR-055 (Budget slider) |
| 2026-04-29 | docs/epics/EPIC-9-refonte-ux-exploration/STORY-094-budget-slider.md | 1.0.0 | STORY-094 done : composant BudgetSlider sous ModelSelector dans ProvidersPanel |
| 2026-04-29 | docs/epics/EPIC-9-refonte-ux-exploration/_epic.md | 1.4.0 | EPIC-9 passé à 12/12 stories (ajout STORY-094) |
| 2026-04-29 | docs/EPICS.md | 1.5.0 | Index : EPIC-9 12/12, total 48/51 |
| 2026-04-29 | PROGRESS.md | 2.2.0 | 48/51 stories done, 103 tests unit (vs 96) |
| 2026-05-01 | docs/REQUIREMENTS.md | 1.3.0 | Ajout FR-056 (OpenAI direct gateway + 5 modèles incl. GPT Image 2 sorti 2026-04-21) |
| 2026-05-01 | server/providers/openai.ts | — | Création adapter openai (gpt-image-2/1/1-mini, dall-e-3/2 ; gestion familles gpt-image vs dall-e) |
| 2026-05-01 | server/providers/types.ts | — | ProviderSource += 'openai' |
| 2026-05-01 | server/providers/registry.ts | — | Enregistre les 5 modèles OpenAI directs (real + mock) |
| 2026-05-01 | prisma/seed.ts | — | Ajout provider 'openai' (OpenAI Platform) + 5 modèles brand OpenAI |
| 2026-05-01 | tests/unit/server/providers/openai.test.ts | 1.0.0 | 14 tests unit adapter openai |
| 2026-05-01 | docs/epics/EPIC-12-openai-direct/* | 1.0.0 | Création EPIC-12 + STORY-095 done |
| 2026-05-01 | docs/EPICS.md | 1.6.0 | Index : EPIC-12 ajouté, total 49/52 stories |
| 2026-05-01 | PROGRESS.md | 2.3.0 | 49/52 stories done, 117 tests unit (vs 103), 15 modèles en DB (vs 10) |
| 2026-05-06 | docs/epics/EPIC-17-splitpane-layout/* | 1.0.0 | Création EPIC-17 + STORY-110 (useSplitPane + SplitPane.vue) + STORY-111 (auto-collapse génération) |
| 2026-05-06 | app/composables/useSplitPane.ts | 1.0.0 | Composable splitpane : clamp, persist localStorage, setCollapsed, setAutoCollapse |
| 2026-05-06 | app/components/SplitPane.vue | 1.0.0 | Composant split-pane draggable mouse+touch, ResizeObserver |
| 2026-05-06 | app/components/generation/GenerationControls.vue | 1.0.0 | Refactor : collapse toggle dans barre de contrôle, animation tiroir, bouton assistant en mode collapsé |
| 2026-05-06 | app/components/generation/GenerationResults.vue | 1.0.0 | Nouveau composant wrapper GenerationGrid avec padding |
| 2026-05-06 | app/pages/index.vue | — | Intégration SplitPane, racine unique (fix Vue warn class inheritance), watch inProgress → setAutoCollapse |
| 2026-05-06 | tests/unit/composables/useSplitPane.test.ts | 1.0.0 | 9 tests FR-075/FR-076 |
| 2026-05-06 | tests/unit/components/SplitPane.test.ts | 1.0.0 | 4 tests FR-075 |
| 2026-05-06 | tests/unit/components/GenerationControls.test.ts | 1.0.0 | 6 tests FR-046 collapse UX |
| 2026-05-06 | PROGRESS.md | 3.1.0 | EPIC-17 done, 60/68 stories done, 218 tests unit |
| 2026-05-06 | server/data/prompt-vocabulary.json | 1.2.0 | Vocabulaire restructuré en 8 groupes, +4 catégories (web_layout_principles, anti_pattern_layout, conceptual_collisions, brand_values_visual_translation), 472 termes (vs 318), méta `_group`/`_subgroup`/`_phaseAffinity` par catégorie |
| 2026-05-06 | shared/contracts.ts | — | Réécriture des 9 PROMPT_DEFAULTS_BY_PHASE : autonomes, sans variables, sans syntaxe modèle, sans image source. Wireframe = anti-pattern + radical negative space ; Mood = pont valeur→visuel ; UI/UX = top-heavy + seamless fade to bottom |
| 2026-05-06 | server/providers/openrouter-text.ts | — | `buildVocabularySection()` rend une sortie groupée par `_group` avec affichage du `_subgroup` + `_phaseAffinity` ; system prompt Brief Assistant enrichi (sections "Pont sémantique valeurs→visuel" + "Collisions conceptuelles" + contraintes techniques) |
| 2026-05-06 | server/api/helper/chat.post.ts | — | SYSTEM_PROMPT helper étendu (règles par phase, vocabulaire ciblé, contraintes pas-de-variable/pas-d'image, collisions conceptuelles) ; MOCK_REPLY actualisé |
| 2026-05-06 | tests/unit/server/data/prompt-vocabulary.test.ts | 1.0.0 | 11 tests intégrité du JSON v1.2.0 (méta, groupes, affinités, collisions/valeurs en patterns) |
| 2026-05-06 | tests/unit/server/providers/openrouter-text.vocabulary.test.ts | 1.0.0 | 6 tests buildVocabularySection groupé |
| 2026-05-06 | tests/unit/contracts.test.ts | — | +8 tests STORY-112 invariants des 9 prompts par défaut (pas de placeholder, pas de syntaxe modèle, wireframe sans couleur, uiux avec top-heavy + seamless fade) |
| 2026-05-06 | docs/epics/EPIC-15-phasage-workflow-generation/STORY-112-vocabulaire-v1-2-prompt-morphing.md | 1.0.0 | Création STORY-112 done (vocabulaire v1.2.0 + prompts par phase enrichis) |
| 2026-05-06 | docs/epics/EPIC-15-phasage-workflow-generation/_epic.md | 1.1.0 | EPIC-15 status proposed → in_progress, +STORY-112 done, 1/4 stories done, +FR-053/FR-054 |
| 2026-05-06 | PROGRESS.md | 3.2.0 | STORY-112 done, EPIC-15 in_progress 25%, 61/69 stories done, 242 tests (vs 232) |

## Comment lire ce document

- **Une story `done`** = code livré + test associé vert (si applicable) + runtime validé.
- **Une exigence `verified`** = au moins un test automatique (unit ou integration) la couvre et passe en CI.
- **Une exigence `implemented`** = livrée et validée runtime mais sans test dédié — backlog test à compléter post-V1.
- **Une exigence `proposed`** = non livrée V1.
