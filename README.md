# SeedComparator

> Comparez d'un clic les rendus de **15 modèles d'IA générative d'image** sur les mêmes prompts. Application desktop locale (Electron + Nuxt 4 + Vue 3 + PostgreSQL).

Les IA d'image ont chacune leurs forces, leurs styles, leurs biais. Tester un prompt sur Flux, GPT Image, DALL·E, Imagen et Gemini séparément prend 10 minutes et 4 onglets. SeedComparator fait tourner le même prompt sur tous en parallèle, affiche les résultats côte à côte, et conserve l'historique localement pour itérer sans rien perdre.

---

## Pourquoi

- **Comparer, vraiment.** Même prompt, mêmes paramètres normalisés, lancement simultané. Tu vois en un coup d'œil quel modèle convient le mieux à ton intention.
- **Inspirer, pas remplacer.** Un assistant LLM intégré transforme un brief structuré (palette, mood, typo, URLs de référence) en 3 variantes de prompt. Tu pars d'une page blanche, tu repars avec 3 directions à explorer.
- **Mutualiser les paramètres.** « Qualité », « Format de sortie », « Filtrage »… ces concepts existent chez plusieurs providers sous des noms différents. SeedComparator les unifie sous une **échelle homogène** qui pilote intelligemment chaque API en arrière-plan ([détails](docs/epics/EPIC-18-parametres-avances-par-modele/_epic.md)).
- **Économiser.** Trois modes intégrés : `mock` (placeholders), `mock-real` (fixtures rejouées, gratuit), `live` (vrais appels payants). Tu développes et testes l'UI sans dépenser un centime.

## Modèles supportés

| Provider | Modèles |
|---|---|
| **OpenAI** | DALL·E 2, DALL·E 3, GPT Image 1, GPT Image 1 Mini, GPT Image 1.5, GPT Image 2 |
| **Google AI Studio** | Imagen 4 Fast, Imagen 4, Imagen 4 Ultra, Gemini 2.5 Flash Image, Gemini 3.1 Flash Image, Gemini 3 Pro Image |
| **Fal.ai** | Flux 1.1 Schnell, Flux 1.1 Pro, Stable Diffusion 3.5 Large |

Ajouter un modèle = une ligne dans la base de données. Ajouter un provider = un fichier dans `server/providers/`.

## Aperçu des fonctionnalités

- **Génération en batch** avec concurrence limitée et bouton Stop global.
- **Vue Grid + Vue Flex** (modèles en colonnes / prompts en lignes) pour la comparaison côte à côte.
- **Lightbox** avec zoom et comparateur 2 images.
- **Phasage du workflow** Wireframe → Mood → UI/UX (9 prompts par session, 3 par phase).
- **Brief Assistant LLM** : crawler de pages de référence + extraction de palette + génération de 3 prompts.
- **Paramètres avancés mutualisés** : un seul contrôle pilote tous les modèles concernés (qualité, créativité, effort de calcul, filtrage…).
- **Seed verrouillable** par génération pour itérer sur une image qu'on aime.
- **Compteur de coût** en temps réel, modal de confirmation au-delà d'un seuil configurable.
- **Galerie historique** persistée en PostgreSQL, filtrable par phase / modèle / favoris.
- **Sauvegarde manuelle** : les images ne touchent le disque que sur clic explicite (`manifest.json` exporté avec elles).
- **Stockage chiffré des clés API** via `safeStorage` Electron (DPAPI / Keychain / libsecret).
- **Aucune clé API ne quitte le main process Electron** — vérification automatique du bundle frontend (`npm run check:secrets`).

## Stack

- **Frontend** : Nuxt 4 + Vue 3 + Tailwind 3, design system glassmorphique sombre.
- **Backend** : Nitro server routes (intégrées à Nuxt).
- **Desktop** : Electron 42 via electron-vite.
- **Base de données** : PostgreSQL local + Prisma.
- **Tests** : Vitest (348 tests unit + integration).
- **Validation** : Zod stricte sur tous les endpoints.

## Quickstart

### Pré-requis

- Node 22+ (testé sur Node 24)
- PostgreSQL local sur `localhost:5432`

### Installation

```bash
git clone https://github.com/annubis-knight/SeedComparator.git
cd SeedComparator
npm install
cp .env.example .env.local        # ajuste DATABASE_URL si besoin
npx prisma migrate deploy
npm run db:seed
```

