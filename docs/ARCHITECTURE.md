---
doc: ARCHITECTURE
version: 0.3.1
last_updated: 2026-05-06
synced_with: [../CLAUDE.md, PRD.md, REQUIREMENTS.md, EPICS.md, ../PROGRESS.md]
---

# Architecture — SeedComparator

Décrit **comment le projet est construit** : stack, modèle de données, pattern adapter, providers, structure de fichiers, règles UI. La méthodologie de travail (boucle, TDD, validation) est dans `CLAUDE.md`.

---

## 1. Stack technique

- **Frontend** : **Nuxt 4.4.x** + Vue 3 + Tailwind 3, embarqué dans une fenêtre Electron. Thème sombre par défaut, glassmorphisme. Tokens centralisés dans `app/assets/css/tokens.css`.
- **Backend** : Nitro server routes (`server/api/*.ts`). Endpoints HTTP appelés depuis l'UI via `$fetch('/api/...')`.
- **Electron** : **Electron 42** lancé via **electron-vite** en dev. Ouvre une `BrowserWindow` sur le serveur Nuxt local. Gère aussi `safeStorage`, dialogs natifs, et lance le main process Node.
- **Base de données** : **PostgreSQL** local (déjà installé sur la machine) via **Prisma**. La DB `seedcomparator` est créée par la première migration. Schéma versionné dans `prisma/migrations/`.
- **Stockage clés API** : `safeStorage` Electron (DPAPI/Keychain/libsecret). Les clés ne transitent jamais par le frontend.
- **Tests** : Vitest (unit + integration via `@nuxt/test-utils`), `@vue/test-utils` pour les composants. **Pas de Playwright en V1** (projet local, mono-user, scope volontairement réduit).
- **Node** : 22+ requis. Testé sur Node 24.
- **Packaging** : pas de build de distribution V1 (usage local).

---

## 2. Modèle de données (PostgreSQL via Prisma)

Schéma minimal — à étendre selon besoins :

```prisma
model Provider {
  id           String   @id           // 'openrouter', 'fal', 'openai', 'bfl', 'stability', 'gemini-direct', ...
  displayName  String
  apiKeyRef    String?  // identifiant logique vers safeStorage (la clé n'est PAS en DB)
  models       Model[]
}

model Model {
  id              String  @id        // 'gemini-3.1-flash', 'flux-1.1-pro', 'sd-3.5-large', 'gpt-image-1.5', ...
  providerId      String
  provider        Provider @relation(fields: [providerId], references: [id])
  displayName     String
  supportsSeed    Boolean
  supportsEditing Boolean             // in-painting / image-to-image (sprint futur)
  pricePerImage   Decimal             // USD, indicatif
  enabled         Boolean  @default(true)
}

model Session {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  prompts     String[]                // les 1 à 3 variantes
  notes       String?
  generations Generation[]
  saved       Boolean  @default(false) // true uniquement si l'utilisateur a sauvegardé
}

model Generation {
  id         String   @id @default(cuid())
  sessionId  String
  session    Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  promptIdx  Int                       // 0,1,2 — laquelle des 3 variantes
  modelId    String
  prompt     String                    // copie exacte du prompt envoyé
  seed       BigInt?
  ratio      String?
  imagePath  String?                   // null tant que non sauvegardée (image en cache mémoire/disque temporaire)
  costUsd    Decimal
  rawMeta    Json                      // réponse brute du provider, utile pour vue approfondie
  createdAt  DateTime @default(now())
}
```

