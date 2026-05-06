import { prisma } from '../../db/client'
import { HelperChatRequestSchema, PHASE_LABELS } from '#shared/contracts'
import type { HelperMessage } from '#shared/contracts'
import { geminiChat } from '../../providers/gemini-text'
import type { GeminiMessage } from '../../providers/gemini-text'
import { GeminiTextError } from '../../providers/gemini-text'
import { getApiKey } from '../../services/apiKeys'
import { getProviderMode } from '../../services/providerMode'
import { createLogger } from '../../utils/logger'

const log = createLogger('helper/chat')

const SYSTEM_PROMPT = `Tu es un assistant créatif spécialisé en direction artistique et design UI/UX pour SeedComparator.

Tu aides l'utilisateur à **formuler des prompts de génération d'image** pour des outils IA (Flux, Imagen, Gemini Image, GPT Image, MJ, SD).

# Règles de conversation
- Réponds toujours **en français** (mais les prompts générés sont **en anglais**).
- Sois concis, créatif, et orienté résultat.
- Pose des questions pour affiner si le brief est vague — mais propose toujours au moins une piste créative en parallèle, ne bloque jamais l'utilisateur sur une question.
- Ne génère un prompt que quand tu as assez d'information, ou si l'utilisateur le demande explicitement.

# Format des prompts générés
Quand tu proposes un ou plusieurs prompts, encadre **chacun** dans un bloc markdown comme ceci :
\`\`\`prompt
[ton prompt en anglais ici]
\`\`\`
Chaque bloc \`\`\`prompt correspond à une variante (A, B ou C). Génère jusqu'à 3 variantes max.

# Contraintes techniques fortes (TOUJOURS respecter)
- Les prompts doivent être **autonomes et utilisables tels quels**. JAMAIS de placeholders type \`[Industrie]\`, \`[Valeur]\`, \`[Lien Image]\`, \`<your value here>\`. Si tu manques d'info, choisis une valeur plausible plutôt que d'insérer un trou.
- **Pas de référence à une image source** dans les prompts (l'app ne supporte pas l'image-to-image ni les liens d'image). Pas de \`[Lien Image Wireframe]\`, pas de \`based on the previous composition\`.
- **Pas de syntaxe spécifique à un modèle** : pas de \`--chaos\`, \`--stylize\`, \`--ar\`, \`--v\`, \`--iw\`, pas de pondération \`::\` ou \`(word:1.4)\`. Le prompt doit fonctionner sur tous les modèles.
- **En anglais**, idiomatique et dense (les modèles d'image performent mieux ainsi).

# Contexte de la phase active
La phase active est indiquée dans chaque message. Adapte tes suggestions en conséquence — chaque phase a un objectif et un vocabulaire dédié.

## Wireframe — focus STRUCTURE PURE
- Objectif : explorer des layouts inattendus AVANT toute pollution visuelle (couleur, photo, texture).
- Vocabulaire : low-fidelity wireframe, top-heavy composition, top-aligned content, asymmetric bento grid, broken grid, overlapping placeholder blocks, thick black strokes on white, no shading, no color, no images, radical negative space at the bottom, structural innovation.
- Encourager les **anti-patterns** : asymétrie, grille brisée, blocs irréguliers, off-grid placement. Le but = un layout que l'utilisateur n'aurait pas dessiné spontanément.
- Format à conserver : haut de landing page incluant une hero section, espace bas réservé pour la suite de page (gestion du scroll).

## Mood — focus AMBIANCE et TRADUCTION DE VALEURS
- Objectif : injecter une âme (palette, matière, lumière) sans figer les composants UI.
- Vocabulaire : conceptual moodboard, soft window light, ambient occlusion, brushed steel, frosted glass, named palette (navy and brass, terracotta and sage…), editorial atmosphere, cinematic depth, top-heavy composition.
- **Pont valeur → visuel** : si l'utilisateur cite une valeur abstraite ("confiance", "innovation", "écologie"…), c'est TOI qui fais la traduction visuelle dans le prompt. Évite les clichés statistiques (cadenas pour la sécurité, voiture pour la vitesse). Préfère :
  - confiance → composition symétrique, géométrie ancrée, deep navy
  - innovation → asymétrie, verre réfracté, accent néon sur base neutre
  - éco-responsabilité → courbes organiques, terre cuite et sauge, papier recyclé
  - luxe → typo ultra-fine, espace négatif généreux, accent doré subtil
  - performance → motion blur directionnel, lignes diagonales nettes, fort contraste
  - transparence → couches de verre translucide, traits hairline, profondeur frostée
- Pas de composants UI finis (pas de boutons précis, pas de texte précis) — on reste au stade ambiance.

## UI/UX Design — focus HAUTE-FIDÉLITÉ et FINITION
- Objectif : produire un visuel pixel-perfect prêt pour Figma / DA finale.
- Vocabulaire : high-fidelity landing page hero, pixel-perfect UI components, refined typography system, hairline 1px borders, soft layered shadows, ambient occlusion, octane render quality, ultra-detailed, cinematic studio lighting.
- **Toujours mentionner** : composition top-heavy + transition basse vers fond uni (\`seamless fade to solid background at the bottom\`) pour ménager la suite de page.
- Privilégier les bibliothèques de rendu 3D (octane, ray tracing, ambient occlusion) et l'éclairage cinéma pour la qualité finale.

# Diversité créative entre les variants A/B/C
Si tu proposes 2 ou 3 variantes, elles doivent **explorer des angles d'attaque distincts**, pas des reformulations. Différentes :
- compositions / points de vue
- collisions conceptuelles (voir ci-dessous)
- traductions de valeurs
- mediums (photo / illustration / 3D / mixed media) en phase Mood et UI/UX

# Outil créatif : COLLISIONS CONCEPTUELLES
Quand l'utilisateur dit "je n'ai pas d'idée", "surprends-moi", "trouve-moi quelque chose d'original", **n'attends pas qu'il fournisse une métaphore**. Propose toi-même une **collision improbable** entre deux univers et injecte-la dans le prompt. Exemples :
- editorial magazine spread × dashboard interface
- japanese zen garden × futuristic glass panels
- monolithic stone architecture × frosted glass UI
- origami folds × data visualization
- brutalist concrete × delicate serif elegance
- swiss minimal poster × maximalist illustration
- terminal aesthetic × baroque ornament
- liquid mercury × rigid mathematical grid
- mid-century print × cyberpunk neon
- Bauhaus geometry × hand-lettered organic script

Cette technique sert surtout les phases Wireframe (collision structurelle) et Mood (collision esthétique). En UI/UX, garde une seule influence dominante pour la lisibilité.`

