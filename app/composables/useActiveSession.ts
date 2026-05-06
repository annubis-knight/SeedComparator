import type { Phase, SessionPhasePrompts } from '#shared/contracts'
import { PROMPT_DEFAULTS_BY_PHASE } from '#shared/contracts'
import { createLogger } from '../utils/logger'

const log = createLogger('useActiveSession')

export interface RecentSession {
  id: string
  name: string | null
  createdAt: string
  generationsCount: number
}

export const ACTIVE_SESSION_STORAGE_KEY = 'seedcomparator.session.activeId'
export const ACTIVE_SESSION_NAME_STORAGE_KEY = 'seedcomparator.session.activeName'
export const ACTIVE_PHASE_STORAGE_KEY = 'seedcomparator.session.activePhase'
export const PHASE_PROMPTS_STORAGE_KEY = 'seedcomparator.session.phasePrompts'

function readPersistedPhase(): Phase {
  if (typeof localStorage === 'undefined') return 'wireframe'
  const v = localStorage.getItem(ACTIVE_PHASE_STORAGE_KEY)
  if (v === 'wireframe' || v === 'mood' || v === 'uiux') return v
  return 'wireframe'
}

function readPersistedPhasePrompts(): SessionPhasePrompts {
  if (typeof localStorage === 'undefined') return { ...PROMPT_DEFAULTS_BY_PHASE }
  try {
    const raw = localStorage.getItem(PHASE_PROMPTS_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as SessionPhasePrompts
  } catch {}
  return {
    wireframe: { ...PROMPT_DEFAULTS_BY_PHASE.wireframe },
    mood: { ...PROMPT_DEFAULTS_BY_PHASE.mood },
    uiux: { ...PROMPT_DEFAULTS_BY_PHASE.uiux },
  }
}

function readPersistedId(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)
}

function readPersistedName(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(ACTIVE_SESSION_NAME_STORAGE_KEY)
}

/**
 * Composable qui gère la session ACTIVE de l'utilisateur (pattern ChatGPT).
 *
 * Une session active = celle dans laquelle les nouveaux batchs s'ajoutent.
 * - L'ID est persisté en localStorage pour reprise auto au reload.
 * - Le nom est aussi persisté pour affichage immédiat avant que le serveur réponde.
 * - `setFromGenerate(id, name)` est appelé après la création/réutilisation côté serveur.
 * - `clear()` démarre une nouvelle session vide (au prochain batch, le serveur en créera une).
 *
 * STORY-099 : ajout du mode `draft` pour pouvoir afficher le workflow génération
 * avant qu'une Session DB soit créée. `hasActive` est true en draft ou avec un id réel.
 */
