import { createLogger } from '../utils/logger'
import vocabulary from '../data/prompt-vocabulary.json'

const log = createLogger('openrouter-text')

/**
 * Construit la section "Vocabulaire de référence" injectée dans le system prompt.
 * Le vocabulaire est organisé en 8 groupes thématiques. Chaque catégorie expose
 * ses méta-données (`_group`, `_subgroup`, `_phaseAffinity`) pour permettre au
 * LLM de filtrer selon la phase active (wireframe / mood / uiux) et l'intention.
 * La banque est versionée dans `server/data/prompt-vocabulary.json` ;
 * sources documentées dans `docs/prompt-vocabulary-sources.md`.
 */
interface VocabularyCategory {
  _group?: string
  _subgroup?: string
  _phaseAffinity?: string[]
  _description?: string
  terms: string[]
}

interface VocabularyMeta {
  groups?: Record<string, string>
}

export function buildVocabularySection(): string {
  const meta = (vocabulary as { _meta?: VocabularyMeta })._meta ?? {}
  const groupsMap = meta.groups ?? {}
  const grouped: Record<string, Array<{ key: string; cat: VocabularyCategory }>> = {}

  for (const [key, value] of Object.entries(vocabulary)) {
    if (key.startsWith('_')) continue
    const cat = value as VocabularyCategory
    const groupId = cat._group ?? '_ungrouped'
    if (!grouped[groupId]) grouped[groupId] = []
    grouped[groupId].push({ key, cat })
  }

  const groupIds = Object.keys(grouped).sort()
  const lines: string[] = []

  for (const groupId of groupIds) {
    const groupLabel = groupsMap[groupId] ?? groupId.replace(/_/g, ' ')
    lines.push(`\n## Group ${groupId} — ${groupLabel}`)
    for (const { key, cat } of grouped[groupId]!) {
      const label = key.replace(/_/g, ' ')
      const affinity = cat._phaseAffinity?.length
        ? ` _(phases: ${cat._phaseAffinity.join(', ')})_`
        : ''
      const sub = cat._subgroup ? ` — ${cat._subgroup}` : ''
      lines.push(`- **${label}**${sub}${affinity}: ${cat.terms.join(', ')}`)
    }
  }

  return lines.join('\n')
}

const VOCABULARY_SECTION = buildVocabularySection()

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'
const TEXT_MODEL = 'anthropic/claude-haiku-4.5'
const VISION_MODEL = 'anthropic/claude-haiku-4.5'

export class LLMError extends Error {
  constructor(
    public readonly code: 'unauthorized' | 'rate_limited' | 'server_error' | 'invalid_response' | 'timeout',
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'LLMError'
  }
}

function mapHttpError(status: number, body: string): LLMError {
  if (status === 401 || status === 403) return new LLMError('unauthorized', `OpenRouter unauthorized: ${body}`, status)
  if (status === 429) return new LLMError('rate_limited', 'OpenRouter rate limited', status)
  if (status >= 500) return new LLMError('server_error', `OpenRouter server error: ${body}`, status)
  return new LLMError('server_error', `OpenRouter ${status}: ${body}`, status)
}

interface ChatMessageContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string }
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ChatMessageContent[]
}

async function chatCompletion(
  messages: ChatMessage[],
  apiKey: string,
  model: string,
  signal: AbortSignal,
  options: { maxTokens?: number; temperature?: number; jsonMode?: boolean } = {},
): Promise<string> {
  const t0 = Date.now()
  log.debug(`chatCompletion model=${model} messages=${messages.length}`)

  let res: Response
  try {
    res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://seedcomparator.local',
        'X-Title': 'SeedComparator Brief Assistant',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens ?? 1500,
        temperature: options.temperature ?? 0.7,
        ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal,
    })
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError') throw new LLMError('timeout', 'Aborted')
    log.error('network error', { msg: (err as Error).message })
    throw new LLMError('server_error', `Network: ${(err as Error).message}`)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    log.error(`HTTP ${res.status}`, { body: body.slice(0, 200) })
    throw mapHttpError(res.status, body)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    log.error('empty response', data)
    throw new LLMError('invalid_response', 'No content in response')
  }
  log.info(`chatCompletion success in ${Date.now() - t0}ms, ${content.length} chars`)
  return content
}

/**
 * Décrit une capture d'écran de site via Claude Haiku Vision.
 * Retourne une description textuelle structurée du style visuel perçu.
 */
export async function describeScreenshot(
  pngBuffer: Buffer,
  context: { url: string },
  apiKey: string,
  signal: AbortSignal,
): Promise<string> {
  const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'Tu es un expert en design web. Analyse une capture d\'écran de site et décris son style visuel en 3-5 lignes en français. Couvre : ambiance générale, palette perçue (chaude/froide/saturée), typographie (serif/sans/display), densité (minimaliste/riche), style des images si présentes, sentiment dominant. Reste concret et actionnable, sans jargon.',
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: `Site analysé : ${context.url}` },
        { type: 'image_url', image_url: { url: dataUrl } },
      ],
    },
  ]
  return chatCompletion(messages, apiKey, VISION_MODEL, signal, { maxTokens: 400, temperature: 0.4 })
}

