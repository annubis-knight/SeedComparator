---
doc: STORY
id: STORY-126
epic: EPIC-18
title: Persistance Generation.params + vue détail enrichie
slug: persistance-generation-params
status: done
priority: P1
requirements: [FR-084]
version: 1.0.0
last_updated: 2026-05-06
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# STORY-126 — Persistance Generation.params

## Analyse

Une fois STORY-121, 124 et 128 livrées, chaque génération est produite avec des params spécifiques (globaux + per-generation). Pour rendre cette information **rejouable** et **visible** dans la galerie/historique, on persiste ces params figés en DB.

Migration Prisma : ajout `Generation.params Json?` (nullable pour rétrocompat avec l'historique existant). Le champ stocke un objet plat `{ [paramKey]: resolvedValue }` qui inclut **tous** les paramètres ayant servi à produire l'image (defaults mergés avec overrides utilisateur, scope global ∪ per-generation, **après** validation Zod).

La vue détail (`pages/sessions/[id].vue` ou équivalent) affiche cet objet sous forme de liste lisible :
- Les params au défaut sont grisés.
- Les params modifiés sont mis en évidence.
- L'ensemble est exporté dans `manifest.json` lors d'une sauvegarde de session.

Le bouton "Relancer ce modèle" (STORY-051, in_progress dans EPIC-6) charge ces params dans le panneau global + per-generation pour permettre à l'utilisateur d'ajuster avant de relancer.

**Risques** :
- Migration : les générations existantes (DB déjà peuplée) auront `params: null`. On gère ce cas dans la vue détail (afficher "Paramètres non disponibles pour cette génération antérieure").
- Le `manifest.json` actuel ne porte pas les params — on étend son schéma sans casser les sessions exportées avant l'épique.

**Inconnues** :
- Vérifier la structure exacte de `manifest.json` (déjà géré par STORY-062 ?). Lire le code avant.

## Critères d'acceptation

| Critère | FR |
|---|---|
| Migration Prisma `add_generation_params` ajoute `Generation.params Json?` | FR-084 |
| `batchOrchestrator` calcule l'objet `params` final (defaults ⊕ overrides global ⊕ overrides per-gen) et le passe à la création de la `Generation` en DB | FR-084 |
| `GenerationDTO` est étendu avec `params: Record<string, unknown> \| null` | FR-084 |
| La vue détail (`pages/sessions/[id].vue`) liste les params utilisés sous chaque génération, distinguant visuellement les défauts vs modifications | FR-084 |
| Le `manifest.json` exporté lors de la sauvegarde d'une session contient pour chaque génération un champ `params` | FR-084 |
| Le bouton "Relancer ce modèle" pré-remplit le panneau global et le panneau per-generation avec les params de la génération source | FR-084 |
| Les générations antérieures à la migration (`params: null`) affichent "Paramètres non disponibles" sans casser la vue | FR-084 |
| Tests integration : POST /api/generate avec overrides → la `Generation` créée a `params` correctement peuplé | FR-084 |
| Test E2E manuel : générer avec overrides, ouvrir vue détail, vérifier la liste, sauvegarder, vérifier le manifest exporté | FR-084 |

## Tâches techniques

1. Migration Prisma + regen du client.
2. Mise à jour de `server/api/generate.post.ts` et `batchOrchestrator` pour figer les params.
3. Étendre `GenerationDTO` (shared/contracts.ts) + adapter le mapping en sortie.
4. UI vue détail : nouveau composant `GenerationParamsSummary.vue` qui prend `params + paramFields` et liste lisiblement.
5. Étendre `manifest.json` (schéma documenté dans `imageCache.ts` ou équivalent) — versionner si besoin.
6. Refacto bouton "Relancer ce modèle" : injecter les params source dans les composables.
7. Tests integration.

## Notes d'implémentation

- L'objet `params` en DB est **figé** : si demain on change un default dans `paramTraits.ts`, les anciennes générations ne sont pas affectées.
- Pour les manifests : on bump leur `version` à `2.0` pour signaler qu'ils incluent désormais les params. La lecture reste compatible avec `1.x` (champ optionnel).
- L'affichage des params modifiés vs défaut nécessite le `paramFields` du modèle au moment **actuel**. Si le modèle a évolué (un trait a été retiré), on liste quand même la valeur figée avec mention "paramètre obsolète".
