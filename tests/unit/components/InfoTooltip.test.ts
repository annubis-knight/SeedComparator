import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import InfoTooltip from '../../../app/components/ui/InfoTooltip.vue'

/**
 * STORY-124 — InfoTooltip est désormais téléporté vers <body> et positionné
 * en `fixed` pour échapper aux conteneurs `overflow:auto`. On accède donc au
 * noeud du tooltip via `document.body.querySelector` (pas `wrapper.find`).
 */
function findTooltip(): HTMLElement | null {
  return document.body.querySelector('[role="tooltip"]')
}

afterEach(() => {
  // Nettoyage : Vue.js peut laisser le tooltip téléporté entre tests si on
  // ne démonte pas explicitement. On force le nettoyage.
  document.body.querySelectorAll('[role="tooltip"]').forEach((n) => n.remove())
})

describe('InfoTooltip', () => {
  // @requirement: FR-081
  it('rend l\'icône i avec aria-label par défaut', () => {
    const w = mount(InfoTooltip, { props: { text: 'Détail du paramètre' } })
    const btn = w.find('button')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-label')).toContain('Informations')
    expect(btn.text()).toBe('i')
  })

  // @requirement: FR-081
  it('le tooltip est caché par défaut', () => {
    mount(InfoTooltip, { props: { text: 'X' }, attachTo: document.body })
    expect(findTooltip()).toBeNull()
  })

  // @requirement: FR-081 — visible au focus clavier
  it('affiche le tooltip au focus clavier (focusin)', async () => {
    const w = mount(InfoTooltip, { props: { text: 'Hello' }, attachTo: document.body })
    await w.trigger('focusin')
    const tt = findTooltip()
    expect(tt).not.toBeNull()
    expect(tt!.textContent).toBe('Hello')
    w.unmount()
  })

  // @requirement: FR-081 — visible au hover
  it('affiche le tooltip au hover (mouseenter) et le cache au mouseleave', async () => {
    const w = mount(InfoTooltip, { props: { text: 'Yo' }, attachTo: document.body })
    await w.trigger('mouseenter')
    expect(findTooltip()).not.toBeNull()
    await w.trigger('mouseleave')
    expect(findTooltip()).toBeNull()
    w.unmount()
  })

  // @requirement: FR-081 — positionnement en fixed (échappe aux overflow parents)
  it('le tooltip est positionné en `fixed` (échappe aux conteneurs overflow:auto)', async () => {
    const w = mount(InfoTooltip, { props: { text: 'X' }, attachTo: document.body })
    await w.trigger('focusin')
    const tt = findTooltip()
    expect(tt).not.toBeNull()
    expect(tt!.style.position).toBe('fixed')
    w.unmount()
  })

  // @requirement: FR-081 — fermeture sur Esc
  it('ferme au keydown Escape', async () => {
    const w = mount(InfoTooltip, { props: { text: 'X' }, attachTo: document.body })
    await w.trigger('focusin')
    expect(findTooltip()).not.toBeNull()
    await w.find('button').trigger('keydown', { key: 'Escape' })
    expect(findTooltip()).toBeNull()
    w.unmount()
  })
})
