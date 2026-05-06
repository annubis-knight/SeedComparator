---
doc: STORY
id: STORY-122
epic: EPIC-18
title: Composants Vue atomiques de paramètres (sliders, segmented, toggle…)
slug: composants-vue-atomiques
status: done
priority: P1
requirements: [FR-080]
version: 1.0.0
last_updated: 2026-05-06
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# STORY-122 — Composants Vue atomiques de paramètres

## Analyse

Le panneau dynamique (STORY-124) consomme une liste de `ParamFieldMeta` et doit, pour chaque champ, instancier le bon contrôle UI. On crée 9 composants atomiques alignés sur les conventions des playgrounds officiels :

| `kind` | Composant | Inspiration |
|---|---|---|
| `slider-continuous` | `ParamSliderContinuous.vue` | OpenAI Playground (température), Fal (guidance) |
| `slider-stepped` | `ParamSliderStepped.vue` | Fal (steps avec encoches) |
| `segmented` | `ParamSegmented.vue` | Google AI Studio (aspect ratio), Fal (safety_tolerance 1–6) |
| `select` | `ParamSelect.vue` | OpenAI (size dropdown) |
| `radio` | `ParamRadio.vue` | OpenAI Playground (vivid/natural) |
| `toggle` | `ParamToggle.vue` | switch iOS-like |
| `number-with-random` | `ParamSeedInput.vue` | Fal/Replicate (input + dé 🎲) |
| `textarea` | `ParamTextarea.vue` | auto-grow |
| `number` | `ParamNumberSpinner.vue` | input + ▲▼ |

Tous partagent un wrapper commun `ParamRow.vue` : `[Label] [info i] ........ [contrôle] [valeur]`. Le composant `InfoTooltip` arrive via STORY-123 — STORY-122 le mocke via un slot ou un placeholder pour ne pas bloquer le développement parallèle.

**Risques** :
- Cohérence visuelle avec le design system glassmorphique existant — réutiliser `tokens.css`, `GlassCard`, `AppButton` quand pertinent.
- Accessibilité clavier : sliders et segmented contrôles doivent répondre à ←/→, Tab, Enter, Esc.
- Le slider "à crans" ne doit pas être un `<input type="range">` standard avec encoches CSS — pour avoir un vrai snap clavier, on construit notre propre composant ou on s'appuie sur `step` natif.

**Inconnues** :
- Décider si on utilise un wrapper Vue existant (Headless UI, Radix Vue) ou si on code à la main. Décision : à la main, on a peu de besoins, le design system est custom.

## Critères d'acceptation

| Critère | FR |
|---|---|
| Les 9 composants existent dans `app/components/params/` et exportent une interface props uniforme `{ field: ParamFieldMeta, modelValue, onUpdate }` | FR-080 |
| `ParamRow.vue` (wrapper) affiche label + slot tooltip + slot contrôle + valeur courante à droite | FR-080 |
| `ParamSliderContinuous` : track, handle déplaçable souris + clavier (←/→/PageUp/PageDown), affichage de la valeur live, snap au `step` du field | FR-080 |
| `ParamSliderStepped` : même comportement mais avec encoches visibles à chaque step entier | FR-080 |
| `ParamSegmented` : pills connectés, focus visible, sélection clavier (←/→ et Home/End) | FR-080 |
| `ParamSelect` : panel custom (pas le `<select>` natif), navigation clavier (↑↓, Enter, Esc), fermeture au clic extérieur | FR-080 |
| `ParamRadio` : groupe radio accessible, labels cliquables, sélection clavier | FR-080 |
| `ParamToggle` : switch iOS-like, état focus visible, espace/entrée pour basculer | FR-080 |
| `ParamSeedInput` : `<input type="number">` + bouton "🎲 Random" qui régénère une seed entre 0 et 2^31-1, + bouton "✕" pour reset à null | FR-080 |
| `ParamTextarea` : auto-grow (max 6 lignes), placeholder issu du tooltip, compteur de caractères si `maxLength` | FR-080 |
| `ParamNumberSpinner` : input + ▲▼, respect min/max/step | FR-080 |
| Tous les composants supportent `disabled` (grisé, non-interactif) | FR-080 |
| Tests composants Vue Test Utils : rendu de chaque kind, émission de `update:modelValue` au bon moment, comportement clavier (au moins sur slider et segmented) | FR-080 |
| Une page de démo `/dev/params` (uniquement en dev) liste les 9 composants avec valeurs d'exemple — pour pouvoir QA visuellement sans avoir à orchestrer tout l'épique | FR-080 |

## Tâches techniques

1. Créer `app/components/params/` + `ParamRow.vue` racine.
2. Implémenter chaque composant avec son test associé (Vue Test Utils). Order conseillé : Toggle → Segmented → Radio → Select → SliderContinuous → SliderStepped → SeedInput → Textarea → NumberSpinner.
3. Créer la page `/dev/params` qui consomme tous les composants avec des `field` exemples. Page non liée à la nav publique.
4. Tokens : si un nouveau token est nécessaire (ex : couleur d'un track de slider), l'ajouter à `app/assets/css/tokens.css`.

## Notes d'implémentation

- Tous les composants émettent `update:modelValue` avec le type attendu par le `ParamFieldMeta` (number, string, boolean…). Pas de chaîne pour un nombre.
- Pas de logique de validation côté composant (la validation Zod est server-side, STORY-120). Le composant doit cependant clamper visuellement (un slider 1–20 ne doit pas afficher 21 même si on lui passe `modelValue=21`).
- Le tooltip vit dans `ParamRow` via un slot — STORY-123 le remplit. En attendant, on met un placeholder `<span class="text-text-dim">i</span>`.
