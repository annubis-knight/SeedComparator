---
doc: REQUIREMENTS
version: 1.14.0
last_updated: 2026-05-06
synced_with: [../CLAUDE.md, PRD.md, EPICS.md, ARCHITECTURE.md, ../PROGRESS.md]
verified_count: 35
proposed_count: 42
---

# Exigences — SeedComparator V1

Ce document est la **source de vérité** des exigences fonctionnelles (FR) et non-fonctionnelles (NFR). Tout test, toute story et tout code de production se trace à au moins une exigence d'ici.

## Conventions

| Champ | Définition |
|---|---|
| **ID** | `FR-XXX` ou `NFR-XXX`, numéroté dans l'ordre d'apparition, jamais réutilisé |
| **Priorité** | `P0` = bloquant V1, `P1` = important V1, `P2` = nice-to-have V1, `P3` = post-V1 |
| **Source** | Origine de l'exigence (PRD §X, conv Gemini, décision technique CLAUDE §X) |
| **Vérification** | Méthode de test qui prouve la satisfaction (unit / integration / E2E / script) |
| **Statut** | `proposed` / `accepted` / `implemented` / `verified` / `deprecated` |

> Une exigence est **`verified`** uniquement après que le test correspondant ait tourné vert au moins une fois en CI.

---

## 1. Exigences fonctionnelles (FR)

### 1.1 Configuration & clés API

#### FR-001 — Saisie sécurisée des clés API
- **Priorité** : P0
- **Source** : PRD §6 US-06, CLAUDE §2
- **Énoncé** : L'utilisateur peut saisir et modifier les clés API de chaque source (OpenRouter, Fal.ai) depuis un écran de réglages. Les champs sont masqués (type password). Les clés sont stockées chiffrées via `safeStorage` Electron, jamais en clair sur disque, jamais en DB.
- **Vérification** : integration test sur l'endpoint `PUT /api/settings/keys` + test manuel de relance app (la clé persiste).
- **Statut** : proposed

#### FR-002 — Test de validité d'une clé API
- **Priorité** : P1
- **Source** : PRD §6 US-06
- **Énoncé** : Pour chaque clé saisie, un bouton "Tester la clé" déclenche un appel minimal à l'API du provider et indique si la clé est valide.
- **Vérification** : integration test avec mock réseau (succès et échec).
- **Statut** : proposed

#### FR-003 — Désactivation visuelle des modèles sans clé
- **Priorité** : P1
- **Source** : PRD §6 US-06
- **Énoncé** : Si la clé d'une source est manquante, tous les modèles rattachés à cette source apparaissent grisés/désactivés dans le sélecteur, avec un tooltip "clé API manquante".
- **Vérification** : test composant `ModelSelector` (Vue Test Utils).
- **Statut** : proposed

#### FR-004 — Choix du dossier de sauvegarde par défaut
- **Priorité** : P1
- **Source** : PRD §6 US-05
- **Énoncé** : L'utilisateur peut choisir un dossier de sauvegarde par défaut via un dialog natif Electron. Ce choix est persisté.
- **Vérification** : integration test (mock du dialog Electron) + test E2E.
- **Statut** : proposed

#### FR-005 — Configuration du seuil de confirmation de coût
- **Priorité** : P1
- **Source** : PRD §6 US-03, CLAUDE §7
- **Énoncé** : L'utilisateur peut configurer un seuil de coût (USD) au-delà duquel une modal de confirmation s'affiche avant lancement. Défaut : 0,50 USD.
- **Vérification** : unit test sur `costEstimator` + composant.
- **Statut** : proposed

### 1.2 Saisie de la session de génération

#### FR-006 — Saisie de 1 à 3 prompts
- **Priorité** : P0
- **Source** : PRD §4.1, conv Gemini 1
- **Énoncé** : L'écran principal expose 3 champs de prompt (A, B, C). Seul A est obligatoire. Les champs vides sont ignorés au lancement.
- **Vérification** : test composant `PromptInputs` + integration `POST /api/generate`.
- **Statut** : proposed

#### FR-007 — Sélection multiple de modèles
- **Priorité** : P0
- **Source** : PRD §4.1
- **Énoncé** : L'utilisateur peut cocher/décocher chaque modèle individuellement. Tous les modèles activés en DB sont cochés par défaut. Au moins un modèle doit être coché pour permettre la génération.
- **Vérification** : test composant `ModelSelector` + assertion sur état du bouton Générer.
- **Statut** : proposed

#### FR-008 — Choix du ratio
- **Priorité** : P1
- **Source** : PRD §4.1, conv Gemini 1 (réponse 2)
- **Énoncé** : L'utilisateur peut sélectionner un ratio global parmi `1:1`, `4:5`, `2:3`, `16:9`, `21:9`, ou `natif modèle`. Le ratio est transmis tel quel à chaque adapter (qui le mappe au format provider).
- **Vérification** : unit test par adapter (mapping ratio → param API).
- **Statut** : proposed

#### FR-009 — Aucune injection automatique de mots-clés
- **Priorité** : P0
- **Source** : PRD §4.2, conv Gemini 1 (réponse 2 utilisateur)
- **Énoncé** : Le prompt utilisateur est transmis aux providers **byte-pour-byte identique** à ce qu'il a saisi. L'application n'ajoute, ne retire et ne modifie **aucun** mot-clé.
- **Vérification** : unit test par adapter qui assert l'égalité stricte du prompt envoyé vs prompt utilisateur.
- **Statut** : proposed

### 1.3 Génération & batch

#### FR-010 — Estimation du coût avant lancement
- **Priorité** : P0
- **Source** : PRD §6 US-03, CLAUDE §7
- **Énoncé** : Avant chaque batch, l'app calcule et affiche le coût estimé en USD : `Σ (prix_unitaire(modèle) × nb_prompts_actifs)`. Marge ±10 %.
- **Vérification** : unit test exhaustif `costEstimator` (tous modèles, toutes combinaisons).
- **Statut** : proposed

#### FR-011 — Confirmation au-delà du seuil
- **Priorité** : P0
- **Source** : PRD §6 US-03, FR-005
- **Énoncé** : Si l'estimation dépasse le seuil configuré (FR-005), une modal demande confirmation explicite avant lancement.
- **Vérification** : test composant + E2E.
- **Statut** : proposed

#### FR-012 — Batch parallèle avec concurrence limitée
- **Priorité** : P0
- **Source** : CLAUDE §5
- **Énoncé** : Le batch lance les générations en parallèle avec une concurrence maximale de 3 (configurable). Chaque génération est indépendante : un échec n'interrompt pas les autres.
- **Vérification** : unit test `batchOrchestrator` avec providers mockés (succès/échec mixte, mesure du parallélisme).
- **Statut** : proposed

#### FR-013 — Affichage asynchrone progressif
- **Priorité** : P0 (vecteur de succès unique du PRD §3)
- **Source** : PRD §3, US-01
- **Énoncé** : Chaque image apparaît dans la grille **dès qu'elle est reçue**, sans attendre la fin du batch. Tant qu'une cellule n'a pas reçu son image, elle affiche un skeleton.
- **Vérification** : E2E Playwright avec providers mockés à délais variables, assertion d'apparition séquentielle.
- **Statut** : proposed

#### FR-014 — Bouton Stop global
- **Priorité** : P0
- **Source** : PRD §6 US-03, CLAUDE §7
- **Énoncé** : Pendant un batch, un bouton Stop annule toutes les requêtes en vol via `AbortController`. Les images déjà reçues restent affichées et facturées. Aucune nouvelle requête ne part après le Stop.
- **Vérification** : unit test `batchOrchestrator` (signal abort) + E2E.
- **Statut** : proposed

#### FR-015 — Aucun retry automatique
- **Priorité** : P0
- **Source** : CLAUDE §7, §13
- **Énoncé** : En cas d'erreur API (4xx, 5xx, timeout), l'app n'essaie **pas** automatiquement de relancer. La cellule affiche l'erreur, l'utilisateur peut relancer manuellement.
- **Vérification** : unit test adapter (assertion qu'aucun retry n'est tenté).
- **Statut** : proposed

#### FR-016 — Gestion des échecs partiels
- **Priorité** : P0
- **Source** : PRD §6 US-01
- **Énoncé** : Si une génération échoue, sa cellule affiche un message d'erreur clair (code + raison brève). Les autres générations du batch continuent normalement.
- **Vérification** : E2E + unit test orchestrator.
- **Statut** : proposed

### 1.4 Affichage & navigation

#### FR-017 — Toggle Grid / Flex
- **Priorité** : P0
- **Source** : PRD §4.1, conv Gemini 1 (réponse 3)
- **Énoncé** : Un bouton toggle bascule la vue entre :
  - **Grid** : wrap libre, ordre stable.
  - **Flex** : colonnes = modèles, lignes = prompts.
  Le toggle ne recharge pas les images (pas de re-fetch).
- **Vérification** : test composant `GenerationGrid` (snapshot des deux modes) + E2E.
- **Statut** : proposed

#### FR-018 — Carte image
- **Priorité** : P0
- **Source** : PRD §4.1
- **Énoncé** : Chaque image affichée présente : la miniature, le nom du modèle, le seed (ou "—" si non supporté), le coût USD, un bouton Détails, un bouton Sauvegarder.
- **Vérification** : test composant `GenerationCard`.
- **Statut** : proposed

#### FR-019 — Lightbox plein écran
- **Priorité** : P1
- **Source** : PRD §4.1
- **Énoncé** : Cliquer sur l'image (hors boutons) ouvre une lightbox plein écran. Touche Échap ferme.
- **Vérification** : E2E.
- **Statut** : proposed

#### FR-020 — Comparateur 2 images côte à côte
- **Priorité** : P1
- **Source** : PRD §4.1
- **Énoncé** : Depuis la lightbox, l'utilisateur peut sélectionner une seconde image pour les afficher côte à côte.
- **Vérification** : test composant + E2E.
- **Statut** : proposed

#### FR-021 — Vue approfondie (lecture seule)
- **Priorité** : P0
- **Source** : PRD §6 US-04, CLAUDE §6.2
- **Énoncé** : Le bouton Détails ouvre une vue dédiée affichant : prompt exact, seed, modèle, ratio, coût, réponse brute (collapsible).
- **Vérification** : test page `sessions/[id].vue` + E2E.
- **Statut** : proposed

