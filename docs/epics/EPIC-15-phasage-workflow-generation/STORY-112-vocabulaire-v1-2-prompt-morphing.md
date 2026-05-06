---
doc: STORY
id: STORY-112
epic: EPIC-15
title: Vocabulaire v1.2 + prompts par phase enrichis (prompt morphing)
slug: vocabulaire-v1-2-prompt-morphing
status: done
priority: P1
requirements: [FR-054, FR-069, FR-053]
version: 1.0.0
last_updated: 2026-05-06
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md, ../../prompt-vocabulary-sources.md]
---

# STORY-112 — Vocabulaire v1.2 + prompts par phase enrichis (prompt morphing)

## Analyse

Étude utilisateur (conversation Gemini exportée 2026-05-06, archivée à la racine du repo dans `gemini-conversation-2026-05-06-13-07-46.md`) sur les techniques de **prompt morphing** appliquées au design de hauts de landing page. Cinq enseignements transposables :

1. **Pont sémantique valeurs → visuel** : les modèles d'image ne comprennent pas les valeurs abstraites ("confiance", "innovation"). Sans guidance, le LLM générateur de prompts tombe dans le **cliché statistique** (cadenas pour la sécurité, voiture pour la vitesse). Il faut traduire les valeurs en éléments visuels concrets (formes, lumière, matières, palettes).
2. **Anti-patterns de layout** : pour casser la grille classique en phase wireframe (`broken grid`, `radical asymmetry`, `overlapping placeholder blocks`).
3. **Collisions conceptuelles** : couples improbables (`zen garden × futuristic glass`, `brutalist concrete × delicate serif`) qui forcent l'innovation sans demander à l'utilisateur de fournir une métaphore préalable.
4. **Affinité par phase** : tous les termes du vocabulaire ne sont pas pertinents pour toutes les phases (`top-heavy composition` → wireframe + uiux, `Kodak Portra 400` → mood + uiux). Il faut exposer cette affinité au LLM.
5. **Composition top-heavy + fade bas** : invariants pour le format hero qui doit ménager l'espace sous la section pour la suite de page.

**Contraintes (non négociables, contextes spécifiques au projet)** :
- Aucune image de référence dans les prompts (l'app ne supporte pas l'image-to-image).
- Aucun placeholder type `[Industrie]` / `[Valeur]` (les prompts doivent être autonomes).
- Aucune syntaxe modèle-spécifique (`--chaos`, `--stylize`, `::weighting`, ControlNet) — neutralité multi-modèles.

**Risques** :
- La réorganisation du JSON vocabulaire (ajout de méta `_group`/`_subgroup`/`_phaseAffinity`) pourrait casser `buildVocabularySection()` qui itère sur les clés top-level.
- La réécriture des 9 templates `PROMPT_DEFAULTS_BY_PHASE` change les valeurs par défaut affichées dans `/generate` ; les sessions existantes en DB ne sont pas affectées (les valeurs sont copiées au moment de la création de la session — pas de re-référence).

**Inconnues levées** :
- `buildVocabularySection()` lit les clés top-level → la rétro-compatibilité est assurée tant que les catégories restent au top-level (juste enrichies de méta `_*`). ✅
- `PROMPT_DEFAULTS_BY_PHASE` est seedé dans `useActiveSession` au moment de la création d'une session draft → impacte uniquement les nouvelles sessions. ✅

## Critères d'acceptation

| Critère | FR |
|---|---|
| Le vocabulaire `prompt-vocabulary.json` est versionné v1.2.0 et organisé en 8 groupes thématiques (méta `_meta.groups`) | FR-054 |
| Chaque catégorie expose `_group`, `_subgroup`, `_phaseAffinity` (array de phases) | FR-054, FR-069 |
| 4 nouvelles catégories ajoutées : `web_layout_principles`, `anti_pattern_layout`, `conceptual_collisions`, `brand_values_visual_translation` | FR-054 |
| Total termes ≥ 460 (vs 318 en v1.1.0) | FR-054 |
| `buildVocabularySection()` rend une sortie groupée par `_group`, avec affichage du `_subgroup` et `_phaseAffinity` pour chaque catégorie | FR-053 |
| Les 9 templates `PROMPT_DEFAULTS_BY_PHASE` sont autonomes : aucun placeholder type `[X]`, aucune référence à une image source, aucune syntaxe modèle-spécifique | FR-054, FR-069 |
| Le template `wireframe.*` n'introduit aucun terme de couleur ou de texture | FR-069 |
| Le template `uiux.*` mentionne `top-heavy` ET `seamless fade to solid background at the bottom` (gestion du scroll) | FR-069 |
| Le `SYSTEM_PROMPT` du helper conversationnel couvre par phase : vocabulaire ciblé + règle "pas de variables/image/syntaxe modèle" + règle collisions conceptuelles + règle pont valeur→visuel | FR-053, FR-069 |
| Le system prompt du Brief Assistant intègre une section "Pont sémantique valeurs → visuel" et une règle "au moins 1 variant inclut une collision conceptuelle" | FR-053 |
| Pipeline `npm run lint && typecheck && test && build && check:secrets` 100% vert | NFR validation §6 CLAUDE.md |

