---
doc: PROMPT_VOCABULARY_SOURCES
version: 1.1.0
last_updated: 2026-05-06
consultation_date: 2026-04-29
maintains: server/data/prompt-vocabulary.json
---

# Sources du vocabulaire de prompt engineering

Ce document liste les sources consultées pour construire la banque de termes utilisée par le **Brief Assistant** (`server/data/prompt-vocabulary.json`). Le vocabulaire est injecté dans le system prompt envoyé à Claude Haiku 4.5 lors de la génération des 3 variantes de prompt image.

## ⚠️ Avertissement de fraîcheur

L'efficacité d'un terme dépend du **modèle cible** et de **la version du modèle**. Certains termes (`masterpiece`, `best quality`, `8k`) très utilisés en 2022-2023 sur Stable Diffusion 1.5 sont **devenus du bruit ou contre-productifs** sur les modèles récents (Flux, Imagen 4) qui ont des architectures de tokenisation différentes.

**Date de consultation des sources : 2026-04-29.**

Re-vérifier ce fichier annuellement (au moins) avant tout ajout massif au vocabulaire.

## Sources primaires

### Midjourney V7 (avril 2025)

- [Prompt Basics — Midjourney Docs](https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics) — guide officiel structurant : sujet, ambiance, framing, lumière.
- [Style Reference — Midjourney Docs](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference) — paramètres `--sref`, `--exp`, `--stylize`, `--chaos`, `--weird`.
- [Midjourney V7 Prompts and Styles Guide (PDF, 2025)](https://skillupexchange.com/wp-content/uploads/2025/06/Midjourney-v7-Prompts-and-Styles-Guide.pdf) — guide pratique communautaire.
- [The Complete Guide to Crafting Professional Midjourney Photography Prompts](https://medium.com/@robertgo8/the-complete-guide-to-crafting-professional-midjourney-photography-prompts-e16c413c07d5) — vocabulaire photo détaillé.
- [Midjourney Parameter Cheat Sheet V7](https://runtheprompts.com/resources/midjourney-info/midjourney-parameter-cheat-sheet-v7/) — référence paramètres techniques.

**Recommandations clés retenues** :
- Préférer **descriptions courtes et précises** sur Midjourney (50-150 mots).
- Spécifier explicitement **lighting**, **composition**, **medium/lens**, **style**.
- Éviter les sur-modifiers ambigus ("masterpiece", "trending on artstation") — peu d'effet sur V6+.

### Black Forest Labs Flux.1 (2024-2025)

- [Black Forest Labs Skills (GitHub repo officiel)](https://github.com/black-forest-labs/skills) — pratiques officielles `flux-best-practices`.
- [FLUX.1 Prompting Guide — getimg.ai](https://getimg.ai/blog/flux-1-prompt-guide-pro-tips-and-common-mistakes-to-avoid) — formula validée par tests.
- [Prompting Guide Image-to-Image — Black Forest Labs Docs](https://docs.bfl.ml/guides/prompting_guide_kontext_i2i) — directives techniques officielles.
- [flux-best-practices (Skills marketplace)](https://lobehub.com/skills/black-forest-labs-skills-flux-best-practices) — version structurée du guide officiel.

**Recommandations clés retenues** :
- Formula officielle : `[Subject] + [Action/Pose] + [Style/Medium] + [Context/Setting] + [Lighting] + [Camera/Technical]`.
- **Langage naturel** > liste de tags pour Flux dev/pro.
- **Pas de prompt weights** sur Flux dev/schnell (utiliser `with emphasis on...` à la place).
- **Pas de negative prompts** côté Flux.
- Spécifier **pellicule/objectif** pour photoréalisme : `shot on iPhone 16`, `35mm f/1.4`, `Kodak Portra 400`.
- Utiliser **#RRGGBB hex** pour couleurs précises de marque.

### Google Imagen 4 (2025)

- [Vertex AI — Prompt and image attribute guide (Google Cloud Docs)](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide) — guide officiel.
- [Generate images using Imagen — Gemini API](https://ai.google.dev/gemini-api/docs/imagen) — référence API.
- [Ultimate Imagen 4 Prompting Guide (Atlabs AI, 2025)](https://www.atlabs.ai/blog/imagen-4-prompting-guide) — best practices testées.
- [Imagen 4 Complete Prompt Guide](https://gpt4oimageprompt.com/pages/blog/imagen-4-complete-prompt-guide.html) — référence détaillée.

**Recommandations clés retenues** :
- Commencer par **"A photo of..."** ou **"An illustration of..."** pour ancrer le médium dès le début.
- Imagen 4 répond **très bien** au vocabulaire technique photo (lentilles, ouvertures, lumière).
- Capacité forte à **générer du texte intégré** (posters, signage) — utile pour hero sections avec typo intégrée.
- **Itération** : commencer 50 mots, puis enrichir 100-200 mots.

### OpenAI DALL-E 3 / GPT Image 1.5 (2024-2026)

- [DALL·E 3 Prompt Guide 2026](https://www.imagetoprompt.dev/blog/dall-e-3-prompt-guide/) — guide à jour 2026.
- [DALLE3 and gpt-image-1 Prompt Tips and Tricks Thread (OpenAI Community)](https://community.openai.com/t/dalle3-and-gpt-image-1-prompt-tips-and-tricks-thread/498040) — fil officiel OpenAI dev community.
- [DALL-E Prompt Writing Best Practices (Foundation Inc.)](https://foundationinc.co/lab/dall-e-prompts/) — guide synthétique.
- [Mastering DALL·E 3 Guide (Vife.ai)](https://vife.ai/blog/mastering-dall-e-3-guide-openai-image-generation) — référence pratique.

**Recommandations clés retenues** :
- DALL-E 3 et GPT Image **réécrivent le prompt en interne** (system prompt OpenAI) — ne pas micro-tuner.
- Privilégier **descriptions concrètes** plutôt que "photorealistic" seul.
- Vocabulaire **caméra et cinéma** très efficace : `shot on 50mm`, `shallow DoF`, `cinematic composition`, `golden hour backlight`.
- **Pas de negative prompts** (DALL-E les transforme parfois en présence de l'élément).

### Styles UI/UX web et typographie web (catégories `web_design_styles` + `typography_styles`)

Ces 2 catégories ont été ajoutées en v1.1.0 (avril 2026) suite à un retour utilisateur orienté outil d'inspiration design web. Sources :

- [Awwwards — Sites of the Year](https://www.awwwards.com/) — référence des tendances design web haut de gamme.
- [Land-book](https://land-book.com/) — galerie de landing pages contemporaines.
- [Httpster](https://httpster.net/) — sites éditoriaux et expérimentaux.
- [Godly](https://godly.website/) — galerie de sites design.
- [Klim Type Foundry blog](https://klim.co.nz/) et [Pangram Pangram blog](https://pangrampangram.com/) — vocabulaire typographique contemporain.
- Connaissance générale du domaine (mouvements design web 2020-2026 : neo-brutalism, glassmorphism, bento grids, oversized type, etc.).

Les termes ont été choisis pour leur **reconnaissance dans les guides MJ V7 / Imagen 4 / Flux** (testés via lexica.com et prompthero pour validation) et leur **présence dans les galeries design web 2024-2026**.

## Sources spécialisées

### Lighting cinématographique

- [Basics of Film Lighting — Studio Binder](https://www.studiobinder.com/blog/basics-of-film-lighting-techniques/) — référence éducative film lighting (Roger Deakins, 4 qualités de lumière).
- [Rembrandt Lighting (Wikipedia)](https://en.wikipedia.org/wiki/Rembrandt_lighting) — référence académique.
- [Low-key Lighting (Wikipedia)](https://en.wikipedia.org/wiki/Low-key_lighting) — référence académique.
- [Lighting Like Rembrandt — Bold Entrance](https://boldentrance.com/lighting-like-rembrandt-how-to-create-dramatic-lighting-through-cinematic-chiaroscuro/) — chiaroscuro appliqué cinéma.
- [Film Lighting 101 — Peek At This (2026)](https://peekatthis.com/film-lighting-guide-beginners-to-understand/) — guide à jour 2026.

### Mouvements artistiques (Bauhaus, Art Deco, etc.)

- [144 Bauhaus Prompts — Tory Barber](https://torybarber.com/ai-prompt-inspiration-bauhaus/) — collection éprouvée.
- [Art Deco Style Guide AI — Tory Barber](https://torybarber.com/ai-style-guide-art-deco/) — collection éprouvée.
- [Bauhaus Midjourney Style — Midlibrary (Andrei Kovalev)](https://midlibrary.io/styles/bauhaus) — référence stylistique testée.
- [How to Write Better AI Image Prompts (PromptIt, 2026)](https://promptitin.com/blog/how-to-write-ai-image-prompts) — synthèse multi-mouvements.

### Vocabulaire général prompt engineering

- [The Complete Guide to Midjourney Prompting Frameworks](https://geekycuriosity.substack.com/p/the-complete-guide-to-midjourney-585) — synthèse des frameworks 2025.
- [How to come up with good prompts for Stable Diffusion — Stable Diffusion Art](https://stable-diffusion-art.com/how-to-come-up-with-good-prompts-for-ai-image-generation/) — référence communautaire éprouvée.
- [50 Prompt Keywords for MidJourney and Stable Diffusion](https://medium.com/artificial-lexicon/i-made-a-list-of-50-prompt-keywords-for-midjourney-and-stable-diffusion-in-ai-art-190d8fe345a9) — sélection ciblée.

## Termes que j'ai volontairement EXCLUS

### Bruit déclassé sur modèles récents

- `masterpiece`, `best quality`, `award-winning`, `trending on artstation`, `8k`, `4k ultra HD` : peu/pas d'effet sur Flux 1.x, Imagen 4, GPT Image 1.5. Toujours acceptables sur SD 1.5 / SDXL legacy mais redondants si la description technique est précise.
- `hyperrealistic` seul : à proscrire selon les guides DALL-E 3 et Imagen 4 — préférer des détails concrets (`shot on 85mm f/1.4`, `crisp shadows`, `subsurface scattering on skin`).

### Termes sensibles ou inappropriés

Aucun nom de personne vivante, aucune référence à des œuvres protégées récentes (films post-2000 spécifiques, artistes vivants identifiables). Les références aux artistes morts depuis >70 ans (Mucha, Hokusai, Vermeer) ou aux mouvements (Bauhaus, Mid-century) sont acceptables.

## Méthodologie de constitution

1. Recherche web ciblée sur 4 modèles principaux (MJ V7, Flux, Imagen 4, GPT Image) — sources officielles ou doc validée par les éditeurs.
2. Croisement avec sources spécialisées par catégorie (lighting cinéma, art movements).
3. Filtrage : **on retient les termes qui apparaissent dans ≥2 sources indépendantes** ou qui sont mentionnés explicitement dans une doc officielle.
4. Catégorisation en 11 groupes (cf. JSON).
5. **Pas d'inflation artificielle** : ~250 termes, pas 500+. Préférer la qualité à la quantité.

## Maintenance

- **Re-vérifier annuellement** au minimum (avril 2027 pour la prochaine passe).
- Ajouter de nouvelles entrées via PR avec source citée.
- Si un terme s'avère contre-productif sur un modèle (test empirique), l'annoter dans la note `notes` du JSON ou le retirer.

---

## v1.2.0 — Apprentissages prompt morphing (STORY-112, 2026-05-06)

### Contexte

Suite à un échange utilisateur exporté dans `gemini-conversation-2026-05-06-13-07-46.md` (à la racine du repo), 5 enseignements ont été intégrés au vocabulaire et aux system prompts. Cette source est **secondaire** (conversation Gemini, pas une doc officielle de modèle d'image), donc on l'a utilisée comme **inspiration méthodologique** plutôt que comme référence de termes techniques validés.

### Apprentissages retenus

1. **Pont sémantique valeurs → visuel** : les modèles d'image ne comprennent pas les valeurs abstraites ("confiance", "innovation"). Sans guidance, les LLMs générateurs de prompts tombent dans le **cliché statistique** (cadenas pour la sécurité, etc.). Solution : précharger le LLM avec une bibliothèque de correspondances valeur→visuel (formes, lumière, matières, palettes).
2. **Anti-patterns de layout** : ajouter du vocabulaire qui force le modèle à dévier des templates web statistiques (`broken grid`, `radical asymmetry`, `overlapping placeholder blocks`, `editorial avant-garde`).
3. **Collisions conceptuelles** : couples improbables (`zen garden × futuristic glass`, `brutalist concrete × delicate serif`) injectables tels quels en cas d'absence d'idée — l'IA fait l'hybridation à l'intersection.
4. **Affinité par phase** : les termes ne sont pas pertinents pour toutes les phases (`top-heavy composition` → wireframe + uiux ; `Kodak Portra 400` → mood + uiux). Méta `_phaseAffinity` exposée au LLM consommateur.
5. **Composition top-heavy + fade bas** : invariant pour le format hero qui doit ménager l'espace sous la section pour la suite de page.

### Apprentissages **non** retenus (hors scope du projet)

- **Paramètres modèle-spécifiques** : `--chaos`, `--stylize`, `--ar`, `--v`, `--iw`, pondération `::` (Midjourney), `(word:1.4)` (Stable Diffusion). Le projet vise la neutralité multi-modèles.
- **Image-to-image / outpainting / pan / ControlNet** : l'app ne supporte pas l'image de référence dans les prompts. Tout ce qui suppose `[Lien Image]` ou un workflow itératif image→prompt a été écarté.
- **Variables / placeholders** : pas de `[Industrie]`, `[Valeur]` dans les prompts. Les prompts générés doivent être autonomes et utilisables tels quels.

### Changements vocabulaire v1.1.0 → v1.2.0

| Champ | v1.1.0 | v1.2.0 |
|---|---|---|
| Total termes | 318 | 472 |
| Catégories | 13 (à plat) | 17 (regroupées en 8 groupes thématiques) |
| Méta par catégorie | `_description`, `terms` | + `_group`, `_subgroup`, `_phaseAffinity` |
| Méta racine | `_meta` | + `_meta.groups` (map id→label des 8 groupes) |
| Nouvelles catégories | — | `web_layout_principles`, `anti_pattern_layout`, `conceptual_collisions`, `brand_values_visual_translation` |
| Termes ajoutés à des catégories existantes | — | `mood_atmosphere` (+7), `textures_materials` (+6) |

### Source

- Conversation utilisateur ↔ Gemini (export 2026-05-06) : `gemini-conversation-2026-05-06-13-07-46.md` (racine du repo). Inspiration méthodologique uniquement — les termes techniques restent issus des sources primaires v1.1.0 (MJ V7, Flux, Imagen 4, GPT Image).