**Règle clé** : les **sessions et générations** sont persistées dès la création (utile pour le compteur de coût cumulé et l'historique). Les **fichiers image**, eux, ne sont écrits sur disque **que si l'utilisateur sauvegarde** (`Session.saved = true` ou flag par génération). Sinon, image gardée en mémoire/cache temporaire et purgée à la fermeture.

---

## 3. Providers & modèles (état avril 2026)

L'écosystème 2026 se partage en **providers directs** et **agrégateurs**. Pour ce projet, on privilégie **les agrégateurs** (une seule clé donne accès à plein de modèles, pay-as-you-go) et on garde **quelques accès directs** quand ils apportent un avantage.

### 3.1 Agrégateurs (priorité MVP)

| Agrégateur | Couverture notable | Pourquoi |
|---|---|---|
| **OpenRouter** | Toute la gamme Gemini (Nano Banana 2 Flash-Lite / Flash / Pro), GPT Image, Flux, etc. | Une seule clé, tarif aligné API direct, pay-as-you-go |
| **Fal.ai** | Flux 1.1 Pro / Schnell, SD 3.5, **outils d'édition** (in-painting, ControlNet, IP-Adapter, LoRA), image-to-image | Indispensable pour l'édition ciblée et la cohérence inter-itérations (sprint futur) |
| **Replicate** | Méta-provider (Flux, SD, modèles open-source variés) | Backup / accès à modèles communautaires |

### 3.2 Modèles ciblés V1

Liste indicative, à ajuster en config (table `Model`) sans toucher au code :

| Modèle | Source V1 | Tarif/image (~) | Seed | Note |
|---|---|---|---|---|
| **Gemini 3.1 Flash-Lite** (Nano Banana 2 Lite) | OpenRouter | ~0,005 € | ❌ | Quasi gratuit, parfait pour brouillons |
| **Gemini 3.1 Flash** (Nano Banana 2) | OpenRouter | ~0,03 € | ❌ | Rapide, parfois "kitsch / lisse" |
| **Gemini 3.1 Pro** (Nano Banana Pro) | OpenRouter | ~0,13 € | ❌ | Texte, 4K |
| **GPT Image 1.5** | OpenRouter | ~0,03 € | ❌ | Politique stricte, langage naturel |
| **Flux 1.1 Pro** | Fal.ai | ~0,04 € | ✅ | Réalisme top, prompt JSON structuré |
| **Flux 1.1 Schnell** | Fal.ai | ~0,01 € | ✅ | Brouillon rapide |
| **SD 3.5 Large** | Fal.ai | ~0,03 € | ✅ | Roi de l'in-painting (sprint futur) |

> **Midjourney** : exclu — pas d'API publique hobbyiste en 2026 (restreint enterprise).

> **Limite de transférabilité du prompt** : un prompt "optimisé Flash" ne donne **pas** le même rendu sur "Pro" ou sur Flux. Le but de l'app est précisément de **rendre cette différence visible**, pas de la masquer. Donc : pas de "prompt rewriting" automatique entre modèles.

---

## 4. Pattern Adapter

Pattern **Adapter** pour isoler chaque source (agrégateur OU provider direct) derrière une interface unique. La granularité est le **modèle**, pas le provider — un agrégateur expose plusieurs modèles.

```ts
// server/providers/types.ts
interface ImageGenerator {
  modelId: string;                 // 'gemini-3.1-flash', 'flux-1.1-pro', ...
  source: string;                  // 'openrouter', 'fal', ...
  capabilities: {
    seed: boolean;
    editing: boolean;              // sprint futur
    imageToImage: boolean;         // sprint futur
    maxRatio?: string;
  };
  estimateCost(req: GenerateRequest): number;        // USD
  generate(req: GenerateRequest, signal: AbortSignal): Promise<GenerateResult>;
}

interface GenerateRequest {
  prompt: string;
  seed?: number | null;
  ratio?: string;
}

interface GenerateResult {
  imageBuffer: Buffer;
  modelId: string;
  source: string;
  seed: number | null;
  costUsd: number;
  rawResponse: unknown;
}
```

Une implémentation par source dans `server/providers/` (`openrouter.ts`, `fal.ts`). La server route `server/api/generate.post.ts` orchestre le batch via `batchOrchestrator` avec **concurrence limitée** (ex: `p-limit` à 3) et `AbortController` pour le Stop global.

**Ajouter un modèle V1** = ajouter une ligne en DB (`Model`). **Ajouter une source** = créer un fichier dans `server/providers/` + l'enregistrer dans `registry.ts`. **L'UI ne change pas.**

### 4.1 Paramètres avancés mutualisés (EPIC-18)

Au-dessus du contrat commun (`prompt`, `ratio`), chaque modèle expose un sous-ensemble de **traits de paramètres** déclarés dans une source de vérité unique :

- **`server/providers/paramTraits.ts`** — catalogue de traits réutilisables. Chaque trait porte : key canonique, label FR, tooltip pédagogique, `kind` (slider, segmented, toggle…), schéma Zod, défaut, `scope`, et optionnellement `affectsCost`.
- **`server/providers/modelParamProfiles.ts`** — composition par modèle (liste de traits + overrides locaux : default, range plus restreint).
- **`server/providers/paramResolver.ts`** — résolution (traits ⊕ overrides) + validation Zod stricte par modèle × scope.
- **`server/providers/paramApiMapping.ts`** — traduction `traitKey → nom d'API` par source (Fal `guidance_scale`, OpenAI `quality`, Imagen `parameters.personGeneration` nested…). Les adapters n'envoient que les traits déclarés dans le profil — pas de fuite.

**Distinction `scope`** :

- `scope: 'global'` — valeur partagée par session pour ce modèle, exposée dans le panneau "Configuration de l'image" via une **liste plate totalement factorisée** : pour chaque trait exposé par au moins un modèle sélectionné, un seul contrôle est rendu. Deux types : (a) **canoniques** (`shared/canonicalParams.ts`) — échelles homogènes qui démultiplexent vers les valeurs natives quand la sémantique diverge entre modèles ; (b) **factorisés directs** (`FactorizedTraitRow`) — rendu direct + propagation simultanée à tous les modèles concernés quand la signature est identique partout.
- `scope: 'per-generation'` — valeur intimement liée à une instance précise (modèle × prompt × run). Cas type : `seed` (la seed 42 sur Flux ≠ seed 42 sur SD ; verrouiller la seed d'une image aimée ne doit pas contaminer les autres modèles). Vit sur `GenerationCard` (badge cliquable + 🔒) et dans la vue détail.

L'objet `params` final (defaults ⊕ overrides global ⊕ overrides per-gen) est figé en DB sur `Generation.params` (Json nullable) pour rejouabilité.

---

## 5. UI — règles fondatrices

### 5.1 Vue principale (Exploration)

- **Zone de configuration (haut)** : 3 champs prompt (A/B/C, optionnels — un seul actif suffit), checkboxes **par modèle** (groupées par source), réglage ratio global, bouton "Générer".
- **Zone d'affichage (centre)** : toggle **Grid ↔ Flex**.
  - **Grid** : wrap libre, vue d'ensemble rapide.
  - **Flex** : colonnes = modèles, lignes = prompts.
- **Carte image** : image + nom du modèle + seed (ou "—") + coût + bouton "Détails" + bouton "Sauvegarder".
- **Compteur de coût** affiché en permanence (session courante + cumul mensuel lu depuis la DB).

### 5.2 Vue approfondie (V1 — lecture seule)

Ouverte au clic "Détails". Affiche :
- prompt exact, seed, modèle, paramètres, coût, réponse brute (collapsible),
- relance possible sur **ce modèle seul** avec prompt édité et seed verrouillé (si supporté).

> **Édition d'image** (in-painting, instruction, référence de style) = sprint futur, pas en V1.

### 5.3 Lightbox

Zoom plein écran + comparateur 2-images côte à côte (sélection multi avant ouverture).

### 5.4 Galerie historique

Liste des sessions persistées en DB (filtres : sauvegardée / non sauvegardée, modèle, période). Permet de retrouver un ancien rendu et de relancer une variation.

### 5.5 Design tokens

Centralisés dans `app/assets/css/tokens.css` :
- Palette sombre (background profond, surfaces translucides, accents néon discret).
- Effets glassmorphisme : `backdrop-blur`, bordures 1px subtiles, ombres douces.
- Pas de mode clair en V1.

---

## 6. Coûts — garde-fous

1. **Estimation pré-génération** : avant le clic "Générer", récap *"X générations (P prompts × Q modèles) — coût estimé : Y USD"*.
2. **Confirmation** au-delà d'un seuil configurable (défaut 0,50 USD).
3. **Compteur cumulé** persisté en DB : session + mois en cours.
4. **Mode séquentiel + Stop global** : images apparaissent une par une (skeletons), `AbortController` annule les requêtes en vol.
5. **Pas de retry automatique** sur erreur API (l'utilisateur relance manuellement).

---

## 7. Persistance

- **Métadonnées (sessions, générations, coûts) : persistées en DB systématiquement** — utile pour le compteur cumulé et la galerie historique.
- **Fichiers image : sauvegarde explicite uniquement** (clic utilisateur, par image ou par session entière). Sinon, image en cache temporaire (`app.getPath('temp')`) et purgée à la fermeture.
- Sauvegarde finale : `<dossier>/YYYY-MM-DD_HHmm_<slug>/{image_<modelId>_<promptIdx>.png, manifest.json}`. Le `manifest.json` duplique les méta DB pour rendre la session portable hors de l'app.

---

## 8. Structure du projet

L'arborescence doit rester **lisible et prévisible**. Un nouveau venu doit deviner où ajouter une feature en 30 secondes.

```
SeedComparator/
├── electron/                    # main process Electron uniquement
│   ├── main.ts                  # création BrowserWindow, lance Nuxt
│   ├── preload.ts               # API exposée au renderer (dialogs, safeStorage)
│   └── safeStorage.ts           # wrapper chiffrement clés API
├── server/                      # Nitro (backend Nuxt)
│   ├── api/                     # endpoints HTTP — un fichier = un endpoint
│   │   ├── generate.post.ts
│   │   ├── sessions.get.ts
│   │   ├── sessions/[id].get.ts
│   │   ├── models.get.ts
│   │   └── settings/keys.put.ts
│   ├── providers/               # adapters — un fichier par source
│   │   ├── types.ts             # interfaces ImageGenerator, GenerateRequest, ...
│   │   ├── openrouter.ts
│   │   ├── fal.ts
│   │   └── registry.ts          # map modelId -> ImageGenerator
│   ├── services/                # logique métier réutilisable
│   │   ├── batchOrchestrator.ts # parallélisation + AbortController
│   │   ├── costEstimator.ts
│   │   └── imageCache.ts        # cache temporaire avant sauvegarde
│   └── db/
│       ├── client.ts            # singleton Prisma
│       └── seed.ts              # seed Provider/Model
├── shared/                      # types partagés frontend ↔ backend
│   └── contracts.ts             # DTO, enums, schémas Zod
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── app/                         # Nuxt frontend (Vue)
│   ├── components/              # composants réutilisables purs
│   │   ├── ui/                  # primitives (Button, Card, Modal, ...)
│   │   ├── generation/          # GenerationGrid, GenerationCard, ...
│   │   └── session/             # PromptInputs, ModelSelector, CostMeter
│   ├── composables/             # logique d'état (useGenerationSession, ...)
│   ├── pages/                   # routes Nuxt
│   │   ├── index.vue            # exploration
│   │   ├── sessions/index.vue   # galerie historique
│   │   └── sessions/[id].vue    # vue approfondie
│   ├── assets/css/              # tailwind.css + tokens design system
│   └── app.vue
├── tests/
│   ├── unit/                    # mirror de la structure source
│   ├── integration/             # server routes (Nitro test utils)
│   └── e2e/                     # Playwright
├── docs/
│   └── stories/                 # une story par fichier (STORY-XXX-*.md)
├── docker-compose.yml           # PostgreSQL local
├── nuxt.config.ts
├── package.json
├── CLAUDE.md                    # méthodologie de travail
├── PRD.md                       # vision produit & user stories
├── REQUIREMENTS.md              # exigences FR / NFR (source de vérité)
├── EPICS.md                     # regroupement des exigences en épiques
├── PROGRESS.md                  # suivi des stories
├── ARCHITECTURE.md              # ce document
└── README.md                    # quickstart
```

---

## 9. Roadmap

### Sprint 1 — V1 (MVP)
1. Scaffolding Nuxt 3 SSR + Electron + Tailwind + tokens glassmorphisme.
2. PostgreSQL via `docker-compose` + Prisma + migrations + seed `Provider`/`Model`.
3. Gestion clés API : écran réglages + `safeStorage`.
4. Adapter pattern + **OpenRouter** (Gemini 3.1 Flash-Lite / Flash / Pro + GPT Image).
5. Adapter **Fal.ai** (Flux 1.1 Pro / Schnell, SD 3.5).
6. Server route `/api/generate` + `batchOrchestrator` (concurrence + AbortController).
7. UI grille avec toggle Grid/Flex.
8. Estimation + compteur de coût.
9. Vue approfondie (lecture seule + relance modèle unique).
10. Sauvegarde manuelle + galerie historique.

### Sprint futur — Édition d'image (post-V1)
- **In-painting** par masque (SD 3.5, Flux via Fal) : canvas HTML5 pour dessiner le masque.
- **Édition par instruction** (Gemini 3.1 Pro) : "remplace la table par du marbre".
- **Référence de style / cohérence personnage** (Flux + IP-Adapter via Fal) : upload image de référence.
- Server route `/api/edit` + `editOrchestrator`.
- Extension de la vue approfondie pour intégrer ces outils.

### Sprints ultérieurs (non engagés)
- Ajout d'autres sources directes si OpenRouter/Fal ne suffisent plus.
- Export PDF/Zip d'une session.
- Tags/favoris/notes.
- Statistiques d'usage.

---

## 10. Sources d'inspiration

- `gemini-conversation-2026-04-28-14-01-37.md` — brainstorming archi initial.
- `gemini-conversation-2026-04-28-17-35-20.md` — analyse Nano Banana, agrégateurs (OpenRouter / Fal.ai), édition d'image, transférabilité des prompts.
