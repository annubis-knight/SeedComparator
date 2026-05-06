---
doc: CLAUDE
version: 1.1.0
last_updated: 2026-04-28
synced_with: [docs/PRD.md, docs/REQUIREMENTS.md, docs/EPICS.md, docs/ARCHITECTURE.md, PROGRESS.md]
---

# CLAUDE.md — Méthodologie de travail

Ce document définit **comment on travaille** sur SeedComparator : la boucle, les règles de codage, de test, de revue, de documentation.

> Pour comprendre **ce que fait** le projet, voir `docs/PRD.md`. Pour **comment il est construit**, voir `docs/ARCHITECTURE.md`. Pour les **exigences** qui pilotent le code, voir `docs/REQUIREMENTS.md`.

---

## 1. Documents de référence

Tous les documents canoniques portent un **front-matter YAML** (`doc`, `version`, `last_updated`, `synced_with`). Ils doivent rester synchronisés.

| Fichier | Rôle | Quand le mettre à jour |
|---|---|---|
| `CLAUDE.md` (ce doc) | **Règles de travail** : boucle, TDD, conventions, validation, doc | Si la méthodologie change |
| `docs/PRD.md` | **Vision produit** : périmètre, user stories produit, succès | Si le scope ou l'objectif produit change |
| `docs/REQUIREMENTS.md` | **Source de vérité des exigences** (FR / NFR numérotées) | À chaque ajout/modif d'exigence — précède toute story |
| `docs/EPICS.md` | **Index** des épiques (lien vers chaque `_epic.md`) | À chaque ajout/changement de statut d'épique |
| `docs/ARCHITECTURE.md` | **Construction du projet** : stack, schéma DB, adapters, structure de fichiers, UI | Si la stack, le schéma de données ou un pattern change |
| `docs/epics/EPIC-X-slug/_epic.md` | **Front-matter de suivi d'un épique** + objectif, exigences couvertes, liste de ses stories, critère de fin | À chaque transition de statut d'une story de l'épique |
| `docs/epics/EPIC-X-slug/STORY-XXX-*.md` | **Une story = un incrément livrable**, traçable à des FR/NFR, vit dans le dossier de son épique parent | À chaque début et fin de story (front-matter `status`) |
| `PROGRESS.md` | **Tableau de bord** : index synchronisé de toutes les stories + % global | À chaque transition d'état d'une story |
| `README.md` | **Quickstart** pour relancer le projet | Si setup ou commandes changent |
| `gemini-conversation-*.md` | Archives brainstorming initial — **lecture seule** | Jamais |

> **Règle de synchronisation** : si tu modifies un fichier listé dans le `synced_with` d'un autre, tu **dois** vérifier la cohérence de cet autre.

---

## 2. La boucle de travail (requirement-driven + TDD)

Le projet est piloté par les **exigences**, pas par le code. Les exigences existent **avant** les tests, qui existent **avant** le code de production.