#### FR-022 — Relance sur un seul modèle depuis la vue approfondie
- **Priorité** : P1
- **Source** : PRD §6 US-04
- **Énoncé** : Depuis la vue approfondie, un bouton "Relancer sur ce modèle" pré-remplit un formulaire éditable (prompt, seed verrouillable si supporté) et déclenche une génération unitaire.
- **Vérification** : E2E.
- **Statut** : proposed

### 1.5 Coûts & métriques

#### FR-023 — Compteur de coût session
- **Priorité** : P0
- **Source** : PRD §6 US-03, CLAUDE §7
- **Énoncé** : Le coût cumulé de la session courante (depuis l'ouverture de l'app) est affiché en permanence dans l'UI.
- **Vérification** : test composant `CostMeter` + E2E.
- **Statut** : proposed

#### FR-024 — Compteur de coût mensuel
- **Priorité** : P1
- **Source** : PRD §6 US-03
- **Énoncé** : Le coût cumulé du mois calendaire en cours est affiché à côté du compteur session, lu depuis la DB (somme des `Generation.costUsd` du mois).
- **Vérification** : integration test (DB seedée + endpoint `/api/stats/month`).
- **Statut** : proposed

### 1.6 Persistance

#### FR-025 — Persistance automatique des métadonnées
- **Priorité** : P0
- **Source** : CLAUDE §3, §8
- **Énoncé** : Toute génération (réussie ou échouée) crée une entrée `Generation` en DB **immédiatement**, avec ses métadonnées complètes (prompt, modèle, seed, coût, raw). Aucune confirmation utilisateur requise.
- **Vérification** : integration test (lancement batch → vérif rows DB).
- **Statut** : proposed

#### FR-026 — Aucune persistance disque automatique des images
- **Priorité** : P0
- **Source** : CLAUDE §8, demande explicite utilisateur
- **Énoncé** : Les fichiers image ne sont **jamais** écrits dans un dossier permanent par défaut. Ils résident uniquement en cache temporaire (`app.getPath('temp')`) et sont purgés à la fermeture de l'app.
- **Vérification** : unit test `imageCache` + assertion du nettoyage à la fermeture.
- **Statut** : proposed

#### FR-027 — Sauvegarde manuelle d'une image individuelle
- **Priorité** : P0
- **Source** : PRD §6 US-05
- **Énoncé** : Le bouton Sauvegarder d'une carte image écrit le PNG + un JSON sidecar (méta) dans le dossier de sauvegarde par défaut (FR-004).
- **Vérification** : E2E + integration test endpoint `/api/save/image/[id]`.
- **Statut** : proposed

#### FR-028 — Sauvegarde manuelle d'une session entière
- **Priorité** : P0
- **Source** : PRD §6 US-05
- **Énoncé** : Un bouton "Sauvegarder la session" écrit toutes les images du batch + un `manifest.json` global dans `<dossier>/YYYY-MM-DD_HHmm_<slug>/`. Le manifest contient toutes les méta nécessaires pour rouvrir la session offline.
- **Vérification** : E2E + assertion structure du dossier produit.
- **Statut** : proposed

#### FR-029 — Galerie historique
- **Priorité** : P1
- **Source** : PRD §6 US-05, CLAUDE §6.4
- **Énoncé** : Une page Galerie liste toutes les `Session` persistées en DB, triées par date décroissante. Chaque ligne indique date, prompts (tronqués), nombre de générations, coût total, badge "Sauvegardée" si fichiers sur disque.
- **Vérification** : test page `sessions/index.vue` + E2E.
- **Statut** : proposed

#### FR-030 — Réouverture d'une session
- **Priorité** : P1
- **Source** : PRD §6 US-05
- **Énoncé** : Cliquer sur une session de la galerie ouvre la vue détail avec ses prompts, modèles utilisés et images (depuis le dossier sauvegardé si présent, sinon "image non sauvegardée — relancer").
- **Vérification** : E2E.
- **Statut** : proposed

### 1.7 Modèles & sources

#### FR-031 — Catalogue de modèles seedé
- **Priorité** : P0
- **Source** : PRD §7
- **Énoncé** : Au premier lancement, la DB est seedée avec les 7 modèles V1 listés en PRD §7. Chaque modèle contient `id`, `displayName`, `providerId`, `pricePerImage`, `supportsSeed`, `enabled`.
- **Vérification** : test du seed Prisma + assertion DB après migration.
- **Statut** : proposed

#### FR-032 — Activation/désactivation des modèles
- **Priorité** : P1
- **Source** : PRD §7
- **Énoncé** : L'utilisateur peut activer/désactiver chaque modèle individuellement depuis les réglages. Les modèles désactivés disparaissent du sélecteur de l'écran principal.
- **Vérification** : E2E + integration test.
- **Statut** : proposed

#### FR-033 — Adapter OpenRouter
- **Priorité** : P0
- **Source** : CLAUDE §4.1
- **Énoncé** : Un adapter `openrouter.ts` implémente `ImageGenerator` pour les modèles : Gemini 3.1 Flash-Lite, Gemini 3.1 Flash, Gemini 3.1 Pro, GPT Image 1.5.
- **Vérification** : unit tests par modèle (mock fetch, tous chemins succès/erreur).
- **Statut** : proposed

#### FR-034 — Adapter Fal.ai
- **Priorité** : P0
- **Source** : CLAUDE §4.1
- **Énoncé** : Un adapter `fal.ts` implémente `ImageGenerator` pour : Flux 1.1 Pro, Flux 1.1 Schnell, SD 3.5 Large.
- **Vérification** : unit tests par modèle.
- **Statut** : proposed

#### FR-055 — Budget slider pour sélection rapide des modèles
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : Dans la vue **Modèles** du SidePanel (`ProvidersPanel.vue`), un slider est placé **sous** la liste des modèles. Permet à l'utilisateur de cocher en masse tous les modèles dont `pricePerImage ≤ valeur du slider`. Caractéristiques :
  - Range : 0 → 0.15$, step 0.005$, valeur initiale 0.
  - Input texte secondaire (number, step 0.005) synchronisé bidirectionnellement avec le slider.
  - Label "Budget max par image" + affichage formaté `$0.XXX`.
  - Comportement "aide bulk" : à chaque mouvement du slider/input, émet `update:selectedModelIds` au parent avec la liste filtrée.
  - L'état `disabled` des checkboxes (hasApiKey, enabled) **n'est pas géré** par ce composant — la sélection est purement basée sur le prix. La gestion du disabled reste de la responsabilité de `ModelSelector`.
  - Quand l'utilisateur clique manuellement une checkbox dans `ModelSelector`, **le slider ne bouge pas**, sa valeur reste fixée à la dernière position. La sélection peut alors diverger du seuil.
- **Vérification** : test composant `BudgetSlider` (slider/input synchronisés, émission `update:selectedModelIds` filtré, comportement à 0 = vide, comportement à max = tous).
- **Statut** : proposed

#### FR-054 — Pré-prompts par défaut + logique de complétion (orientation outil d'inspiration)
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29 (échange utilisateur)
- **Énoncé** : Trois pré-prompts statiques (PROMPT_PREFIX_A/B/C dans `shared/contracts.ts`) garantissent que **tous les prompts générés ciblent un haut de landing page incluant une hero section**, avec direction artistique éditoriale et typographie display, **quel que soit le brief utilisateur**. Comportement :
  - À l'ouverture de `/generate`, les 3 textareas A/B/C sont pré-remplies avec ces préfixes (modifiables/effaçables librement).
  - Bouton ↺ "Réinitialiser aux pré-prompts par défaut" dans `PromptInputs.vue` permet de revenir à l'état initial à tout moment.
  - Le LLM Haiku 4.5 (Brief Assistant) ne génère plus des prompts complets mais des **compléments** qui s'ajoutent aux préfixes via `joinPromptVariant(variant, completion)` — séparateurs spécifiques (espace pour A, virgule pour B, retour ligne pour C).
  - Le formulaire `/home` est volontairement **léger et 100% optionnel** (5 champs : DA, mood, UI/UX, typo, palette + URLs) — l'outil cible l'**inspiration et la divergence créative**, pas la fidélité à un brief client.
- **Vérification** : runtime smoke test (chargement /generate avec préfixes / clic ↺ / clic Prompter sur formulaire vide → 3 directions différentes).
- **Statut** : proposed

