---
doc: PRD
version: 0.2.0
last_updated: 2026-04-28
synced_with: [../CLAUDE.md, REQUIREMENTS.md, EPICS.md, ARCHITECTURE.md, ../PROGRESS.md]
---

# PRD — SeedComparator

| Champ | Valeur |
|---|---|
| **Produit** | SeedComparator |
| **Version cible** | V1 (MVP) |
| **Statut** | Spécification |
| **Date** | 28 avril 2026 |
| **Plateforme** | Application desktop locale (Electron + Nuxt 3) |
| **Utilisateur** | Mono-utilisateur, usage personnel, non distribué |

---

## 1. Vision

Comparer **côte à côte**, en un seul clic, les rendus de plusieurs modèles d'IA générative d'images sur **plusieurs prompts simultanés**, afin d'identifier rapidement quel modèle interprète le mieux quel style de prompt — pour produire des **hero sections** de sites web.

Le produit n'est **pas** un éditeur d'image, ni une galerie cloud, ni un outil collaboratif. C'est un **banc d'essai créatif** : on tape, on compare, on garde ce qui plaît.

---

## 2. Problème adressé

- Chaque modèle (Nano Banana, Flux, GPT Image, SD…) a sa propre "grammaire" de prompt. Tester un prompt sur chacun manuellement est **lent, dispersé, coûteux**.
- Les interfaces grand public (AI Studio, ChatGPT, Midjourney) imposent **une plateforme = un modèle**.
- Les agrégateurs (OpenRouter, Fal.ai) donnent accès à plusieurs modèles, mais **pas d'UI de comparaison parallèle native**.
- Pour des hero sections, le **ratio**, l'**ambiance** et la **cohérence inter-itérations** comptent plus que la "perfection" technique.

---

## 3. Objectifs V1

### Objectif unique de succès
**Générer en parallèle N images (1 par couple `prompt × modèle`) sur les modèles sélectionnés, et les afficher correctement au fur et à mesure de leur arrivée (asynchrone).**

C'est le seul critère qui définit la réussite de la V1.

### Sous-objectifs implicites
- Aucune fuite de clé API côté frontend.
- L'utilisateur peut retrouver une session sauvegardée à tout moment.
- Coût par génération maîtrisé (estimation + compteur cumulé).

---

## 4. Périmètre V1

### 4.1 Inclus
- Saisie de **1 à 3 variantes de prompt** (champs A / B / C, B et C optionnels).
- Sélection multiple de **modèles** (groupés par source : OpenRouter / Fal.ai). Tous activés par défaut.
- Réglage de **ratio** global (1:1, 4:5, 2:3, 16:9, 21:9, ou "natif modèle").
- Bouton **Générer** → batch parallèle (concurrence limitée).
- **Estimation de coût** affichée avant validation, **confirmation** au-delà de 0,50 USD.
- Affichage **asynchrone progressif** : skeletons, puis images au fil de l'arrivée.
- Toggle **Grid / Flex** :
  - Grid : wrap libre.
  - Flex : colonnes = modèles, lignes = prompts.
- **Carte image** : image, nom modèle, seed (ou "—"), coût, boutons Détails / Sauvegarder.
- **Bouton Stop global** : annule les requêtes en vol.
- **Compteur de coût** : session + cumul mensuel (lu en DB).
- **Vue approfondie** (lecture seule) : prompt exact, seed, modèle, paramètres, coût, réponse brute, **relance possible sur ce modèle seul** (prompt éditable, seed verrouillable si supporté).
- **Lightbox** : zoom plein écran + comparateur 2-images côte à côte.
- **Sauvegarde manuelle** : par image ou par session entière → fichiers PNG + `manifest.json` dans un dossier choisi.
- **Galerie historique** : liste des sessions persistées en DB (toutes les générations sont en DB ; seuls les fichiers image dépendent du flag "saved").
- **Écran réglages** : saisie/modification des clés API (chiffrées via `safeStorage`), choix du dossier de sauvegarde par défaut, seuil de confirmation de coût.