### Lancer en dev

```bash
npm run dev
```

- Nuxt sur `http://127.0.0.1:3300`
- Electron ouvre automatiquement la fenêtre dessus
- Mode `mock` activé par défaut, aucune clé API requise

### Tester

```bash
npm run test              # 348 tests unit (Vitest)
npm run test:integration  # tests API live
npm run typecheck
npm run lint
```

### Build production

```bash
npm run build
npm run check:secrets     # vérifie qu'aucune clé API ne fuit dans le bundle
```

`npm run kill:ports` libère les ports `3300` (Nuxt) et `5300` (Electron) si une instance précédente est restée bloquée.

## Modes provider

| Mode | Comportement | Coût |
|---|---|---|
| `mock` | PNG placeholder valide, latence aléatoire | Gratuit, aucune clé |
| `mock-real` | Rejoue les fixtures capturées | Gratuit, fixtures pré-enregistrées |
| `live` | Appels API réels | Payant à chaque génération |

Configurable au boot (`.env` → `PROVIDER_MODE=live`) ou runtime via Réglages (persisté en DB).

## Capturer une fixture provider (CLI)

Les scripts dans `scripts/probe-providers/` appellent les vrais providers pour capturer des réponses figées rejouables en `mock-real`. **Ils dépensent du vrai argent** et demandent confirmation avant chaque exécution.

```bash
npm run probe:dry-run                            # voir le plan sans rien appeler
npm run probe:openai -- --only=dall-e-2          # un seul modèle
npm run probe:fal                                # tout un provider
npm run probe:all -- --max-cost=0.10             # tout, plafonné à 10 cents
npm run probe:openai -- --only=dall-e-2 --overwrite  # re-capturer
```

Les clés API sont chargées automatiquement depuis `.env` (`OPENAI_API_KEY`, `FAL_API_KEY`, `GOOGLE_AI_API_KEY`, `OPENROUTER_API_KEY`).

## Documentation

| Document | Rôle |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Vision produit, périmètre, user stories |
| [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) | Source de vérité des exigences (FR / NFR), traçabilité avec les tests |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, modèle de données, pattern adapter, structure des fichiers |
| [`docs/EPICS.md`](docs/EPICS.md) | Index des épiques |
| [`docs/epics/`](docs/epics/) | Détail de chaque épique + ses stories |
| [`PROGRESS.md`](PROGRESS.md) | Tableau de bord (état des stories, pipeline) |
| [`.claude/CLAUDE.md`](.claude/CLAUDE.md) | Méthodologie de travail (boucle requirement-driven + TDD) |

## Architecture en 30 secondes

```
┌─ Electron main ─────────────────────────────────────┐
│  safeStorage (clés API chiffrées DPAPI/Keychain)    │
│  BrowserWindow → Nuxt local                         │
└──────────────────┬──────────────────────────────────┘
                   │
┌─ Nuxt frontend (renderer) ──────────────────────────┐
│  app/components, composables, pages                 │
│  Tailwind glassmorphique, dark slate                │
└──────────────────┬──────────────────────────────────┘
                   │  $fetch('/api/...')
┌─ Nitro server routes ───────────────────────────────┐
│  /api/generate (SSE batch)  /api/estimate           │
│  /api/sessions/[id]         /api/models             │
│                                                     │
│  Pattern Adapter (server/providers/)                │
│  ├─ openai.ts   ├─ fal.ts   ├─ google-ai.ts         │
│  ├─ paramTraits.ts (catalogue mutualisé)            │
│  └─ paramApiMapping.ts (key canonique → API native) │
│                                                     │
│  Services : batchOrchestrator (concurrence + abort) │
│             costEstimator (réactif aux paramètres)  │
└──────────────────┬──────────────────────────────────┘
                   │  Prisma
┌─ PostgreSQL ────────────────────────────────────────┐
│  Provider · Model · Session · Generation · Setting  │
└─────────────────────────────────────────────────────┘
```

Détails dans [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Statut

V1 livré (90 % des stories), 348 tests verts, build vert, secrets bundle vert. Voir [`PROGRESS.md`](PROGRESS.md) pour le détail.

## Licence

Projet personnel non distribué publiquement. Code source disponible pour consultation.

— Arnaud Gutierrez