#### FR-053 — Page Accueil : génération assistée de prompts via brief structuré + analyse de site
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29 (échange utilisateur)
- **Énoncé** : Une nouvelle page `/home` (entrée "Accueil" dans la nav du SidePanel) propose un formulaire structuré de brief client :
  - **Champs obligatoires** : Client/activité, Sujet de l'image, Direction artistique.
  - **Champs optionnels** : Ambiance/mood, Contraintes, URL(s) du site existant (l'utilisateur peut ajouter plusieurs URLs via "Ajouter une URL de page").
  - À la soumission, si une ou plusieurs URLs sont fournies, le serveur effectue **pour chaque URL** :
    1. Fetch HTML + extraction texte (titre, meta, h1/h2, paragraphes, max 2000 char/page).
    2. Screenshot Playwright headless (page rendue).
    3. Extraction palette dominante via `node-vibrant`.
    4. Description visuelle via Claude Haiku 4.5 vision sur le screenshot.
  - **Concurrence** : 2 URLs en parallèle. Timeout par page : 8s. Timeout global : 30s.
  - **Fenêtres d'erreur URL** : si une URL fournie échoue (404, timeout, malformée), la pipeline s'arrête. **Aucune génération de prompts**, message d'erreur affiché. L'utilisateur retire/corrige l'URL.
  - Le contexte (texte + palette + description vision) est combiné en **markdown** et envoyé à Claude Haiku 4.5 (texte) avec les 5 champs du formulaire pour générer **3 prompts image** dans 3 styles : (A) langage naturel descriptif, (B) mots-clés/tags, (C) format structuré.
  - **Feedback live** : SSE depuis le serveur indique chaque page crawlée en temps réel + bouton Annuler.
  - **Au succès** : redirection automatique vers `/generate`, les 3 prompts pré-remplis dans `PromptInputs`, toast "Prompts remplacés" si l'utilisateur en avait déjà.
  - **Persistance** : valeurs du formulaire + URLs + contexte (markdown + screenshots mini base64 + palette + description) + 3 prompts générés en `localStorage` ET dans `Session.brief` (champ JSON) pour la galerie.
  - **Pas de fallback** : si le LLM échoue (clé manquante, rate limit, etc.), erreur affichée, brief reste, l'utilisateur peut retenter ou écrire ses prompts manuellement sur `/generate`.
- **Vérification** : test composant page Accueil + test endpoint `/api/brief` (mock crawler/screenshot/LLM) + smoke test E2E.
- **Statut** : proposed

#### FR-052 — PromptSwitcher universel (Grid + Flex) avec option "Tous"
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29 (échange utilisateur)
- **Énoncé** : Le `PromptSwitcher` est visible dès que `promptCount > 1`, indépendamment du mode (Grid ou Flex). Il propose `Tous | A | B | C` (les onglets `B`/`C` n'apparaissent que si remplis). En mode `Tous` :
  - **Grid** : toutes les cartes (toutes variantes) sont rendues, regroupées par brand.
  - **Flex** : chaque modèle reçoit **N colonnes** (1 par prompt rempli), avec un sub-header `A`/`B`/`C` au-dessus de chaque colonne pour identifier la variante. Les colonnes restent regroupées sous le header brand de chaque brand.
  Sélection par défaut : `A` (= `activePromptIdx=0`), pour rester lisible.
- **Vérification** : test composant `GenerationGrid` (présence du switcher en grid + comportement filtrage `Tous`/`A`/`B`/`C` en grid et flex).
- **Statut** : proposed

#### FR-057 — Sessions persistantes (1 session = N batchs successifs)
- **Priorité** : P1
- **Source** : Refonte UX 2026-05-01 — étendu 2026-05-05 (phasage workflow)
- **Énoncé** : Refonte du modèle session pour supporter le pattern "conversation ChatGPT". Une session reste **active** entre plusieurs clics "Générer" — l'utilisateur peut itérer plusieurs batchs au sein d'une même session. Comportement :
  - Au premier batch d'une session active, une `Session` est créée en DB avec un nom auto-généré horodaté (ex: `Session 2026-05-01 14:32`).
  - Aux batchs suivants, les nouvelles `Generation` sont rattachées à la **même** `Session.id`.
  - Bouton **"+ Nouvelle session"** dans le SidePanel (au-dessus des onglets contextuels) déclenche la création d'une nouvelle session vide.
  - Au reload de l'app, **reprise auto** sur la dernière session active (persistée en `localStorage` sous `seedcomparator.session.activeId`).
  - Le nom de la session est **éditable** (champ texte dans le SidePanel ou page session).
  - Le `Session.brief` (FR-053) est attaché à la session uniquement au **premier** batch ; les batchs suivants conservent le brief initial.
  - **Extension phasage (FR-069)** : la session persiste 9 prompts (3 phases × 3 variants A/B/C). Le champ `activePhase` de la session mémorise la dernière phase active.
- **Vérification** : test composable `useActiveSession` (création, reprise, switch, persistance phase active) + integration `POST /api/generate` (sessionId + phase réutilisés).
- **Statut** : proposed

#### FR-058 — Like par image + sauvegarde auto dans sous-dossier session
- **Priorité** : P1
- **Source** : Refonte UX 2026-05-01 — étendu 2026-05-05 (cycle de vie mémoire vive)
- **Énoncé** : Bouton ❤️ sur chaque `GenerationCard` (visible uniquement quand `status=success`). Comportement :
  - Au clic ❤️, l'image est **immédiatement** persistée sur disque dans `<saveFolder>/<sessionName>/<generationId>.png` + sidecar `<generationId>.json` (méta complètes incluant le champ `phase`).
  - Si `<saveFolder>` n'est pas configuré dans Réglages, le clic ❤️ déclenche le dialog Electron de sélection du dossier (une seule fois, persisté en setting).
  - Le sous-dossier de session est créé à la volée si absent.
  - Au dé-like (clic re-cliqué), le fichier disque + sidecar sont supprimés **et la `Generation` est supprimée de la DB**. L'image reste disponible en mémoire vive tant que la session est active en RAM.
  - Champ `Generation.liked: Boolean @default(false)` ajouté en DB.
  - **Cycle de vie mémoire vive (FR-070)** : les générations non-likées ne sont persistées qu'en RAM (état Pinia). À la fermeture de l'app, elles sont perdues. Seules les likées survivent dans la DB.
- **Vérification** : integration test (toggle like → fichier + DB présent/absent) + test composant `GenerationCard` (icône ❤️ visible quand success, émission `like` au clic) + test composable (purge RAM à la fermeture).
- **Statut** : proposed

#### FR-060 — RailNav dédié (Sessions + nav globale conditionnelle) + SidePanel séparé
- **Priorité** : P1
- **Source** : Refonte UX 2026-05-01 (échange utilisateur)
- **Énoncé** : Refonte structurelle du shell de l'app. L'unique `SidePanel` actuel (qui fusionne nav + onglets contextuels Image/Providers + footer CostMeter) est **scindé en 2 composants distincts** :
  1. **RailNav** (gauche, toujours visible, collapsible) — contient :
     - Bouton `‹` collapse au sommet (icône propre).
     - **Section NAV** (visible **uniquement si session active**) : 🏠 Accueil, 🎨 Génération, 🖼 Galerie, ⚙ Réglages.
     - **Section SESSIONS** (toujours visible) : bouton "+ Nouvelle session", liste des **5 dernières sessions**, lien CTA "→ Voir toutes les sessions" (vers `/sessions`).
     - Footer : `CostMeter` compact.
  2. **SidePanel** (à droite du RailNav, à gauche de la vue centrale) — contient :
     - Bouton `‹` collapse propre, **distinct** de celui du RailNav.
     - 2 onglets internes : 🎨 Image, ⚡ Providers.
     - Visible **uniquement sur `/` (Génération)**.
  - **Pas de session active** = vue centrale `/` neutre ("Sélectionne ou crée une session"). Section NAV du RailNav cachée. SidePanel caché.
  - **Clic sur une session** dans le RailNav → définit la session active + redirige vers `/`.
  - **Clic "+ Nouvelle session"** → clear active session + redirige vers `/` (vue de génération vide).
  - **Au boot** : si `activeSessionId` en localStorage est valide en DB, reprise auto. Sinon, page neutre.
- **Vérification** : test composant `RailNav` (visibilité conditionnelle nav, présence sessions), `SidePanel` refondu (juste Image/Providers).
- **Statut** : proposed

#### FR-059 — Galerie filtrée par likes
- **Priorité** : P2
- **Source** : Refonte UX 2026-05-01 — étendu 2026-05-05 (filtres phase + cycle de vie)
- **Énoncé** : Dans la page `/sessions` (galerie / historique), affichage et filtrage enrichis :
  - Toggle "❤️ Likées uniquement" : filtre les sessions (au moins une image likée) et les générations dans la vue détail.
  - **Filtre par phase** : `Wireframe` / `Mood` / `UI-UX Design` (tous par défaut).
  - **Filtre par variant** : `A` / `B` / `C` (tous par défaut).
  - **Filtre par modèle** : sélection multiple (tous par défaut).
  - **Règle de visibilité conditionnelle** : si la session source est encore active en RAM (app ouverte), les générations non-likées sont visibles dans l'historique avec le toggle "Likées uniquement" désactivé. Si la session est fermée (app relancée), seules les likées apparaissent.
  - La `GenerationCard` dans l'historique affiche un badge de phase (`Wireframe` / `Mood` / `UI-UX`) et le variant utilisé (A/B/C).
- **Vérification** : test composant `HistoryGrid` (filtres phase + variant + modèle + toggle likées) + test règle de visibilité (session active vs fermée).
- **Statut** : proposed

#### FR-069 — Phasage du workflow de génération (Wireframe / Mood / UI-UX Design)
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-05
- **Énoncé** : La vue Génération expose un sélecteur de **phase** au-dessus de la zone de prompts A/B/C. Trois phases correspondent aux étapes du cycle de création de design :
  - **Wireframe** : structuration de la mise en page, low-fidelity, pas de couleur.
  - **Mood** : direction artistique, injection de valeurs de marque, palette, matières.
  - **UI-UX Design** : finition pixel-perfect, composants UI, typographie, rendering technique.
  - La navigation entre phases est **libre** (pas de séquence forcée) — l'utilisateur peut aller de n'importe quelle phase à n'importe quelle autre à tout moment.
  - La phase active est mémorisée par session (champ `activePhase` sur `Session`).
  - Chaque `Generation` porte un champ `phase: 'wireframe' | 'mood' | 'uiux'` tracé en DB.
  - La vue Génération **n'affiche que les générations de la phase active** (générations courantes de la session, en mémoire vive).
- **Vérification** : test sélecteur phase (navigation libre, rechargement prompts) + test `Generation.phase` persisté + test filtre vue génération (phase active uniquement).
- **Statut** : proposed

#### FR-070 — Persistance des 9 prompts par session (3 phases × 3 variants)
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-05
- **Énoncé** : Une session stocke 9 prompts indépendants : 3 variants (A/B/C) × 3 phases (Wireframe/Mood/UI-UX). Comportement :
  - Au changement de phase, les prompts A/B/C du textarea sont **remplacés** par ceux de la phase ciblée (sauvegarde automatique des 3 prompts de la phase courante avant switch).
  - Chaque phase dispose de ses propres prompts par défaut (`PROMPT_PREFIX_*_WIREFRAME`, `_MOOD`, `_UIUX` dans `shared/contracts.ts`).
  - Le modèle de données `Session.prompts` devient une map `{ wireframe: {a,b,c}, mood: {a,b,c}, uiux: {a,b,c} }` (JSON en DB).
  - Migration Prisma nécessaire : renommer l'ancien champ prompts plat en `promptsLegacy`, ajouter `promptsByPhase Json`.
- **Vérification** : test composable `useActiveSession` (switch phase → sauvegarde + rechargement prompts corrects) + test migration DB (legacy → map).
- **Statut** : proposed

#### FR-071 — Cycle de vie mémoire vive vs DB pour les générations
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-05
- **Énoncé** : Deux niveaux de stockage distincts pour les générations :
  - **Mémoire vive (Pinia)** : toutes les générations de la session active (likées + non-likées). Disponibles dans la vue Génération et la vue Historique tant que l'app est ouverte.
  - **DB persistée** : uniquement les générations ayant `liked = true`. Les non-likées ne sont jamais écrites en DB (elles restent en RAM uniquement).
  - **À la fermeture de l'app** (événement `app-quit` Electron) : les générations non-likées sont purgées de l'état Pinia. Les likées restent en DB et sont rechargées au prochain boot.
  - **Délike** : supprime le fichier disque + sidecar + l'entrée DB. L'image reste accessible en RAM si la session est encore active.
  - Le champ `Generation.phase` est persisté en DB pour les likées.
- **Vérification** : test composable (purge à la fermeture, non-likées absentes de DB) + integration test délike (DB + disque supprimés) + test rechargement boot (seules likées chargées).
- **Statut** : proposed

#### FR-072 — Vue Historique enrichie (filtres phase + variant + modèle + visibilité conditionnelle)
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-05
- **Énoncé** : La page `/sessions` (historique) devient une galerie d'images complète. Voir FR-059 pour les filtres. Spécifications supplémentaires :
  - Affichage sous forme de grille large en réutilisant `GenerationCard` avec une prop `historyMode: true` (désactive les actions de génération, active le badge de phase).
  - Badge de phase coloré sur chaque carte : `Wireframe` (gris), `Mood` (violet), `UI-UX Design` (bleu).
  - Badge variant `A` / `B` / `C` visible sur chaque carte.
  - Tri par défaut : date décroissante.
  - Quand la session source est active en RAM : toutes les générations (likées + non-likées) sont visibles (toggle "Toutes / Likées uniquement"). Quand la session est fermée : seules les likées sont chargées depuis DB.
- **Vérification** : test composant `GenerationCard` prop `historyMode` (badge phase + variant) + test `HistoryGrid` (filtres combinés, tri).
- **Statut** : proposed

#### FR-074 — Extraction de blocs prompt dans les réponses LLM
- **Priorité** : P2
- **Source** : Échange utilisateur 2026-05-05
- **Énoncé** : Le parser `promptBlockParser` extrait les blocs ` ```prompt … ``` ` d'une réponse markdown. Chaque bloc correspond à une variante dans l'ordre d'apparition (A, B, C). Un bouton "Insérer en A/B/C" est affiché sur chaque bloc dans la modale assistant.
- **Vérification** : unit test `promptBlockParser` (0 bloc, 1 bloc, 3 blocs, bloc vide ignoré, trim contenu).
- **Statut** : proposed

#### FR-075 — Layout splitpane draggable (zone prompts / zone générations)
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-06
- **Énoncé** : La page de génération (`/`) est divisée en deux panneaux verticaux séparés par une **barre de séparation draggable** :
  - **Panneau haut** : phase selector + prompts + assistant. Collapsible (le collapse existant). Hauteur par défaut ≈ 50 % de la zone utile.
  - **Panneau bas** : `GenerationGrid`. Prend le reste de l'espace.
  - La barre peut être glissée à la souris (et au doigt sur tablette) pour ajuster la répartition.
  - La position du séparateur est mémorisée dans `localStorage` (`seedcomparator.splitpane.topPct`).
  - Hauteur minimale pour chaque panneau : 80 px (empêche un panneau de disparaître complètement).
  - Quand le panneau haut est **collapsé** (toggle prompts), le séparateur descend automatiquement à la hauteur minimale du haut (header seul visible) et la grille remonte pour prendre tout l'espace.
  - La barre de séparation affiche un indicateur visuel de drag (poignée centrale).
- **Vérification** : unit test composable `useSplitPane` (clamp min/max, localStorage persist/restore, collapse sync) + test composant `SplitPane` (rendu slots, drag via mouse events simulés, collapse prop).
- **Statut** : proposed

#### FR-076 — Remontée automatique du séparateur au démarrage d'une génération
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-06
- **Énoncé** : Quand une génération démarre (`inProgress` passe à `true`), le panneau haut se collapse automatiquement (comportement existant FR-046) ET le séparateur se repositionne à la hauteur minimale du haut. Quand la génération se termine, le séparateur revient à la position mémorisée par l'utilisateur (pas au défaut).
- **Vérification** : unit test `useSplitPane` (watch inProgress → collapse → clamp) + E2E smoke.
- **Statut** : proposed

#### FR-073 — Assistant créatif LLM par phase (modale chatbot Gemini)
- **Priorité** : P2
- **Source** : Échange utilisateur 2026-05-05
- **Énoncé** : Un bouton "✨ Assistant" déclenche une modale de chatbot contextuelle à la phase active. Comportement :
  - **Une modale par phase**, avec un system prompt spécialisé selon la phase active :
    - **Wireframe** : oriente vers des structures de layout, mise en page, hiérarchie visuelle, espacement.
    - **Mood** : oriente vers des palettes de couleurs (codes Hex), matières, ambiances, valeurs de marque.
    - **UI-UX Design** : oriente vers des termes de rendu technique (Octane, ray-tracing, lentilles, typographies, finitions).
  - La conversation est en **français** (côté utilisateur et réponses de l'assistant).
  - Les **prompts générés** (blocs en anglais destinés aux modèles image) sont identifiés dans les réponses par des blocs ` ```prompt … ``` `. Un bouton **"Insérer dans A / B / C"** apparaît sur chaque bloc détecté.
  - **Provider** : Gemini API free tier (`gemini-2.0-flash-lite` ou équivalent gratuit). Clé `GOOGLE_AI_API_KEY` réutilisée (même gateway `google-ai`). Route Nitro dédiée `POST /api/helper/chat`.
  - La conversation est **persistée par session × phase** en DB (table `HelperConversation`).
  - Bouton de déclenchement : visible dans le container de prompts (proche des tabs A/B/C).
- **Vérification** : test adapter Gemini text (mock fetch, system prompt correct par phase, abort) + test parsing blocs `prompt` + test route `/api/helper/chat` (validation Zod, réponse SSE ou JSON) + test insertion dans champ prompt.
- **Statut** : proposed

#### FR-056 — Adapter OpenAI direct (GPT Image 2 + GPT Image 1 + DALL-E 3/2 + GPT Image 1 Mini)
- **Priorité** : P1
- **Source** : Refonte UX 2026-05-01 (échange utilisateur)
- **Énoncé** : Une 4ᵉ gateway `openai` est ajoutée. Adapter `server/providers/openai.ts` qui parle directement à l'API OpenAI Platform (clé `sk-...`) plutôt que de passer par OpenRouter (économie de marge + accès aux modèles non-routés). 5 modèles ajoutés sous brand "OpenAI" :
  - **gpt-image-2** (sorti 2026-04-21) — modèle phare, photoréalisme, text rendering pixel-perfect multilingue (incl. JP/CN/KO/HI/BN), jusqu'à 4K, ratios 3:1 à 1:3. Pricing token-based (~$0.053/image medium quality 1024×1024).
  - **gpt-image-1** — précédent flagship (~$0.040/image standard).
  - **gpt-image-1-mini** — version éco rapide (~$0.011/image).
  - **dall-e-3** — text-to-image, support HD ($0.040 standard / $0.080 HD).
  - **dall-e-2** — text-to-image legacy ($0.020 1024×1024).
  - Le modèle existant `gpt-image-1.5` (via OpenRouter) **reste** dans le catalogue, marqué `via OpenRouter` par le tag UI déjà en place — l'utilisateur choisit selon sa stratégie de clés.
  - V1 : capacités text-to-image standard quality uniquement. Pas d'edit/variations/HD (stories séparées si besoin).
  - Tri brand "OpenAI" : `gpt-image-1-mini` → `dall-e-2` → `dall-e-3` → `gpt-image-1` → `gpt-image-2` (croissant par prix).
- **Vérification** : unit tests adapter (mock fetch, prompt exact, 401/429/500, abort, decode b64) + assertion DB seed.
- **Statut** : proposed

#### FR-061 — Mode provider `mock-real` (rejoue une fixture capturée)
- **Priorité** : P1
- **Source** : EPIC-14, échange utilisateur 2026-05-02
- **Énoncé** : Le projet expose 3 modes provider (au lieu de l'ancien boolean `mockMode`) :
  - `mock` — données fictives (PNG placeholder, rawResponse synthétique).
  - `mock-real` — rejoue une fixture capturée précédemment en live (réponse provider réelle figée). Si la fixture est absente, l'appel échoue explicitement (`ProviderError('invalid_request', 'fixture not found ...')`).
  - `live` — appel réel API.
  Format fixture : `tests/fixtures/providers/<source>/<modelId>/nominal.json` + `nominal.png` voisin (référencé par sha256 dans le JSON). `rawResponse` est restauré identique au capture.
- **Vérification** : unit tests `mockReal.test.ts` (rejoue, fixture absente, sha256 mismatch) + `contracts.test.ts > ProviderModeSchema`.
- **Statut** : verified

#### FR-062 — Vue `/models/test` pour tester un modèle isolément + capturer la fixture
- **Priorité** : P1
- **Source** : EPIC-14, échange utilisateur 2026-05-02
- **Énoncé** : Une page `/models/test` permet de tester chaque modèle individuellement, sans batch (pour économiser les coûts). Caractéristiques :
  - Dropdown liste tous les modèles (groupés par brand).
  - 3 textareas A/B/C pré-remplies avec `PROMPT_PREFIX_A/B/C` (mêmes pré-prompts que /generate). Bouton ↺ Reset.
  - 1 seule `GenerationCard` réutilisée (pas de batch).
  - Bouton "Tester en live (paie l'API)" → appelle `POST /api/models/test` qui force le mode `live`.
  - Si la fixture existe déjà, modal de confirmation "Écraser / Annuler" — pas de paiement avant confirmation.
  - Au succès, écriture automatique de la fixture (`fixtureWriter.write`).
  - Logs verbeux côté UI et serveur.
- **Vérification** : unit test `fixtureWriter.test.ts` (write/read/exists, sha256).
- **Statut** : verified

#### FR-063 — Configuration runtime du mode provider via dropdown Réglages
- **Priorité** : P1
- **Source** : EPIC-14, échange utilisateur 2026-05-02
- **Énoncé** : Le mode provider est configurable :
  - Au boot : variable d'env `PROVIDER_MODE` (`mock | mock-real | live`, défaut `live`).
  - Runtime : dropdown dans la page Réglages, persisté en DB (table `Setting`, clé `provider.mode`).
  - Cascade : DB > env > `'live'`. La valeur DB l'emporte si présente.
  - Banner "mode mock actif" affiché pour `mock` et `mock-real`, masqué pour `live`.
- **Vérification** : unit test `providerMode.test.ts` (cascade) + `contracts.test.ts > ProviderModeSchema`.
- **Statut** : verified

#### FR-067 — Refonte gateway images (OpenRouter sortant)
- **Priorité** : P1
- **Source** : STORY-104, échange utilisateur 2026-05-04
- **Énoncé** : Tous les modèles d'image sont accessibles via leur API native. OpenRouter n'est plus utilisé pour la génération d'images (catalogue `OPENROUTER_MODELS = []`). L'adapter `openrouter-text.ts` (Brief Assistant) reste intact. Catalogue refondu :
  - **Google AI Studio (`google-ai`)** : `imagen-4-fast`, `imagen-4`, `imagen-4-ultra`, `gemini-2.5-flash-image` (Nano Banana), `gemini-3.1-flash-image-preview` (Nano Banana 2), `gemini-3-pro-image-preview` (Nano Banana Pro).
  - **OpenAI Platform (`openai`)** : `gpt-image-1-mini`, `dall-e-2`, `gpt-image-1.5`, `dall-e-3`, `gpt-image-1`, `gpt-image-2`.
  - **Fal.ai (`fal`)** : `flux-1.1-schnell`, `sd-3.5-large`, `flux-1.1-pro`.
  L'adapter `google-ai.ts` gère deux familles : `imagen` (endpoint `:predict`) et `gemini-image` (endpoint `:generateContent` avec `responseModalities=['IMAGE']`). Tous les adapters rejettent une réponse 200 HTML (Content-Type guard) avec `ProviderError('server_error', 'returned HTML')`.
- **Vérification** : unit tests `google-ai.test.ts × 12` (imagen + gemini-image families, content-type guard) + integration `/api/models` (15 modèles seedés).
- **Statut** : verified

#### FR-068 — Scripts CLI de probe pour test/capture des modèles
- **Priorité** : P1
- **Source** : STORY-104, échange utilisateur 2026-05-04
- **Énoncé** : Un harnais CLI dans `scripts/probe-providers/` permet de tester chaque modèle/provider en live hors UI, et d'écrire automatiquement une fixture rejouable en mode `mock-real`. Caractéristiques :
  - Un script par provider (`probe-openai.mjs`, `probe-google-ai.mjs`, `probe-fal.mjs`, `probe-openrouter.mjs`) + un orchestrateur (`probe-all.mjs`).
  - Garde-fous : affichage du **plan + coût total** avant exécution, **confirmation interactive** obligatoire (skippable via `--yes`), `--max-cost=<usd>`, `--dry-run`.
  - Options CLI : `--only=<modelId>[,modelId,...]`, `--overwrite` (écrase fixture existante), `--yes`, `--dry-run`, `--max-cost`.
  - Tri par coût croissant pour économiser le budget en cas d'arrêt.
  - Prompt utilisé : `PROMPT_PREFIX_A` (un seul prompt par modèle, suffisant pour valider l'intégration).
  - npm scripts : `probe:openai`, `probe:google-ai`, `probe:fal`, `probe:openrouter`, `probe:all`, `probe:dry-run`.
- **Vérification** : runtime smoke test via `npm run probe:dry-run` (vérifie le chargement env, le filtrage `--only`, l'affichage du plan).
- **Statut** : implemented

#### FR-066 — Feedback immédiat "Nouvelle session" + actions par item dans RailNav
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-03
- **Énoncé** : Pattern UX ChatGPT dans le RailNav.
  - **Entrée draft virtuelle** : un clic sur "+ Nouvelle session" affiche immédiatement une entrée "Nouvelle session" en tête de la liste (italique, bordure dashed accent, "en attente du 1er batch"). Cette entrée est non-cliquable. Au 1er batch réussi, `setFromGenerate(id, name)` ressort du draft et déclenche un `loadRecent()` qui la remplace par la vraie session.
  - **Menu d'actions** : chaque session récente expose un bouton "..." (visible au hover ou quand le menu est ouvert) avec :
    - **Renommer** : prompt natif, PATCH `/api/sessions/[id]`, recharge la liste.
    - **Supprimer** : confirm natif, DELETE `/api/sessions/[id]` (cascade Generation), recharge la liste, clear l'état actif si la session supprimée était active.
  - Le menu se ferme au clic extérieur ou Echap.
- **Vérification** : tests composant `RailNav` (entrée draft visible/cachée, menu, supprimer confirmé/annulé, stopPropagation) + integration `DELETE /api/sessions/[id]` (404 inexistante, 200 + idempotence).
- **Statut** : proposed

#### FR-065 — Auto-chargement des clés API depuis `.env` au boot
- **Priorité** : P1
- **Source** : EPIC-14, échange utilisateur 2026-05-03
- **Énoncé** : Au démarrage du serveur Nitro, un plugin `loadEnvKeys` lit les variables d'environnement et charge automatiquement les clés API en mémoire (via `setApiKey`) — l'utilisateur n'a pas besoin de les retaper dans Réglages. Convention de nommage : `<PROVIDER_ID_SCREAMING_SNAKE>_API_KEY` où le `providerId` est celui de la table DB Provider :
  - `openai` → `OPENAI_API_KEY`
  - `openrouter` → `OPENROUTER_API_KEY`
  - `fal` → `FAL_API_KEY`
  - `google-ai` → `GOOGLE_AI_API_KEY`
  Comportement :
  - Cascade : env au boot → l'UI Réglages override runtime (un PUT /api/settings/keys retire le marqueur env).
  - Les valeurs vides ou whitespace-only sont ignorées.
  - L'endpoint `GET /api/settings/keys` expose `envLoaded: string[]` (providerIds chargés via env).
  - L'UI Réglages affiche un badge "depuis .env" à côté de chaque gateway concernée + tooltip avec le nom de la variable.
- **Vérification** : unit `envKeyLoader.test.ts × 7` (mapping, chargement, valeurs vides/whitespace, marqueurs ENV_LOADED, override) + integration `GET /api/settings/keys retourne envLoaded array`.
- **Statut** : proposed

#### FR-064 — Désactivation visuelle des modèles sans fixture en mode mock-real
- **Priorité** : P1
- **Source** : EPIC-14, échange utilisateur 2026-05-02
- **Énoncé** : Lorsque le mode provider courant est `mock-real`, les modèles **sans fixture capturée** apparaissent grisés/désactivés dans `ModelSelector`, avec un tooltip "Aucune fixture capturée — teste-le d'abord sur /models/test". Les modèles avec fixture restent normalement sélectionnables. En modes `mock` et `live`, ce filtrage n'est pas appliqué (mock fait toujours marcher tous les modèles, live dépend de la clé API). Le `ModelDTO` est étendu d'un champ `hasFixture: boolean` calculé côté serveur (true en mode `mock`, true en mode `mock-real` si fixture présente, true en mode `live` toujours — la grille est purement informative dans les autres modes).
- **Vérification** : test composant `ModelSelector` (grise les modèles sans fixture en mock-real) + integration `/api/models` (champ `hasFixture` cohérent selon le mode).
- **Statut** : verified

#### FR-051 — Adapter Google AI Studio (Imagen)
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29 (échange utilisateur)
- **Énoncé** : Une 3ᵉ gateway `google-ai` est ajoutée. Un adapter `google-ai.ts` implémente `ImageGenerator` pour les modèles Imagen via la **Gemini API** (clé API `GOOGLE_API_KEY` / Google AI Studio, pas Vertex AI). Modèles supportés en V1 : Imagen 4 Preview, Imagen 3, Imagen 3 Fast — tous classés brand "Google". Le paramètre `personGeneration: "ALLOW_ADULT"` est passé par défaut. Pas de seed (Imagen ne le supporte pas via cette API).
- **Vérification** : unit tests adapter (mock fetch, succès, 401, 429, 500, abort, prompt exact).
- **Statut** : proposed

### 1.8 Refonte UX exploration (post-V1, EPIC-9)

#### FR-035 — Side panel rétractable
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : Le panneau latéral de configuration peut être réduit (collapsed) et déployé (expanded) via un bouton dédié. L'état est persisté dans `localStorage` sous la clé `seedcomparator.sidepanel.collapsed` afin de survivre au reload.
- **Vérification** : unit test du composable `useSidePanel` (toggle, persistance) + E2E.
- **Statut** : proposed

#### FR-036 — Side panel organisé en onglets verticaux
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : Le contenu du side panel est segmenté en deux onglets : **Image** (ratio, qualité, nombre d'images) et **Providers** (sélection des modèles). Les onglets sont rendus en rail vertical d'icônes (style VS Code) accessibles même quand le panneau est replié — cliquer sur une icône en mode replié déploie le panneau sur l'onglet ciblé.
- **Vérification** : test composant `SidePanelTabs` (changement d'onglet, focus visuel).
- **Statut** : proposed

#### FR-037 — PromptInputs en haut du main + tabs A/B/C
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : Les 3 prompts ne sont plus affichés simultanément en sidebar mais centralisés en haut de la zone principale, sous forme d'un seul textarea avec une barre de tabs `A | B | C` au-dessus. Le contenu des 3 prompts reste conservé en mémoire même quand l'onglet n'est pas affiché. Un indicateur visuel (point coloré) signale les onglets remplis.
- **Vérification** : test composant `PromptInputs` (switch tab préserve les valeurs, indicateur de remplissage).
- **Statut** : proposed

#### FR-038 — Configuration qualité et nombre d'images
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : L'onglet Image expose deux nouvelles configurations :
  - `quality` : `low` / `standard` / `high` (défaut `standard`).
  - `nbImagesPerPrompt` : entier 1 à 4 (défaut `1`).
  Ces deux champs sont ajoutés à `GenerateRequest` (Zod) et propagés au `batchOrchestrator`. Les adapters qui ne supportent pas ces options les ignorent silencieusement (warning loggué côté serveur).
- **Vérification** : test contracts.test.ts (Zod accepte/rejette) + integration `costEstimator` (multiplication par `nbImagesPerPrompt`).
- **Statut** : proposed

#### FR-039 — Cartes placeholder visibles avant génération
- **Priorité** : P0
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : Dès qu'au moins un modèle est sélectionné, une carte `idle` est affichée pour chaque modèle (×prompt actif en mode flex, ×nb prompts en mode grid), avant tout lancement de batch. Cette carte présente un placeholder gris (au ratio configuré), le nom du modèle, et aucun spinner ni erreur. Elle transitionne en `pending` au lancement, puis `success/failed`.
- **Vérification** : test composant `GenerationCard` (état `idle`) + test composable `useGenerationSession` (`displayedCards` calculée).
- **Statut** : proposed

#### FR-040 — Vue Flex : 1 carte par modèle + switch de prompt
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : En mode `flex`, on affiche **une seule colonne par modèle** (= une seule carte par modèle), correspondant au prompt actif courant. Une barre de switch `A | B | C` au-dessus de la grille permet de changer le prompt actif sans re-fetch. Les générations des prompts inactifs restent en mémoire et redeviennent visibles au switch.
- **Vérification** : test composant `GenerationGrid` (mode flex, switch prompt change le contenu sans reload).
- **Statut** : proposed

#### FR-042 — Classement des modèles par éditeur (brand)
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29 (échange utilisateur)
- **Énoncé** : Les modèles dans le `ModelSelector` sont regroupés par **brand** (= éditeur du modèle, ex: Google, OpenAI, Black Forest Labs, Stability AI), **pas** par gateway technique (OpenRouter, Fal.ai). L'ordre des brands suit un `sortOrder` stable défini en seed. Le `displayName` du modèle est uniquement le nom commercial (ex: "Nano Banana 2 Lite") — sans préfixe technique parasite ("Gemini 3.1 Flash-Lite (...)").
- **Vérification** : test composant `ModelSelector` (groupes par brand) + test de seed (présence des champs `brandId`, `brandDisplayName`, `brandSortOrder`).
- **Statut** : proposed

#### FR-043 — Indication discrète du gateway dans GenerationCard + Réglages
- **Priorité** : P2
- **Source** : Refonte UX 2026-04-29 (échange utilisateur)
- **Énoncé** : Le **gateway technique** (OpenRouter, Fal.ai…) reste invisible du `ModelSelector` mais demeure exposé :
  - dans la page **Réglages** : la section "Clés API" est libellée "Passerelles (gateways)" et liste les gateways auxquels saisir une clé.
  - dans la **GenerationCard** : sous le nom du modèle, un tag discret (ex: `via OpenRouter`) signale la passerelle utilisée.
- **Vérification** : test composant `GenerationCard` (rend `gatewayDisplayName` quand fourni) + smoke test page `Réglages`.
- **Statut** : proposed

#### FR-044 — Regroupement par brand dans Grid et Flex
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : Les vues `Grid` et `Flex` regroupent visuellement les cartes par **brand** :
  - **Mode Grid** : les cartes sont sectionnées par brand, chaque section précédée d'un titre (ex: "Google"), trié par `brandSortOrder`.
  - **Mode Flex** : les colonnes (= modèles) sont regroupées sous un header brand unique partagé. Si N modèles d'une même brand sont sélectionnés, ils partagent un seul header. La structure reste 1 carte par modèle × prompt actif.
- **Vérification** : test composant `GenerationGrid` (présence des headers brand en grid et en flex, ordre stable).
- **Statut** : proposed

#### FR-045 — App shell unifié (nav globale dans SidePanel)
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : Suppression du header global SeedComparator. Le `SidePanel` devient l'app shell persistant sur toutes les routes. Son rail vertical contient :
  - **Section nav globale** : 🏠 Exploration, 🖼 Galerie, ⚙ Réglages (toujours visible).
  - **Section onglets contextuels** : 🎨 Image, ⚡ Providers (visibles **uniquement** sur la route `/`).
  - **Footer rail** : `CostMeter` compact (session + mois empilés, font 11px).
- **Vérification** : test composant `SidePanel` (présence des 3 nav-items, présence conditionnelle des onglets contextuels selon prop `showContextTabs`).
- **Statut** : proposed

#### FR-046 — Collapse PromptInputs pendant et après génération
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : Au lancement d'un batch (`inProgress=true`), la section PromptInputs se replie automatiquement pour laisser le focus aux résultats. Elle reste repliée après la fin du batch jusqu'à ce que l'utilisateur clique sur un bouton "Modifier les prompts" qui la redéploie.
- **Vérification** : test E2E + test composable.
- **Statut** : proposed

#### FR-047 — Aération renforcée Grid + Flex pleine hauteur
- **Priorité** : P2
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : Mode Grid : gap entre cartes ≥ 40px, padding interne carte ≥ 28px, gap entre sections brand ≥ 56px. Mode Flex : chaque colonne s'étire en hauteur jusqu'au bas du viewport, image agrandie (minmax(480px, 1fr) au lieu de 240px), gap entre colonnes ≥ 32px, gap entre brand-groups ≥ 64px.
- **Vérification** : revue de code + smoke test visuel manuel.
- **Statut** : proposed

#### FR-048 — Placeholder image avec icône
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : Tout `GenerationCard` en état `idle` ou en chargement d'image affiche un **placeholder visuel structuré** : fond gris doux + icône SVG type "image" centrée + label "En attente". Hauteur minimum garantie même quand le parent est en mode flex/full-height. Plus de cassure visuelle qui montre "image manquante".
- **Vérification** : test composant `GenerationCard` (présence de l'icône SVG en idle + min-height appliqué).
- **Statut** : proposed

#### FR-049 — Cascade hauteur en mode Flex
- **Priorité** : P1
- **Source** : Refonte UX 2026-04-29 (bug rapporté)
- **Énoncé** : En vue Flex, les colonnes occupent toute la hauteur disponible jusqu'au bas du viewport. La cascade `flex-1 min-h-0 h-full` est appliquée de `pages/index.vue` → `GenerationGrid` (mode flex) → sections brand → cartes. Le placeholder + l'image s'étirent pour remplir.
- **Vérification** : revue de code + smoke test visuel.
- **Statut** : proposed

#### FR-050 — Dark mode Slate doux
- **Priorité** : P2
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : Refonte de la palette dark mode pour réduire la dureté visuelle. Fond plus clair (`#0f1117` au lieu de `#0a0b14`), accent violet plus mat (`#8b7fff`), texte principal moins contrasté (`#e8eaf2`), glass borders adoucies. Inspiration : Linear / Notion dark.
- **Vérification** : revue visuelle + assertion contraste WCAG AA sur texte principal vs fond.
- **Statut** : proposed

#### FR-041 — Ratio par défaut 16:9
- **Priorité** : P2
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : À l'ouverture initiale de l'app, le ratio par défaut est `16:9` (au lieu de `native` actuellement). Choix motivé par l'orientation hero-section du PRD §2.
- **Vérification** : assertion dans le test E2E + smoke test composable.
- **Statut** : proposed

### 1.X Paramètres avancés par modèle (EPIC-18)

#### FR-077 — Catalogue mutualisé de traits de paramètres
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-06 (EPIC-18)
- **Énoncé** : Un fichier `server/providers/paramTraits.ts` est la source de vérité unique des traits de paramètres exposés par les modèles (key canonique, label FR, tooltip, schéma Zod, métadonnées UI : `kind`, range, options, défaut). Un fichier compagnon `modelParamProfiles.ts` compose, par modèle, la liste des traits utilisés + des overrides locaux. Aucun trait n'est dupliqué entre modèles : `seed`, `guidanceScale`, `negativePrompt`, etc. sont définis une seule fois et référencés par autant de modèles qu'ils concernent. Une fonction `resolveModelParamFields(modelId)` retourne la liste plate `ParamFieldMeta[]` (traits + overrides appliqués) prête à être consommée par le frontend.
- **Vérification** : tests unitaires sur `resolveModelParamFields`, `validateModelParams`, `defaultsForModel` ; garde-fou sur la non-vacuité des tooltips.
- **Statut** : verified

#### FR-078 — Distinction `scope` global vs per-generation
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-06 (EPIC-18)
- **Énoncé** : Chaque trait porte un champ `scope: 'global' | 'per-generation'`. Les traits `global` (ex : `guidanceScale`, `temperature`, `negativePrompt`) ont une seule valeur partagée dans le panneau global de paramètres du modèle au sein d'une session. Les traits `per-generation` (ex : `seed`, `referenceImage`) ont une valeur par instance précise (modèle × prompt × run) et vivent sur la carte de génération + dans la vue détail/relance. Justification : la seed 42 sur Flux ne donne pas la même image que la seed 42 sur SD ; verrouiller la seed d'une génération aimée doit être indépendant des autres modèles.
- **Vérification** : test sur `paramTraits.ts` (au moins `seed` et `falImageUrl` sont `per-generation`, tous les autres listés sont `global`) + test composant `ModelParamsPopover` (n'affiche pas les `per-generation`).
- **Statut** : verified

#### FR-079 — Adapters consomment les paramètres résolus
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-06 (EPIC-18)
- **Énoncé** : Les adapters `fal.ts`, `openai.ts`, `google-ai.ts` consomment les paramètres résolus (defaults ⊕ overrides utilisateur, scope global ∪ per-generation) et les sérialisent dans le body API selon les conventions de chaque provider. Une fonction `toApiKey(modelId, traitKey)` traduit chaque clé canonique vers le nom attendu par l'API. Les adapters n'envoient que les paramètres déclarés dans le profil du modèle — pas de fuite de clé inconnue.
- **Vérification** : tests unitaires par adapter qui mockent `fetch` et vérifient le body POST (cas défauts + cas avec overrides) + tests anti-régression (un appel sans override produit le même body qu'avant l'épique).
- **Statut** : verified

#### FR-080 — Composants Vue atomiques de paramètres
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-06 (EPIC-18)
- **Énoncé** : 9 composants Vue atomiques sont créés dans `app/components/params/`, alignés sur les conventions des playgrounds officiels : `ParamSliderContinuous`, `ParamSliderStepped`, `ParamSegmented`, `ParamSelect`, `ParamRadio`, `ParamToggle`, `ParamSeedInput` (input + bouton "🎲 Random"), `ParamTextarea` (auto-grow), `ParamNumberSpinner`. Chaque composant respecte une interface uniforme `{ field: ParamFieldMeta, modelValue, onUpdate }`, supporte le clavier (←/→ pour sliders et segmented, Esc pour fermer un select…) et l'état `disabled`. Un wrapper `ParamRow.vue` affiche label + tooltip + contrôle + valeur courante.
- **Vérification** : tests Vue Test Utils (rendu, émission `update:modelValue`, comportement clavier minimal) + page de démo `/dev/params` pour QA visuelle.
- **Statut** : verified

#### FR-081 — Tooltip d'information accessible sur chaque paramètre
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-06 (EPIC-18)
- **Énoncé** : Un composant `app/components/ui/InfoTooltip.vue` réutilisable est intégré sur chaque ligne de paramètre. Icône `i` 14×14 cohérente avec les tokens du design system, affichage au hover ET au focus clavier, fermeture sur Esc / blur / clic extérieur, ancrage configurable (`top` / `bottom` / `right`) avec fallback automatique si débordement. Largeur max 280px, `aria-label`, `role="tooltip"`, `aria-describedby` sur le contrôle parent. Aucun trait du catalogue ne peut avoir un tooltip vide ou égal au label (test garde-fou).
- **Vérification** : test composant Vue Test Utils (focus → visible, Esc → caché, contenu) + garde-fou sur `paramTraits.ts`.
- **Statut** : verified

#### FR-082 — Paramètres avancés totalement factorisés (un trait = un contrôle)
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-06 (EPIC-18) + révisions UX 2026-05-06 (v1→v4)
- **Énoncé** : Le panneau "Configuration de l'image" (`ImageConfigPanel.vue`) expose, à côté du sélecteur de ratio, une **liste plate** de paramètres avancés. **Règle unique** : pour chaque trait `scope: global` exposé par les modèles sélectionnés, **un seul** contrôle est rendu. La factorisation est totale, indépendamment de la portée du trait (universel comme `outputFormat` chez 7 modèles, local comme `openaiBackground` chez 4 modèles GPT Image, ou unique comme `openaiStyle` chez DALL·E 3 seul). Aucune duplication.
  Deux types de contrôles cohabitent dans cette liste :
  1. **Canoniques** (`CanonicalParamRow`) — pour les concepts dont la sémantique diverge entre modèles. Le catalogue `shared/canonicalParams.ts` définit 6 échelles homogènes : `quality` 1–5 « Brouillon→Premium », `outputFormat` `lossless|balanced|compact`, `creativity` 0–10 (inversée pour `guidanceScale`), `inferenceEffort` 1–5, `safetyLevel` `strict|balanced|permissive`, `negativePrompt` libre. Une fonction de mapping par modèle démultiplexe la valeur canonique vers les valeurs natives propres à chaque API (un même contrôle peut écrire plusieurs traits backend simultanément : `safetyLevel = strict` écrit `safetyTolerance: 2` + `enableSafetyChecker: true` chez Fal Pro et `openaiModeration: 'auto'` chez GPT Image).
  2. **Factorisés directs** (`FactorizedTraitRow`) — pour les traits dont la signature est identique entre tous les modèles qui les exposent. Le contrôle est rendu tel quel et propagé à tous les modèles concernés simultanément. Concerne notamment : `openaiBackground`, `outputCompression`, `openaiStyle`, `imagenPersonGeneration`, `imagenAddWatermark`, `geminiImageSize`, `numImages`.
  Chaque ligne, quel que soit son type, affiche son label, une icône `i` (`InfoTooltip`) avec un descriptif pédagogique, et un compteur "Appliqué à N modèles" listant les modèles concernés au hover. Les valeurs sont mémorisées dans `useModelParams` (toujours sous forme **native par modèle**) ; le composable expose `cleanOverridesForServer` qui filtre le shadow store canonique (`__canonical__*`) avant l'envoi à `/api/generate` ou `/api/estimate`. Sur la ligne du `ModelSelector`, un point bleu informatif rappelle qu'un modèle a une config custom. Les anciens stubs Qualité / Images par prompt de `ImageConfigPanel.vue` sont supprimés. Les composants `ModelParamsPopover`, `ModelParamsSection`, `IdiosyncraticParamsSection` (versions intermédiaires) ont tous été supprimés.
- **Vérification** : tests catalogue canonique `tests/unit/shared/canonicalParams.test.ts` (21 tests : tooltips, mappings par modèle, inversion creativity, multiplexage safetyLevel, listApplicableCanonicalParams) + composant `CanonicalParamRow` (10 tests : démultiplexage clic/slider/textarea, "Appliqué à N modèles") + composant `FactorizedTraitRow` (5 tests : label unique pour N modèles, propagation simultanée, compteur singulier/pluriel, slider numérique) + composant `ImageConfigPanel` (8 tests : factorisation totale sans doublon — y compris pour 4 modèles GPT Image qui exposent tous `openaiBackground` —, pas de section "Spécifique par modèle" résiduelle, scope=per-generation absent) + composable `useModelParams` (7 tests dont 2 sur `cleanOverridesForServer`).
- **Statut** : verified

#### FR-083 — Estimation de coût réactive aux paramètres `affectsCost`
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-06 (EPIC-18)
- **Énoncé** : Les traits qui impactent le prix portent `affectsCost: { multiplier?, addition? }`. `costEstimator` calcule le coût comme `pricePerImage × ∏ multipliers + Σ additions` en parcourant les overrides. `CostMeter` et la modal d'estimation pré-génération reflètent ce coût ajusté. Le tooltip du paramètre concerné mentionne explicitement l'impact (ex : "Augmente le coût × 2 par rapport à standard"). Pour les modèles token-based (gpt-image), le tooltip indique une fourchette indicative plutôt qu'un chiffre exact.
- **Vérification** : tests unitaires `costEstimator` (pas d'override, override simple, plusieurs cumulés) + test integration sur le coût retourné par `POST /api/generate`.
- **Statut** : verified

#### FR-084 — Persistance Generation.params + vue détail enrichie
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-06 (EPIC-18)
- **Énoncé** : Une migration Prisma ajoute `Generation.params Json?` (nullable pour rétrocompat). Le champ stocke l'objet plat `{ paramKey: resolvedValue }` figé au moment de la génération (defaults ⊕ overrides global ⊕ overrides per-gen, post-validation Zod). `GenerationDTO.params` expose ce champ. La vue détail liste les paramètres utilisés sous chaque génération, en distinguant visuellement défauts vs modifications. Le `manifest.json` exporté lors d'une sauvegarde de session inclut `params` par génération. Le bouton "Relancer ce modèle" pré-remplit les composables avec ces params figés.
- **Vérification** : test integration `POST /api/generate` (params correctement persistés) + test E2E manuel (générer, ouvrir détail, sauvegarder, vérifier manifest).
- **Statut** : verified

#### FR-085 — UI per-generation : seed sur carte + relance + image de référence
- **Priorité** : P1
- **Source** : Échange utilisateur 2026-05-06 (EPIC-18)
- **Énoncé** : `GenerationCard.vue` affiche un badge `seed: <value>` cliquable (copie au presse-papier) quand la génération a une seed, et un bouton 🔒 pour verrouiller la seed pour les prochaines générations du **même modèle uniquement**. Un indicateur visuel signale les modèles avec seed verrouillée. La vue détail expose un champ "Seed" éditable (`ParamSeedInput`) ; pour les modèles dont le profil contient `falImageUrl` (Flux Pro Ultra), un champ d'upload d'image de référence (base64 inline) + slider `image_prompt_strength`. Le contrat `GenerateRequest` est étendu avec `perGenerationParams: Record<modelId × promptIdx, Record<paramKey, unknown>>`. Le verrouillage est éphémère (composable de session, non persisté en DB).
- **Vérification** : tests composant (verrouillage seed, propagation au composable) + test E2E manuel (verrouiller seed Flux, relancer même prompt → image très proche).
- **Statut** : verified

---

## 2. Exigences non fonctionnelles (NFR)

> Projet local mono-utilisateur : volontairement minimaliste, 3 catégories.

### NFR-001 — Aucune fuite de clé API dans le frontend
- **Priorité** : P0
- **Source** : CLAUDE §2, §13
- **Énoncé** : Aucune clé API ne doit apparaître dans les bundles frontend produits par `npm run build`. Vérification : script `npm run check:secrets` qui grep `.output/public/` à la recherche de patterns connus (regex `sk-[A-Za-z0-9]{20,}`, `fal_[A-Za-z0-9]+`, `or-[A-Za-z0-9]+`, etc.) et retourne exit code != 0 si match.
- **Vérification** : script CI `check:secrets` exécuté après chaque build.
- **Statut** : proposed

### NFR-002 — Performance d'affichage
- **Priorité** : P1
- **Source** : PRD §3 (vecteur de succès), CLAUDE §11.5.3
- **Énoncé** : Sur un batch standard de 3 modèles avec providers mockés à 2 s de latence, la **première image** doit être visible dans l'UI en moins de **10 secondes** (incluant boot batch + render).
- **Vérification** : test E2E Playwright `test:perf` avec assertion temporelle.
- **Statut** : proposed

### NFR-003 — Build sans erreur ni warning bloquant
- **Priorité** : P0
- **Source** : CLAUDE §11.5.3
- **Énoncé** : `npm run build` doit produire un bundle Nuxt + Electron prêt à lancer, sans erreur ni warning catégorisé "bloquant" (les warnings non bloquants documentés sont tolérés mais loggés).
- **Vérification** : exit code 0 du build en CI.
- **Statut** : proposed

### NFR-004 — Aération visuelle minimale
- **Priorité** : P2
- **Source** : Refonte UX 2026-04-29
- **Énoncé** : L'UI respecte un design aéré avec des tokens d'espacement explicites définis dans `tokens.css` :
  - `--space-card-padding: 1.25rem` (20px) — padding interne d'une carte génération.
  - `--space-grid-gap: 1.5rem` (24px) — gap entre cartes dans la grille.
  - `--space-section-gap: 2rem` (32px) — gap entre sections principales (prompt input, toolbar, grid).
  Ces tokens remplacent les classes Tailwind ad hoc (`gap-2`, `gap-3`, `p-3`) pour les zones critiques (GenerationGrid, GenerationCard, SidePanel, header).
- **Vérification** : revue de code + smoke test visuel manuel + assertion qu'aucun snapshot existant ne casse.
- **Statut** : proposed

---

## 3. Matrice de traçabilité (état post-implémentation V1)

| Exigence | Test(s) couvrant | Statut |
|---|---|---|
| FR-001 | `tests/integration/api.test.ts > PUT /api/settings/keys` + adapters tests "throw unauthorized si pas de clé" | verified |
| FR-002 | _aucun_ | proposed (V2) |
| FR-003 | `tests/unit/components/ModelSelector.test.ts × 2` | verified |
| FR-004 | runtime IPC `dialog:selectFolder` (pas de test auto) | implemented |
| FR-005 | _aucun (seuil hardcodé)_ | proposed (V2) |
| FR-006 | `tests/unit/contracts.test.ts > GenerateRequest accepte 1 à 3 prompts` + `PromptInputs.test.ts × 2` | verified |
| FR-007 | `contracts.test.ts` + `ModelSelector.test.ts > émet la nouvelle sélection` | verified |
| FR-008 | `contracts.test.ts > GenerateRequest valide le ratio` | verified |
| FR-009 | `openrouter.test.ts > transmet le prompt sans modification` + `fal.test.ts > idem` | verified |
| FR-010 | `costEstimator.test.ts × 5` + `tests/integration/api.test.ts > /api/estimate` | verified |
| FR-011 | runtime UI (modal de confirmation > 0.50 USD) | implemented |
| FR-012 | `batchOrchestrator.test.ts > respecte la concurrence limitée` + `> exécute toutes les tâches` | verified |
| FR-013 | `tests/integration/api.test.ts > /api/generate stream` + `GenerationCard.test.ts > skeleton en pending` | verified |
| FR-014 | `batchOrchestrator.test.ts > annule via AbortController` + `openrouter.test.ts > propage AbortError` | verified |
| FR-015 | `batchOrchestrator.test.ts > ne fait aucun retry automatique` | verified |
| FR-016 | `batchOrchestrator.test.ts > isole les échecs` + `openrouter.test.ts × 3` (mappage 401/429/500) + `GenerationCard.test.ts > erreur en failed` | verified |
| FR-017 | runtime UI (toggle Grid/Flex visible dans `GenerationGrid.vue`) | implemented |
| FR-018 | `GenerationCard.test.ts × 4` | verified |
| FR-019 | runtime (`Lightbox.vue`) | implemented |
| FR-020 | partiellement implémenté (composant prêt, sélection multi non câblée) | proposed |
| FR-021 | runtime (`app/pages/sessions/[id].vue` + endpoint `/api/sessions/[id]`) | implemented |
| FR-022 | _non câblé_ | proposed (V2) |
| FR-023 | runtime (`CostMeter.vue`) | implemented |
| FR-024 | `tests/integration/api.test.ts > GET /api/stats/month` | verified |
| FR-025 | `tests/integration/api.test.ts > /api/generate crée une session` | verified |
| FR-026 | revue de code : seul `/api/save/*` écrit sur disque | implemented |
| FR-027 | runtime (`/api/save/image`) | implemented |
| FR-028 | runtime (`/api/save/session` produit manifest.json) | implemented |
| FR-029 | runtime (`/sessions` HTTP 200) | implemented |
| FR-030 | runtime (`/sessions/[id]` charge depuis DB) | implemented |
| FR-031 | `tests/integration/api.test.ts > GET /api/models retourne les modèles seedés` | verified |
| FR-032 | `tests/unit/contracts.test.ts > ModelToggleSchema` (implicite) + endpoint `PATCH /api/models` | implemented |
| FR-033 | `tests/unit/server/providers/openrouter.test.ts × 7` | verified |
| FR-034 | `tests/unit/server/providers/fal.test.ts × 4` | verified |
| FR-035 | `useSidePanel.test.ts × 3` (toggle, persistance, init from storage) + `SidePanel.test.ts × 2` | verified |
| FR-036 | `useSidePanel.test.ts × 2` + `SidePanel.test.ts × 2` (rail toujours visible, deploy au clic) | verified |
| FR-037 | `PromptInputs.test.ts × 5` (1 textarea + tabs A/B/C, switch préserve, dot indicator) | verified |
| FR-038 | `contracts.test.ts × 3` (quality + nbImagesPerPrompt, défauts, rejets) + `costEstimator.test.ts × 2` | verified |
| FR-039 | `useGenerationSession.test.ts × 3` (`buildIdleCards`) + `GenerationCard.test.ts × 2` (idle + ratio) | verified |
| FR-040 | `GenerationGrid.test.ts × 4` (1 carte/modèle, switch visible si >1 prompt, switch émet event) | verified |
| FR-041 | runtime (`app/pages/index.vue` ratio = '16:9') | implemented |
| FR-042 | `ModelSelector.test.ts × 2` (groupage par brand, tri brandSortOrder, gateway invisible) | verified |
| FR-043 | `GenerationCard.test.ts × 2` (tag `via {gateway}` présent/absent) + runtime `pages/settings.vue` | verified |
| FR-044 | `GenerationGrid.test.ts × 3` (sections grid par brand triées, header unique par brand, flex idem) | verified |
| FR-045 | `SidePanel.test.ts × 3` (nav globale, masquage onglets contextuels, CostMeter footer) | verified |
| FR-046 | runtime (`pages/index.vue` watcher `inProgress`, bouton "Modifier les prompts") | implemented |
| FR-047 | revue de code : tokens spacing renforcés (`tokens.css`), `gap-10/14/16`, image `minmax(480px)`, flex `flex-1` colonne pleine hauteur | implemented |
| FR-048 | `GenerationCard.test.ts × 2` (placeholder-icon SVG en idle, `gen-card-min-h` appliqué) | verified |
| FR-049 | revue de code : cascade `flex-1 min-h-0 h-full` complète (app.vue → index.vue → GenerationGrid → sections → cards) | implemented |
| FR-050 | revue de code : `tokens.css` palette slate doux (#0f1117, accent #8b7fff, texte #e8eaf2) | implemented |
| FR-051 | `google-ai.test.ts × 7` (prompt exact, unauthorized, 401/429/500, abort, decode b64) | verified |
| FR-056 | `openai.test.ts × 14` (prompt exact, endpoint /v1/images, Bearer auth, response_format différencié dall-e/gpt-image, quality différencié, unauthorized, 401/429/500, abort, decode b64, ratio→size, source=openai) | verified |
| FR-052 | `GenerationGrid.test.ts × 6` (switcher visible en grid, filtrage par prompt actif, mode "Tous" en grid et flex avec sub-headers) | verified |
| FR-053 | runtime (page `/home` + endpoint `/api/brief` SSE + adapter `openrouter-text` + services crawler/screenshot/palette + banque vocabulaire `server/data/prompt-vocabulary.json` v1.1.0 (318 termes) documentée dans `docs/prompt-vocabulary-sources.md`) | implemented |
| FR-054 | runtime — pré-prompts par défaut (PROMPT_PREFIX_A/B/C dans `shared/contracts.ts`) injectés dans les 3 textareas de `/generate` au chargement initial. Bouton ↺ Réinitialiser dans `PromptInputs.vue`. Le LLM Haiku génère des **compléments** (pas des prompts complets), concaténés via `joinPromptVariant()`. | implemented |
| FR-055 | `BudgetSlider.test.ts × 7` (sync slider/input, émission filtrée, bornes 0/max, clamp, résumé) | verified |
| FR-061 | `mockReal.test.ts × 5` (rejoue, fixture absente, png absent, sha256 mismatch, apiKey ignoré) + `contracts.test.ts > ProviderModeSchema` | verified |
| FR-062 | `fixtureWriter.test.ts × 5` (write/read/exists/round-trip/écrasement) | verified |
| FR-063 | `providerMode.test.ts × 5` (cascade DB > env > default + legacy + résilience erreur DB) + `contracts.test.ts > ProviderModeSchema` + integration `/api/settings PUT provider.mode` (3 valeurs valides + 1 invalide) | verified |
| FR-064 | `ModelSelector.test.ts × 3` (grise sans fixture, badge `clé manquante` prime sur fixture, modèle complet sélectionnable) + integration `/api/models renvoie hasFixture booléen` | verified |
| FR-069 | _à écrire_ — STORY-100 | proposed |
| FR-070 | _à écrire_ — STORY-100 | proposed |
| FR-071 | _à écrire_ — STORY-101 | proposed |
| FR-072 | _à écrire_ — STORY-102 | proposed |
| FR-073 | _à écrire_ — STORY-103 + STORY-104 | proposed |
| FR-074 | `promptBlockParser.test.ts × 6` (0 bloc, 1 bloc, 3 blocs, bloc vide ignoré, trim, pas de confusion avec ```code```) | proposed |
| FR-075 | `useSplitPane.test.ts` (clamp, localStorage, collapse sync) + `SplitPane.test.ts` (slots, drag simulé) | proposed |
| FR-076 | `useSplitPane.test.ts` (watch inProgress → collapse → clamp) | proposed |
| NFR-001 | `npm run check:secrets` exécuté en CI après build | verified |
| NFR-002 | _non mesuré_ | proposed |
| NFR-003 | `npm run build` exit 0 | verified |
| NFR-004 | revue de code + tokens présents dans `tokens.css` | implemented |

### Synthèse (post-EPIC-13 + EPIC-15/16 proposed)

- **Verified (test auto qui passe)** : 37 exigences
  - V1 : FR-001, 003, 006, 007, 008, 009, 010, 012, 013, 014, 015, 016, 018, 024, 025, 031, 033, 034 + NFR-001, NFR-003.
  - EPIC-9 : FR-035, 036, 037, 038, 039, 040, 042, 043, 044, 045, 048, 052, 055.
  - EPIC-10 : FR-051.
  - EPIC-12 : FR-056.
- **Implemented (livré, validé runtime mais pas de test auto dédié)** : 15 exigences
  - V1 implémentées : FR-002, 004, 005, 011, 017, 019, 021, 023, 026, 027, 028, 029, 030, 032.
  - EPIC-9 : FR-041 (default ratio 16:9), FR-046, FR-047, FR-049, FR-050 + NFR-004.
  - EPIC-11 : FR-053 (Brief Assistant V1), FR-054 (pré-prompts + complétion).
- **Proposed (non livré)** : FR-002 test clé, FR-005 UI seuil, FR-022 relance, NFR-002 perf bench, FR-020 multi-select lightbox.
- **Proposed EPIC-15 (phasage workflow)** : FR-057 (ext.), FR-058 (ext.), FR-059 (ext.), FR-069, FR-070, FR-071, FR-072.
- **Proposed EPIC-16 (assistant créatif)** : FR-073, FR-074.
- **Proposed EPIC-17 (split-pane layout)** : FR-075, FR-076.