### 4.2 Exclu (sprint futur ou jamais)
- ❌ **Édition d'image** (in-painting, masques, édition par instruction, référence de style, cohérence personnage) → **Sprint futur**.
- ❌ Multi-utilisateur, auth, comptes, sync cloud.
- ❌ Build packagé (`.exe` / `.dmg` / `.AppImage`) — usage local uniquement, lancement via `npm run dev` ou `npm run start`.
- ❌ Export PDF / Zip d'une session.
- ❌ Tags, favoris, notes sur images.
- ❌ Statistiques d'usage (modèle préféré, coût moyen, etc.).
- ❌ Réécriture automatique de prompt entre modèles (la divergence inter-modèle **est** le sujet de l'app).
- ❌ Injection automatique de mots-clés ("hero", "16:9", "stunning", "hyperrealistic"…).
- ❌ Retry automatique sur erreur API.
- ❌ Sauvegarde automatique des fichiers image (uniquement sur action explicite).
- ❌ Midjourney (pas d'API publique hobbyiste en 2026).

---

## 5. Utilisateur

| Champ | Valeur |
|---|---|
| **Persona** | Designer / dev solo qui crée des hero sections |
| **Compétences** | À l'aise avec une CLI, des clés API et le concept de "prompt engineering" |
| **Plateforme** | Windows 11 (dev local sur la machine de l'utilisateur) |
| **Volume d'usage** | ~10 à 50 sessions/mois, ~5 à 20 générations/session |
| **Budget mensuel API** | ~5 à 20 USD |

---

## 6. User Stories

### US-01 — Lancer une comparaison multi-modèles
> En tant qu'utilisateur, je saisis un prompt, je sélectionne 3 modèles, je clique Générer, et je vois 3 images apparaître progressivement dans une grille.

**Critères d'acceptation** :
- Les images apparaissent **dès qu'elles sont prêtes**, pas en bloc à la fin.
- Un skeleton est affiché par cellule en attente.
- Le coût estimé est affiché avant validation.
- Si une génération échoue, les autres continuent. La cellule en échec affiche l'erreur, pas un crash global.

### US-02 — Comparer 3 prompts sur 3 modèles (matrice 9 images)
> Je saisis 3 variantes de prompt, je sélectionne 3 modèles, je passe en vue Flex pour avoir une matrice claire.

**Critères d'acceptation** :
- Vue Flex : 3 colonnes (modèles), 3 lignes (prompts), alignement parfait.
- Toggle Grid ↔ Flex sans rechargement, conserve les images affichées.

### US-03 — Maîtriser les coûts
> Avant de cliquer Générer, je vois combien ça va me coûter. Si c'est > 0,50 USD, on me demande confirmation. Je peux Stop pendant le batch.

**Critères d'acceptation** :
- Estimation calculée avec marge ±10 % (basée sur le tarif unitaire × nombre d'images).
- Modal de confirmation au-delà du seuil (configurable).
- Bouton Stop annule les requêtes via `AbortController`. Les images déjà reçues restent affichées et facturées.
- Compteur cumulé du mois affiché en permanence.

### US-04 — Approfondir une image
> Je clique sur "Détails" d'une image qui me plaît. Je vois toutes ses méta. Je relance une variation sur ce seul modèle avec un prompt légèrement modifié.

**Critères d'acceptation** :
- La vue approfondie affiche : prompt exact, seed (ou "—"), modèle, ratio, coût, réponse brute (collapsible).
- Bouton "Relancer sur ce modèle" pré-remplit un formulaire éditable.
- Si le modèle supporte le seed, possibilité de le verrouiller pour la relance.

### US-05 — Sauvegarder et retrouver
> Je sauvegarde une session entière dans un dossier. Plus tard, je la retrouve dans la galerie de l'app.

**Critères d'acceptation** :
- Sauvegarde = fichiers `.png` + `manifest.json` dans `<dossier>/YYYY-MM-DD_HHmm_<slug>/`.
- Le `manifest.json` contient toutes les méta nécessaires pour rouvrir la session offline.
- La galerie liste les sessions persistées en DB (toutes), avec un badge "sauvegardée" si les fichiers sont sur disque.

### US-06 — Configurer les clés API
> Je saisis mes clés OpenRouter et Fal.ai dans les réglages. Elles sont chiffrées localement, jamais visibles en clair après saisie.

**Critères d'acceptation** :
- Champ de saisie masqué (type password).
- Stockage via `safeStorage` Electron.
- Bouton "Tester la clé" → ping minimal sur l'API du provider.
- Une clé manquante désactive visuellement les modèles correspondants dans le sélecteur.

---

## 7. Modèles cibles V1

Liste seedée en DB au premier lancement. Activable/désactivable par l'utilisateur dans les réglages.

| Modèle | Source | Tarif/image (~) | Seed |
|---|---|---|---|
| Gemini 3.1 Flash-Lite (Nano Banana 2 Lite) | OpenRouter | 0,005 € | ❌ |
| Gemini 3.1 Flash (Nano Banana 2) | OpenRouter | 0,03 € | ❌ |
| Gemini 3.1 Pro (Nano Banana Pro) | OpenRouter | 0,13 € | ❌ |
| GPT Image 1.5 | OpenRouter | 0,03 € | ❌ |
| Flux 1.1 Pro | Fal.ai | 0,04 € | ✅ |
| Flux 1.1 Schnell | Fal.ai | 0,01 € | ✅ |
| SD 3.5 Large | Fal.ai | 0,03 € | ✅ |

> Tarifs avril 2026, à re-vérifier avant tout choix structurant.

---

## 8. Flux utilisateur principal

```
[Lancement app]
      ↓
[Vérif clés API] ─── manquantes ──→ [Réglages] → retour
      ↓ OK
[Page Exploration]
      ↓
[Saisie prompt(s) + sélection modèles + ratio]
      ↓
[Clic "Générer"]
      ↓
[Modal estimation coût] ─── refus ──→ retour
      ↓ accepté
[Affichage skeletons + lancement batch parallèle]
      ↓
[Images arrivent progressivement] ←── Stop possible à tout moment
      ↓
[Toggle Grid/Flex] ──┐
[Lightbox / compare] │ (optionnels)
[Détails image]      │
[Sauvegarder session]┘
      ↓
[Page Galerie] ── revoir une session ──→ retour à Exploration
```

---

## 9. Contraintes non fonctionnelles

| Type | Exigence |
|---|---|
| **Sécurité** | Aucune clé API en clair côté frontend. `safeStorage` obligatoire. Aucune clé en DB. |
| **Performance** | Affichage asynchrone des images (pas d'attente du batch complet). Concurrence batch limitée à 3 requêtes simultanées par défaut (configurable). |
| **Robustesse** | Une génération en échec n'interrompt pas le batch. Erreur affichée localement sur la cellule. |
| **Persistance** | Métadonnées en DB (PostgreSQL). Fichiers image uniquement sur sauvegarde explicite. |
| **Maintenabilité** | Architecture par adapters → ajouter un nouveau modèle = un fichier + une entrée en DB, sans toucher à l'UI. |
| **Tests** | TDD sur la logique critique (adapters, costEstimator, batchOrchestrator). E2E Playwright sur le user flow principal. Voir CLAUDE.md §11. |

---

## 10. Design / UI

- **Thème** : sombre par défaut, ambiance digital/IA, **glassmorphisme** (cartes translucides, `backdrop-blur`, bordures subtiles 1px, accents néon discrets).
- **Densité** : modérée — la grille d'images doit respirer.
- **Tokens centralisés** dans `app/assets/css/tokens.css` (couleurs, blur, ombres, radius).
- **Pas d'animations gratuites** : transitions discrètes uniquement (apparition image, toggle de vue).
- **Pas de mode clair** en V1.

---

## 11. Architecture (résumé)

Voir CLAUDE.md pour le détail. Points clés :

- **Frontend** : Nuxt 3 (Vue 3 + Tailwind) embarqué dans Electron.
- **Backend** : Nitro server routes (HTTP) — pas d'IPC complexe.
- **DB** : PostgreSQL local (Docker) + Prisma.
- **Adapters providers** : un fichier par source (`openrouter.ts`, `fal.ts`), interface `ImageGenerator` commune.
- **Clés API** : `safeStorage` Electron, lues uniquement côté Nitro au moment de l'appel provider.

---

## 12. Risques & mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Tarifs API qui changent | Estimation faussée | Tarifs en DB (`Model.pricePerImage`), modifiables sans déploiement |
| Provider down ou rate-limit | Batch partiellement en échec | Échecs isolés par cellule, pas de retry auto, message clair |
| Clé API exposée par erreur | Sécurité | Lint rule + revue : aucun import de clé hors `server/` |
| Explosion stockage images | Espace disque | Pas de sauvegarde auto ; cache temporaire purgé à la fermeture |
| Coûts non maîtrisés | Budget | Estimation + seuil de confirmation + Stop + compteur cumulé |
| Dérive du scope V1 | Retard | Tout ce qui touche à l'édition d'image est explicitement repoussé au sprint futur |

---

## 13. Définition de "Done" pour la V1

La V1 est livrable quand **toutes** les conditions suivantes sont vraies :

- [ ] Les 6 user stories (US-01 à US-06) passent leurs critères d'acceptation.
- [ ] Le user flow principal est couvert par un test E2E Playwright vert.
- [ ] Les adapters OpenRouter et Fal.ai ont 100 % de couverture sur la logique de traduction request/response.
- [ ] `costEstimator` et `batchOrchestrator` ont 100 % de couverture.
- [ ] Aucune clé API n'apparaît dans les bundles frontend (vérifié par script CI).
- [ ] La structure de fichiers respecte CLAUDE.md §9.
- [ ] L'app démarre depuis zéro avec : `docker-compose up -d` + `npm install` + `npx prisma migrate dev` + `npm run dev`.
- [ ] Un README minimal documente ce setup.
