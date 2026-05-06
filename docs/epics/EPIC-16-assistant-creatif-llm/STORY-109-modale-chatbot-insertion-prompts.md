---
doc: STORY
id: STORY-109
epic: EPIC-16
title: Modale chatbot par phase + insertion blocs prompt dans A/B/C
slug: modale-chatbot-insertion-prompts
status: proposed
priority: P2
requirements: [FR-073]
version: 1.0.0
last_updated: 2026-05-05
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# STORY-109 — Modale chatbot par phase + insertion blocs prompt

## Analyse

Interface utilisateur du chatbot : une modale s'ouvre depuis un bouton "✨ Assistant" placé dans le container de prompts (proche des tabs A/B/C, lié à la phase active). La modale affiche un historique de conversation, un champ de saisie, et détecte automatiquement les blocs ` ```prompt … ``` ` dans les réponses pour afficher un bouton "Insérer dans A / B / C".

La conversation est rechargée depuis DB (`HelperConversation`) si elle existe pour la session × phase active.

**Risques** :
- Le parsing des blocs `prompt` dans le Markdown de la réponse doit être robuste (le LLM peut avoir des variations dans la syntaxe).
- "Insérer dans A/B/C" doit communiquer avec `PromptInputs` / `useActiveSession` sans couplage fort — utiliser un événement Pinia ou un composable partagé.

## Critères d'acceptation

| Critère | FR |
|---|---|
| Bouton "✨ Assistant" visible dans le container de prompts, à proximité des tabs A/B/C | FR-073 |
| Cliquer ouvre une modale avec l'historique de conversation de la phase active | FR-073 |
| L'utilisateur saisit en français, l'assistant répond en français | FR-073 |
| Les blocs ` ```prompt … ``` ` dans les réponses affichent un bouton "Insérer dans A / B / C" | FR-073 |
| Cliquer "Insérer dans X" remplace le contenu du prompt X (A, B, ou C) de la phase active | FR-073 |
| La conversation est persistée par session × phase (rechargée si on revient sur la même phase) | FR-073 |
| La modale se ferme via Echap ou bouton ✕ | FR-073 |

## Tâches techniques

1. **`useHelperChat.ts`** : composable — charge/sauvegarde la conversation, appelle `$fetch('/api/helper/chat')`, expose `messages`, `send(text)`, `isLoading`.
2. **`PromptBlockParser.ts`** (util) : fonction pure qui extrait les blocs `\`\`\`prompt … \`\`\`` d'une string Markdown et retourne `[{ content, startIndex, endIndex }]`.
3. **`HelperMessage.vue`** : composant affichant un message (role user/assistant) avec rendu des blocs prompt (boutons A/B/C).
4. **`HelperModal.vue`** : modale complète — liste `HelperMessage`, input, bouton envoi, gestion loading/erreur.
5. **Bouton déclencheur** : dans `PromptInputs.vue` ou son composant parent, ajouter le bouton "✨ Assistant" qui émet un event ou toggle un état Pinia.
6. **Insertion** : `useHelperChat.ts` expose `insertIntoPrompt(variant: 'a'|'b'|'c', content: string)` qui appelle `useActiveSession.setPrompt(phase, variant, content)`.
7. **Tests** :
   - `PromptBlockParser.test.ts` : détecte 0/1/N blocs, balises mal formées ignorées, contenu extrait exact. `// @requirement: FR-073`
   - `HelperModal.test.ts` : affichage messages, boutons A/B/C sur blocs prompt, fermeture Echap, loading state. `// @requirement: FR-073`
   - `useHelperChat.test.ts` : send → call API, messages accumulés, insertion dans prompt, chargement depuis DB. `// @requirement: FR-073`

## Self-review checklist

- [ ] `PromptBlockParser` est une fonction pure testée indépendamment.
- [ ] L'insertion dans le prompt ne bypass pas `useActiveSession` (pas d'accès direct au DOM).
- [ ] La modale ne bloque pas le scroll du fond.
- [ ] Aucun appel `$fetch` dans un composant Vue (tout passe par `useHelperChat`).