export const useActiveSession = () => {
  const activeId = useState<string | null>('active-session-id', readPersistedId)
  const activeName = useState<string | null>('active-session-name', readPersistedName)
  const draftMode = useState<boolean>('active-session-draft', () => false)
  const recent = useState<RecentSession[]>('active-session-recent', () => [])
  // STORY-105 — Phase active et prompts par phase
  const activePhase = useState<Phase>('active-phase', readPersistedPhase)
  const phasePrompts = useState<SessionPhasePrompts>('phase-prompts', readPersistedPhasePrompts)

  function setFromGenerate(id: string, name: string | null) {
    log.info(`setFromGenerate id=${id} name="${name ?? '(null)'}"`)
    activeId.value = id
    activeName.value = name
    draftMode.value = false  // le serveur a confirmé, on n'est plus en draft
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, id)
      if (name) localStorage.setItem(ACTIVE_SESSION_NAME_STORAGE_KEY, name)
      else localStorage.removeItem(ACTIVE_SESSION_NAME_STORAGE_KEY)
    }
    // La session vient d'être créée ou réutilisée côté serveur — recharge la liste
    // pour que le RailNav affiche la nouvelle entrée (cf. UX ChatGPT).
    void loadRecent(5)
  }

  function clear() {
    log.info('clear active session')
    activeId.value = null
    activeName.value = null
    draftMode.value = false
    activePhase.value = 'wireframe'
    phasePrompts.value = {
      wireframe: { ...PROMPT_DEFAULTS_BY_PHASE.wireframe },
      mood: { ...PROMPT_DEFAULTS_BY_PHASE.mood },
      uiux: { ...PROMPT_DEFAULTS_BY_PHASE.uiux },
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
      localStorage.removeItem(ACTIVE_SESSION_NAME_STORAGE_KEY)
      localStorage.removeItem(ACTIVE_PHASE_STORAGE_KEY)
      localStorage.removeItem(PHASE_PROMPTS_STORAGE_KEY)
    }
  }

  /**
   * STORY-099 : démarre un workflow "nouvelle session" sans id réel.
   * Le workflow génération est affiché. La 1re génération créera la Session
   * côté serveur, et `setFromGenerate` sortira du mode draft.
   */
  function startDraft() {
    log.info('startDraft — empty session, awaiting first batch to materialize')
    activeId.value = null
    activeName.value = null
    draftMode.value = true
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
      localStorage.removeItem(ACTIVE_SESSION_NAME_STORAGE_KEY)
    }
  }

  function setName(name: string) {
    log.info(`setName "${name}"`)
    activeName.value = name
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACTIVE_SESSION_NAME_STORAGE_KEY, name)
    }
  }

  /**
   * STORY-105 — Retourne les prompts [a, b, c] de la phase active sous forme de tableau
   * compatible avec v-model de PromptInputs (index 0=A, 1=B, 2=C).
   */
  const currentPrompts = computed<string[]>(() => {
    const p = phasePrompts.value[activePhase.value]
    return [p.a, p.b, p.c]
  })

  /**
   * STORY-105 — Met à jour les prompts A/B/C de la phase active.
   */
  function setCurrentPrompts(values: string[]) {
    const phase = activePhase.value
    const updated: SessionPhasePrompts = {
      ...phasePrompts.value,
      [phase]: {
        a: values[0] ?? '',
        b: values[1] ?? '',
        c: values[2] ?? '',
      },
    }
    phasePrompts.value = updated
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PHASE_PROMPTS_STORAGE_KEY, JSON.stringify(updated))
    }
  }

  /**
   * STORY-105 — Change la phase active. Persiste en localStorage.
   */
  function setPhase(phase: Phase) {
    log.info(`setPhase ${activePhase.value} → ${phase}`)
    activePhase.value = phase
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACTIVE_PHASE_STORAGE_KEY, phase)
    }
    // Sync avec le serveur si on a une session active
    if (activeId.value) {
      $fetch(`/api/sessions/${activeId.value}`, {
        method: 'PATCH',
        body: { activePhase: phase },
      }).catch((err: unknown) => log.error('setPhase server sync failed', { msg: (err as Error).message }))
    }
  }

  /**
   * STORY-105 — Réinitialise les prompts de la phase active aux valeurs par défaut.
   */
  function resetPhasePromptsToDefaults() {
    const defaults = PROMPT_DEFAULTS_BY_PHASE[activePhase.value]
    setCurrentPrompts([defaults.a, defaults.b, defaults.c])
  }

  /**
   * Renomme la session courante côté serveur ET met à jour le state local.
   */
  async function rename(newName: string) {
    if (!activeId.value) return
    const trimmed = newName.trim()
    if (!trimmed) return
    try {
      await $fetch(`/api/sessions/${activeId.value}`, {
        method: 'PATCH',
        body: { name: trimmed },
      })
      setName(trimmed)
    } catch (err) {
      log.error('rename failed', { msg: (err as Error).message })
      throw err
    }
  }

  /**
   * STORY-099 : active une session existante (clic depuis la liste RailNav).
   * Persiste id + name. Le caller (composant) gère la redirection /generate.
   */
  function activate(id: string, name: string | null) {
    log.info(`activate id=${id} name="${name ?? '(null)'}"`)
    activeId.value = id
    activeName.value = name
    draftMode.value = false
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, id)
      if (name) localStorage.setItem(ACTIVE_SESSION_NAME_STORAGE_KEY, name)
      else localStorage.removeItem(ACTIVE_SESSION_NAME_STORAGE_KEY)
    }
  }

  /**
   * STORY-099 : recharge la liste des sessions récentes (pour RailNav).
   */
  async function loadRecent(limit = 5) {
    try {
      const data = await $fetch<{ sessions: RecentSession[] }>(`/api/sessions/recent?limit=${limit}`)
      recent.value = data.sessions
    } catch (err) {
      log.error('loadRecent failed', { msg: (err as Error).message })
    }
  }

  /**
   * Supprime une session côté serveur (cascade generations) et met à jour la
   * liste recent + l'état actif si besoin.
   */
  async function remove(id: string) {
    log.info(`remove session=${id}`)
    try {
      await $fetch(`/api/sessions/${id}`, { method: 'DELETE' })
    } catch (err) {
      log.error('remove failed', { msg: (err as Error).message })
      throw err
    }
    // Si on supprimait la session active, on revient à un état neutre.
    if (activeId.value === id) clear()
    await loadRecent(5)
  }

  /**
   * `hasActive` = true s'il y a une session DB active OU si on est en mode draft
   * (workflow démarré, en attente de la 1re génération qui créera la Session DB).
   */
  const hasActive = computed(() => !!activeId.value || draftMode.value)

  return {
    activeId,
    activeName,
    draftMode,
    hasActive,
    recent,
    // STORY-105
    activePhase,
    phasePrompts,
    currentPrompts,
    setFromGenerate,
    clear,
    startDraft,
    setName,
    rename,
    activate,
    loadRecent,
    remove,
    // STORY-105
    setPhase,
    setCurrentPrompts,
    resetPhasePromptsToDefaults,
  }
}