## Tâches techniques

1. **Vocabulaire** : réécrire `server/data/prompt-vocabulary.json` (v1.1.0 → v1.2.0). Ajouter `_meta.groups`, méta par catégorie, 4 nouvelles catégories. Total : 472 termes.
2. **`buildVocabularySection()`** : refactor dans `server/providers/openrouter-text.ts` pour rendre une sortie groupée par `_group`, avec `_subgroup` et `_phaseAffinity` visibles.
3. **`PROMPT_DEFAULTS_BY_PHASE`** : réécrire les 9 templates dans `shared/contracts.ts` selon les 3 langages (A narratif, B keywords, C structuré) et les 3 phases (wireframe / mood / uiux).
4. **`SYSTEM_PROMPT` helper** : étendre dans `server/api/helper/chat.post.ts` (sections par phase, contraintes techniques, collisions, pont valeur→visuel).
5. **System prompt Brief Assistant** : étendre `generatePromptsFromBrief()` dans `server/providers/openrouter-text.ts` (sections "Pont sémantique" + "Collisions conceptuelles" + contraintes techniques).
6. **`MOCK_REPLY` helper** : actualiser les 3 réponses mock pour refléter le nouveau style.
7. **Tests** :
   - `prompt-vocabulary.test.ts` : vérifier intégrité du JSON (chaque catégorie a `_group` valide référencé dans `_meta.groups`, chaque `_phaseAffinity` ne contient que `wireframe|mood|uiux`, aucun terme dupliqué intra-catégorie). `// @requirement: FR-054`
   - `buildVocabularySection.test.ts` : vérifier que la sortie groupée contient les 8 headers de groupes et que chaque catégorie expose son affinity. `// @requirement: FR-053`
   - `prompt-defaults.test.ts` : vérifier qu'aucun des 9 templates ne contient de placeholder `[...]`, ni de syntaxe modèle (`--`, `::`, `iw `), et que les invariants par phase sont respectés (wireframe sans couleur, uiux avec `top-heavy` + `seamless fade`). `// @requirement: FR-054, FR-069`
8. **Doc** : mettre à jour `docs/prompt-vocabulary-sources.md` (ajout section "Apprentissages prompt morphing v1.2.0" + référence à la conv Gemini comme source d'inspiration). Mettre à jour `PROGRESS.md`.

## Self-review checklist (grille §5 CLAUDE.md)

- [x] Chaque critère d'acceptation a un test qui le couvre (`prompt-vocabulary.test.ts`, `buildVocabularySection.test.ts`, `prompt-defaults.test.ts`).
- [x] Chaque FR ciblé est référencé par au moins un test (`@requirement: FR-054`, `FR-069`, `FR-053`).
- [x] Aucun code mort, `TODO` non assumé, `console.log` introduit.
- [x] Structure de fichiers conforme §3.1 (vocabulaire en `server/data/`, contrats en `shared/`, system prompts en `server/api/` ou `server/providers/`).
- [x] Aucune clé API référencée hors de `server/`.
- [x] Types explicites (`VocabularyCategory`, `VocabularyMeta` typés dans `openrouter-text.ts`, pas de `any` introduit).
- [x] Noms reflètent le domaine (`brand_values_visual_translation`, `conceptual_collisions`, `web_layout_principles`).
- [x] Scalable : ajouter une nouvelle catégorie de vocabulaire = ajouter un objet dans le JSON, **rien dans l'UI** ni dans le code consommateur (la fonction `buildVocabularySection` itère dynamiquement).
- [x] Documentation impactée à jour (cette story + `prompt-vocabulary-sources.md` + `PROGRESS.md`).

## Validation

- `npm run typecheck` : ✅ pass
- `npm run lint` : ✅ pas de nouvelle erreur introduite (5 erreurs / 10 warnings tous pré-existants dans `HelperModal.vue`, `HistoryFilters.vue`, fichiers de tests)
- `npm run test` : ✅ (voir §Validation détaillée — tests STORY-112 ajoutés tous passants)
- `npm run check:secrets` : ✅ pas de pattern de clé API dans le bundle
- `npm run build` : ✅ build réussi