Chaque incrément (= une story) suit **strictement** ces 6 phases :

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1. ANALYSE          → identifier le problème, relire FR/NFR    │
│         │              concernés, lister les inconnues          │
│         ▼                                                       │
│  2. PLAN + STORY     → écrire/maj la story (docs/stories/),     │
│         │              tracer FR/NFR ↔ critères d'acceptation,  │
│         │              décomposer en tâches techniques          │
│         ▼                                                       │
│  3. DEV (TDD)        → Red : écrire le test qui prouve le FR    │
│         │              Green : code minimal qui passe           │
│         │              Refactor : nettoyer sans casser          │
│         ▼                                                       │
│  4. SELF-REVIEW      → auto-critique structurée (voir §5)       │
│         │              corriger AVANT de passer à la validation │
│         ▼                                                       │
│  5. VALIDATION       → npm run lint, typecheck, test, build,    │
│         │              tests fonctionnels + non-fonctionnels    │
│         ▼              (voir §6)                                │
│  6. MAJ DOC          → bumper front-matter de la story,         │
│                        actualiser PROGRESS.md, README, et tout  │
│                        doc impacté par les changements          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                          ↓ retour à 1 pour la story suivante
```

**Aucune phase ne se saute.** Si une phase révèle un problème (ex: validation rouge), on **revient à la phase nécessaire** (souvent 1 ou 3), on ne maquille pas le rouge.

### 2.1 Phase 1 — Analyse
- Relire les FR/NFR ciblés dans `docs/REQUIREMENTS.md`.
- Lister les inconnues techniques (API à explorer, bibliothèques, schémas DB).
- Identifier les **risques** spécifiques (perf, sécurité, rétrocompatibilité données).
- Sortie : court paragraphe d'analyse en tête de la story.

### 2.2 Phase 2 — Plan + Story
- Créer/maj `docs/epics/EPIC-X-slug/STORY-XXX-slug.md` avec front-matter complet (la story vit **dans le dossier de son épique parent**).
- Tracer chaque critère d'acceptation à un ou plusieurs FR/NFR (`requirements: [FR-005, FR-012, NFR-002]`).
- Décomposer en **tâches techniques** ordonnées (chacune = un cycle Red/Green/Refactor).
- Mettre à jour `_epic.md` (incrémenter `stories_in_progress`, recalculer `progress`).
- Mettre à jour `PROGRESS.md` (story passe en `in_progress`).

### 2.3 Phase 3 — Dev (TDD strict pour le critique, pragmatique sinon)

#### TDD strict (Red → Green → Refactor)
- **Adapters providers** (`server/providers/*.ts`) : mock `fetch`, vérifier la traduction `GenerateRequest` → call HTTP → `GenerateResult`. Cas erreur (4xx, 5xx, timeout, abort) couverts.
- **`costEstimator`** : tous les modèles, tous les ratios, tous les seuils.
- **`batchOrchestrator`** : concurrence limitée, propagation `AbortSignal`, ordre des résultats, partial failure.
- **Server routes** (`server/api/*.ts`) : validation Zod, codes HTTP, contrats de réponse.

#### Tests conséquents UI + user flow
- **Composants Vue critiques** (`GenerationGrid`, `GenerationCard`, `PromptInputs`, `CostMeter`, `ModelSelector`).
- **E2E Playwright** sur le user flow principal complet.

#### Pragmatique
- Composants UI purs (Button, Card, Modal…) : smoke test de rendu.
- Pages Nuxt simples qui ne font qu'assembler : couverts par l'E2E.

#### Stack de test
- **Vitest** : unit + integration.
- **@vue/test-utils** : composants Vue isolés.
- **@nuxt/test-utils** : tests d'intégration des server routes Nitro.
- **Playwright** : E2E.

#### Discipline
- **Aucun commit sans test** sur la zone touchée si elle relève du TDD strict ou des tests UI.
- **Coverage** : pas de seuil bloquant arbitraire, mais `costEstimator` et `batchOrchestrator` doivent tendre vers 100 %.
- Chaque test porte un commentaire `// @requirement: FR-XXX` pour la traçabilité.

---

## 3. Conventions de code

- **TypeScript strict** partout (`"strict": true`, `noUncheckedIndexedAccess`, `noImplicitOverride`).
- **Validation runtime** des inputs API avec **Zod** (un schéma par endpoint, dans `shared/contracts.ts`).
- **Pas de clé API dans le frontend**. Toute requête provider passe par les server routes Nitro qui lisent les clés via `safeStorage`.
- **Composables Vue** pour l'état UI (`useGenerationSession`, `useModels`, `useCostMeter`).
- **Pinia** uniquement si l'état devient transverse à plusieurs vues — sinon composables.
- **Tailwind** pour le styling. Tokens design system centralisés dans `app/assets/css/tokens.css`.
- **Lint/format** : ESLint + Prettier (config Nuxt 3 par défaut), exécutés en pre-commit (Husky + lint-staged).
- **Pas de commentaires explicatifs sur le "quoi"**, uniquement sur le "pourquoi" non-évident.

### 3.1 Règles de structure de fichiers
- **Une responsabilité par fichier**. Si un fichier dépasse ~200 lignes, le découper.
- **Pas de dossier `utils/` fourre-tout**. Si une fonction n'a pas de place évidente, c'est probablement qu'elle appartient à un service métier.
- **Les composants Vue ne font pas d'appel `$fetch` directement** — ils passent par un composable. Les composables sont les seuls à parler aux server routes.
- **Les server routes ne contiennent pas de logique métier** — elles parsent l'input (Zod), délèguent à un service, formattent la réponse.
- **Aucun import croisé** : `app/` ne doit jamais importer depuis `server/` (sauf via `shared/` pour les types).

> Voir `docs/ARCHITECTURE.md` §8 pour l'arborescence détaillée.

---

## 4. Anti-patterns à éviter

- ❌ Injecter automatiquement des mots-clés dans les prompts ("hero", "16:9", "stunning"…).
- ❌ "Réécrire" un prompt entre modèles automatiquement (la divergence inter-modèle est le sujet de l'app).
- ❌ Sauvegarder les fichiers image automatiquement.
- ❌ Retry automatique sur erreur 4xx/5xx (coût caché).
- ❌ Exposer une clé API dans le bundle frontend.
- ❌ Mocker les providers en dev avec des images fixes sans badge clair "MOCK" sur l'UI.
- ❌ Concurrence illimitée sur le batch.
- ❌ Stocker les clés API dans la DB Postgres.
- ❌ Sauter une phase de la boucle de travail.
- ❌ Implémenter sans test sur les zones marquées TDD strict (§2.3).
- ❌ Modifier un document canonique sans bumper son `version` et son `last_updated`.

---

## 5. Phase 4 — Self-Review (auto-critique structurée)

À faire **avant** la validation. Passer la grille suivante :

- [ ] Chaque critère d'acceptation de la story a-t-il un test qui le couvre ?
- [ ] Chaque FR/NFR ciblé est-il référencé par au moins un test (`@requirement: FR-XXX`) ?
- [ ] Y a-t-il du code mort, des `TODO` non assumés, des `console.log` ?
- [ ] La structure de fichiers respecte-t-elle §3.1 ?
- [ ] Aucune clé API n'est référencée hors de `server/` ?
- [ ] Les types sont-ils explicites (pas de `any`) ?
- [ ] Les noms (variables, fonctions, fichiers) reflètent-ils le **domaine** (`Generation`, `Model`, `Session`) plutôt que la technique (`Item`, `Data`) ?
- [ ] Le code est-il **scalable** ? Ajouter un nouveau modèle = ajouter une ligne en DB + (au pire) un adapter, **rien dans l'UI** ?
- [ ] La documentation impactée est-elle à jour ?

Si **n'importe quelle case est rouge → corriger avant validation**.

---

## 6. Phase 5 — Validation

Trois familles de checks, **toutes obligatoires vertes** avant de passer à la phase 6.

### 6.1 Statique
```bash
npm run lint        # ESLint + Prettier
npm run typecheck   # tsc --noEmit
```

### 6.2 Tests fonctionnels (= FR)
```bash
npm run test            # Vitest unit + integration
npm run test:e2e        # Playwright sur le user flow
```
Chaque test porte un commentaire `// @requirement: FR-XXX`. Un script CI peut générer la **matrice de traçabilité** FR ↔ tests.

### 6.3 Tests non-fonctionnels (= NFR — projet local, minimaliste)

| Catégorie | Vérification |
|---|---|
| **Sécurité** | `npm run check:secrets` : grep le bundle frontend (`.output/public/`) à la recherche de patterns de clés API connus. Doit retourner 0 match. |
| **Performance** | Test E2E qui mesure : première image visible < 10 s sur un batch standard. |
| **Build** | `npm run build` doit terminer sans erreur ni warning bloquant. |

```bash
npm run check:secrets
npm run test:perf
npm run build
```

---

## 7. Phase 6 — MAJ documentation

À chaque fin de story :
1. Bumper `version` et `last_updated` du front-matter de la story.
2. Mettre la story en `status: done` dans son front-matter.
3. Mettre à jour le `_epic.md` parent (incrémenter `stories_done`, recalculer `progress`). Si toutes les stories sont `done`, passer l'épique en `status: done`.
4. Mettre à jour `PROGRESS.md` (déplacer la ligne dans la section "Done", actualiser le pourcentage V1 global et l'avancement de l'épique).
5. Mettre à jour `docs/EPICS.md` (index) si le statut de l'épique change.
6. Si une FR/NFR a évolué → bumper `docs/REQUIREMENTS.md` + actualiser sa matrice de traçabilité (test associé + statut `verified`).
7. Si une décision archi a changé → bumper `docs/ARCHITECTURE.md`.
8. Si une fonctionnalité utilisateur a changé → bumper `docs/PRD.md` + `README.md`.
9. Si la méthodologie a évolué → bumper `CLAUDE.md` (ce document).
10. Vérifier la cohérence des listes `synced_with` dans tous les front-matters touchés.

---

## 8. Contexte de travail

- **Plateforme dev** : Windows 11, shell `bash` (syntaxe Unix dans les scripts — `/dev/null`, slashs avant).
- **Date de référence** : avril 2026. Tarifs et noms de modèles à re-vérifier avant tout choix structurant.
- **Méthodologie** : libre. `_bmad/` est dispo si on veut basculer en BMAD plus tard.
- **Auto-critique > revue humaine** : la phase 4 (self-review) est faite par l'agent lui-même avant validation, l'utilisateur n'est pas un reviewer.
