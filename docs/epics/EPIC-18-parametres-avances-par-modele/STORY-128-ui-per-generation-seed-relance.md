---
doc: STORY
id: STORY-128
epic: EPIC-18
title: UI per-generation — seed sur carte + relance avec seed verrouillée + image de référence
slug: ui-per-generation-seed-relance
status: done
priority: P1
requirements: [FR-078, FR-085]
version: 1.0.0
last_updated: 2026-05-06
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# STORY-128 — UI per-generation : seed + référence

## Analyse

Les paramètres `scope: 'per-generation'` (`seed`, `falImageUrl`, `falImagePromptStrength`) ne peuvent **pas** vivre dans le panneau global : leur valeur est intimement liée à une instance précise (modèle × prompt × run). La seed 42 sur Flux ne donne pas la même image que la seed 42 sur SD ; on veut verrouiller la seed **de l'image qu'on a aimée** pour itérer.

L'UI se découpe en 3 endroits :

### A. Sur la carte de génération (`GenerationCard.vue`)

- Affichage discret de la seed produite (badge "seed: 12345" cliquable pour copier).
- Si le modèle ne supporte pas la seed → "—" (déjà le cas aujourd'hui).
- Bouton "🔒" pour verrouiller la seed pour la prochaine génération de **ce modèle uniquement**. Cliquer une 2e fois la déverrouille.

### B. Dans la vue détail (relance d'un modèle unique — STORY-051)

- Champ "Seed" éditable (avec dé "Random" + ✕ pour reset).
- Si le modèle expose `falImageUrl` (Flux Pro Ultra) : champ d'upload d'image de référence + slider `image_prompt_strength`.
- Bouton "Relancer" qui crée une nouvelle génération avec le prompt actuel + ces params per-generation.

### C. Composable `usePerGenerationParams`

Map `Record<modelId × promptIdx, { seed?, referenceImage?, ... }>`. Vide au démarrage d'une session. Rempli au fur et à mesure que l'utilisateur verrouille une seed ou uploade une référence. Envoyé au serveur dans `GenerateRequest.perGenerationParams`.

**Risques** :
- L'upload d'image de référence demande un endpoint `/api/upload` ou un base64 inline. Décision préliminaire : base64 inline (cohérent avec l'absence d'API d'asset dans le projet, taille raisonnable pour une référence).
- Le verrouillage de seed sur la carte doit être visuellement clair sans bruit — un cadenas 🔒 grisé / coloré selon état.

**Inconnues** :
- Vérifier que `Flux Pro Ultra` est bien le seul modèle V1 qui supporte `image_url` pour la référence (Flux Pro v1.1 standard via Fal aussi ?). Au pire on étend après. SD 3.5 supporte aussi via `controlnet`/`ip_adapter` mais c'est hors scope (édition d'image, post-V1).

## Critères d'acceptation

| Critère | FR |
|---|---|
| `GenerationCard.vue` affiche un badge `seed: <value>` cliquable (copie au presse-papier) quand la génération a une seed | FR-085 |
| Un bouton 🔒 sur la carte permet de verrouiller la seed pour les prochaines générations du même modèle ; un 2e clic déverrouille | FR-085 |
| Un indicateur visuel global (par exemple un cadre teinté sur la carte du modèle dans `ModelSelector`) signale qu'une seed est verrouillée pour ce modèle | FR-085 |
| La vue détail expose un champ "Seed" éditable (composant `ParamSeedInput` de STORY-122) | FR-085 |
| Pour Flux Pro Ultra (modèles dont le profil contient le trait `falImageUrl`) : la vue détail expose un champ d'upload d'image (base64 inline) + un slider `image_prompt_strength` | FR-085 |
| Le bouton "Relancer ce modèle" envoie ces params dans `perGenerationParams[modelId × promptIdx]` | FR-085 |
| `GET /api/models` est étendu : chaque modèle expose désormais aussi ses `paramFields` `scope: 'per-generation'` (en sus du global) — séparés via un champ `scope` dans `ParamFieldMeta` | FR-085 |
| Le composable `usePerGenerationParams` est créé et géré côté `useGenerationSession` | FR-085 |
| Le contrat `GenerateRequest` accepte `perGenerationParams: Record<string, Record<string, unknown>>` (clé = `${modelId}::${promptIdx}`) | FR-085 |
| Tests composant : verrouillage seed sur la carte, propagation au composable, envoi correct au serveur | FR-085 |
| Test E2E manuel : générer avec Flux Pro, verrouiller la seed, relancer le **même** prompt sur le **même** modèle → image très proche (preuve que la seed a bien été transmise) | FR-085 |

## Tâches techniques

1. Étendre `ParamFieldMeta` avec `scope: 'global' | 'per-generation'` (déjà préparé en STORY-120).
2. Étendre `GET /api/models` pour exposer les deux scopes (le frontend filtre selon le contexte).
3. Créer `usePerGenerationParams` (composable).
4. Étendre `GenerationCard.vue` : badge seed + bouton 🔒.
5. Étendre la vue détail : champ seed + (si applicable) champ upload référence.
6. Étendre `GenerateRequest` (Zod) côté `shared/contracts.ts`.
7. Mise à jour `server/api/generate.post.ts` + `batchOrchestrator` pour transmettre `perGenerationParams` aux adapters.
8. Tests composant + integration.

## Notes d'implémentation

- L'image de référence est inline base64 dans la requête (max ~5 MB). Pas d'upload séparé.
- Le verrouillage de seed est **éphémère** : pas persisté en DB, vit dans le composable de session. Si l'utilisateur ferme la session, il est perdu (cohérent avec la philosophie "outil d'exploration", pas "outil de production").
- Si une génération antérieure (vue dans la galerie historique) a une seed sauvée dans `Generation.params`, la cliquer ouvre la vue détail pré-remplie — STORY-126 fournit cette donnée.