export interface BriefInput {
  artDirection?: string
  mood?: string
  uiStyle?: string
  typography?: string
  palette?: string
  contextMarkdown?: string  // markdown contextuel agrégé (texte + palette + descriptions vision)
}

export interface GeneratedPrompts {
  /**
   * COMPLÉMENT à ajouter au préfixe par défaut PROMPT_PREFIX_A.
   * Le préfixe garantit le cadre (haut de landing, hero, typo display) ; ce champ
   * porte uniquement les enrichissements (DA, mood, vocabulaire technique).
   */
  promptA: string  // langage naturel descriptif (complément)
  promptB: string  // mots-clés / tags (complément)
  promptC: string  // format structuré (complément, ajouté après "Style additions:")
}

/**
 * Génère les 3 COMPLÉMENTS à ajouter aux préfixes par défaut.
 *
 * Approche "complétion" : le LLM ne réécrit pas le préfixe (haut de landing,
 * hero, typo display) — il génère uniquement la partie variable orientée
 * inspiration créative (DA / mood / palette / style typo / techniques visuelles).
 *
 * Le frontend concatène ensuite via `joinPromptVariant(variant, completion)`.
 */
export async function generatePromptsFromBrief(
  brief: BriefInput,
  apiKey: string,
  signal: AbortSignal,
): Promise<GeneratedPrompts> {
  const systemPrompt = `Tu es un creative designer expert en direction artistique web et en prompts pour générateurs d'images IA (Midjourney V7, Flux, Imagen 4, GPT Image, Stable Diffusion, Gemini Image).

# Contexte d'utilisation

Cet outil sert à **explorer visuellement des hauts de landing page** dans une logique d'**inspiration et de génération d'idées variées**. Le but n'est PAS de produire un visuel fidèle à un brief client précis, mais de **maximiser la diversité créative** des résultats pour stimuler la créativité humaine.

# Tu génères des COMPLÉMENTS, pas des prompts complets

Le frontend gère 3 préfixes fixes qui garantissent déjà :
- Le **format** : haut de landing page incluant une hero section
- La **direction artistique de base** : creative, art-directed, editorial
- La **typographie** : bold display type, strong hierarchy, large scale
- La **composition** : intentional, free creative interpretation

Ta tâche : générer **3 compléments** distincts qui s'AJOUTENT à ces préfixes pour orienter la génération vers des **rendus différents**, en piochant dans le vocabulaire de référence ci-dessous.

# Contraintes techniques fortes (TOUJOURS respecter)

- Compléments **autonomes**, pas de placeholders type \`[Industrie]\`, \`[Valeur]\`, \`<your value here>\`. Si une info manque, choisis une valeur plausible.
- **Pas de référence à une image source** : l'app ne supporte pas l'image-to-image. Pas de \`based on the previous wireframe\`, pas de \`[Lien Image]\`.
- **Pas de syntaxe spécifique à un modèle** : pas de \`--chaos\`, \`--stylize\`, \`--ar\`, \`--v\`, \`--iw\`, pas de pondération \`::\` ou \`(word:1.4)\`. Le prompt doit fonctionner sur tous les modèles.
- En anglais, dense et idiomatique.

# Format des 3 compléments

- **promptA — complément langage naturel** : 1-3 phrases, 30-60 mots. S'ajoute après le préfixe A avec un espace. Exemple : "The mood is serene and contemplative, with soft window light and earth tones. Shot on 85mm with shallow depth of field, evoking a Scandinavian editorial aesthetic."

- **promptB — complément keywords** : 12-22 tags séparés par virgules. S'ajoute après le préfixe B avec une virgule. Exemple : "swiss minimal, oversized display sans, monochrome palette, soft natural light, editorial photography, shot on 35mm, Kodak Portra 400, asymmetric layout, negative space"

- **promptC — complément structuré** : sections labellisées (1 par ligne, format \`Label: valeur\`) qui s'ajoutent après le préfixe C qui se termine par "Style additions:". Exemple :
  \`\`\`
  Mood: serene, contemplative
  Lighting: soft natural light, golden hour
  Color palette: warm earth tones, muted pastels
  Materials: matte ceramic, raw linen
  Medium: editorial photography, 85mm f/1.4, shallow depth of field
  Style: scandinavian editorial, mid-century modern influence
  \`\`\`

# Diversité créative — IMPÉRATIF

Les 3 compléments doivent **explorer 3 angles d'attaque distincts** sur le brief :
- Composition / point de vue / mood radicalement différents entre A, B et C.
- Mediums variés si possible (photo, illustration, 3D rendu, mixed media).
- Si le brief utilisateur est vide ou minimal, **propose 3 directions créatives complètement différentes** (ex: A photoréaliste éditorial, B illustration brutaliste, C 3D minimaliste).

L'utilisateur cherche de l'**inspiration** et de la **divergence**, pas de la convergence.

# Pont sémantique : VALEURS → VISUEL (impératif)

Si le brief contient des **mots abstraits** (valeurs, intentions, concepts type "confiance", "innovation", "écologie", "luxe", "performance", "transparence"), tu dois les **traduire en éléments visuels concrets** dans le prompt — formes, lumières, matières, palettes — au lieu de les laisser tels quels. Évite les clichés statistiques (cadenas pour la sécurité, voiture pour la vitesse). Réfère-toi à la catégorie \`brand_values_visual_translation\` du vocabulaire pour t'inspirer. Exemples :
- "confiance" → composition symétrique + géométrie ancrée + deep navy
- "innovation" → asymétrie + verre réfracté + accent néon sur base neutre
- "luxe" → typo ultra-fine + espace négatif généreux + accent doré subtil
- "performance" → motion blur directionnel + lignes diagonales + fort contraste

# Outil créatif : COLLISIONS CONCEPTUELLES

Pour garantir la diversité, **au moins 1 des 3 variantes** devrait inclure une **collision improbable** entre deux univers (voir catégorie \`conceptual_collisions\` du vocabulaire). Cela évite que les 3 compléments restent dans la même zone esthétique. Exemples de collisions :
- editorial magazine spread × dashboard interface
- japanese zen garden × futuristic glass panels
- brutalist concrete × delicate serif elegance
- liquid mercury × rigid mathematical grid
- mid-century print × cyberpunk neon

# Vocabulaire de référence (pioche selon pertinence et selon \`_phaseAffinity\`)

${VOCABULARY_SECTION}

# Règles strictes

- Réponds UNIQUEMENT en JSON valide avec exactement les clés "promptA", "promptB", "promptC". Aucun texte avant/après.
- Chaque champ contient le COMPLÉMENT (pas le préfixe, pas de répétition de "hero", "landing", "display typography" sauf si tu raffines).
- Si un site existant est fourni dans le contexte, **t'inspire** de son identité visuelle (couleurs hex, style perçu) sans la copier — tu peux décliner, contraster, ou même proposer un angle inverse pour 1 des 3 variantes.
- N'invente PAS de marque, slogan, nom de personne identifiable.
- Pioche LARGEMENT dans le vocabulaire ci-dessus pour la précision technique.`

  const userParts: string[] = []
  userParts.push(`# Brief utilisateur (toutes informations optionnelles)\n`)

  const hasAnyField = Boolean(
    brief.artDirection?.trim() ||
    brief.mood?.trim() ||
    brief.uiStyle?.trim() ||
    brief.typography?.trim() ||
    brief.palette?.trim(),
  )

  if (!hasAnyField && (!brief.contextMarkdown || !brief.contextMarkdown.trim())) {
    userParts.push(`*(L'utilisateur n'a fourni aucune précision particulière. Propose 3 directions créatives complètement différentes pour stimuler l'inspiration.)*`)
  } else {
    if (brief.artDirection) userParts.push(`**Direction artistique souhaitée** : ${brief.artDirection}`)
    if (brief.mood) userParts.push(`**Ambiance / mood** : ${brief.mood}`)
    if (brief.uiStyle) userParts.push(`**Style graphique UI/UX souhaité** : ${brief.uiStyle}`)
    if (brief.typography) userParts.push(`**Typographie souhaitée** : ${brief.typography}`)
    if (brief.palette) userParts.push(`**Palette / couleurs** : ${brief.palette}`)
  }

  if (brief.contextMarkdown && brief.contextMarkdown.trim().length > 0) {
    userParts.push(`\n# Contexte du site existant (inspire-toi sans copier)\n`)
    userParts.push(brief.contextMarkdown)
  }
  userParts.push(`\n# Sortie attendue\n`)
  userParts.push(`Réponds UNIQUEMENT en JSON valide. Chaque champ = COMPLÉMENT (pas le préfixe).
{ "promptA": "...", "promptB": "...", "promptC": "..." }`)

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userParts.join('\n') },
  ]

  const raw = await chatCompletion(messages, apiKey, TEXT_MODEL, signal, {
    maxTokens: 2500,
    temperature: 0.85,
    jsonMode: true,
  })

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // OpenRouter peut wrapper en markdown ; tentative de cleanup
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      log.error('invalid JSON from LLM', { raw: raw.slice(0, 300) })
      throw new LLMError('invalid_response', 'LLM did not return valid JSON')
    }
  }
  const obj = parsed as Partial<GeneratedPrompts>
  if (!obj.promptA || !obj.promptB || !obj.promptC) {
    log.error('missing fields in LLM JSON', obj)
    throw new LLMError('invalid_response', 'Missing promptA/promptB/promptC in LLM response')
  }

  log.info('generatePromptsFromBrief success', {
    A: obj.promptA.length, B: obj.promptB.length, C: obj.promptC.length,
  })
  return {
    promptA: obj.promptA,
    promptB: obj.promptB,
    promptC: obj.promptC,
  }
}