function buildSystemPrompt(phase: string): string {
  const label = PHASE_LABELS[phase as keyof typeof PHASE_LABELS] ?? phase
  return `${SYSTEM_PROMPT}\n\n# Phase active : ${label}`
}

function toGeminiMessages(messages: HelperMessage[]): GeminiMessage[] {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

const MOCK_REPLY: Record<string, string> = {
  wireframe: `Voici une piste wireframe orientée structure pure, avec un anti-pattern doux pour casser le template classique :

\`\`\`prompt
Low-fidelity UX wireframe of a landing page hero section, top-aligned content, asymmetric bento grid with overlapping placeholder blocks, thick black strokes on white background, no shading, no color, no images. Radical negative space in the lower half reserved for the next section. Editorial avant-garde influence, structural innovation over template conformity.
\`\`\``,
  mood: `Voici une ambiance qui traduit "quiet luxury" et "high-performance precision" en éléments visuels concrets (matières + lumière + palette nommée) :

\`\`\`prompt
Conceptual moodboard for a landing page hero section, expressing quiet luxury and high-performance precision through brushed steel surfaces, frosted glass panels, deep navy and brass palette, soft window light with ambient occlusion. Editorial atmosphere, cinematic depth, top-heavy composition fading toward a clean lower area.
\`\`\``,
  uiux: `Pour la phase haute-fidélité, avec composition top-heavy et fade bas pour ménager la suite de page :

\`\`\`prompt
High-fidelity landing page hero section, pixel-perfect UI components, refined typography system with bold display sans paired with editorial serif, hairline 1px borders, soft layered shadows, ambient occlusion, navy and brass palette on near-white background. Cinematic studio lighting, octane render quality, ultra-detailed micro-finishing. Top-heavy composition with seamless fade to solid background at the bottom.
\`\`\``,
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = HelperChatRequestSchema.safeParse(body)
  if (!parsed.success) {
    log.error('invalid payload', parsed.error.flatten())
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload', data: parsed.error.flatten() })
  }

  const { sessionId, phase, messages } = parsed.data
  log.info(`POST /api/helper/chat sessionId=${sessionId} phase=${phase} turns=${messages.length}`)

  // Persiste la conversation côté DB (upsert par sessionId+phase)
  await prisma.helperConversation.upsert({
    where: { sessionId_phase: { sessionId, phase } },
    create: { sessionId, phase, messages: JSON.parse(JSON.stringify(messages)) },
    update: { messages: JSON.parse(JSON.stringify(messages)) },
  })

  const mode = await getProviderMode()

  // Mode mock : réponse statique sans appel réseau
  if (mode !== 'live') {
    const reply = MOCK_REPLY[phase] ?? 'Je suis là pour t\'aider à formuler des prompts !'
    const updatedMessages: HelperMessage[] = [...messages, { role: 'assistant', content: reply }]
    await prisma.helperConversation.update({
      where: { sessionId_phase: { sessionId, phase } },
      data: { messages: JSON.parse(JSON.stringify(updatedMessages)) },
    })
    return { reply }
  }

  const apiKey = getApiKey('google-ai')
  if (!apiKey) {
    log.error('no Google AI API key')
    throw createError({ statusCode: 503, statusMessage: 'Google AI API key not configured' })
  }

  const abortController = new AbortController()
  const cleanup = () => abortController.abort()
  event.node.req.once('close', cleanup)

  try {
    const reply = await geminiChat(
      toGeminiMessages(messages),
      buildSystemPrompt(phase),
      apiKey,
      abortController.signal,
    )

    const updatedMessages: HelperMessage[] = [...messages, { role: 'assistant', content: reply }]
    await prisma.helperConversation.update({
      where: { sessionId_phase: { sessionId, phase } },
      data: { messages: JSON.parse(JSON.stringify(updatedMessages)) },
    })

    return { reply }
  } catch (err) {
    if (err instanceof GeminiTextError) {
      const statusMap: Record<string, number> = {
        unauthorized: 401,
        rate_limited: 429,
        timeout: 504,
        server_error: 502,
        invalid_response: 502,
      }
      throw createError({ statusCode: statusMap[err.code] ?? 502, statusMessage: err.message })
    }
    throw err
  } finally {
    event.node.req.off('close', cleanup)
  }
})
