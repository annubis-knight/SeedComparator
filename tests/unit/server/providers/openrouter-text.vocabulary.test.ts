import { describe, it, expect } from 'vitest'
import { buildVocabularySection } from '../../../../server/providers/openrouter-text'

describe('buildVocabularySection — STORY-112 grouped output', () => {
  const section = buildVocabularySection()

  // @requirement: FR-053
  it('produit un texte non-vide', () => {
    expect(section.length).toBeGreaterThan(500)
  })

  // @requirement: FR-053, FR-054
  it('rend les 8 headers de groupes', () => {
    expect(section).toMatch(/## Group 1_structure_layout/)
    expect(section).toMatch(/## Group 2_typography/)
    expect(section).toMatch(/## Group 3_photography/)
    expect(section).toMatch(/## Group 4_cinema_film/)
    expect(section).toMatch(/## Group 5_art_illustration/)
    expect(section).toMatch(/## Group 6_3d_rendering/)
    expect(section).toMatch(/## Group 7_mood_matter_color/)
    expect(section).toMatch(/## Group 8_creative_disruption/)
  })

  // @requirement: FR-069
  it('expose le _phaseAffinity de chaque catégorie', () => {
    expect(section).toMatch(/_\(phases: [a-z, ]+\)_/)
  })

  // @requirement: FR-053
  it('expose le _subgroup quand présent', () => {
    expect(section).toMatch(/web layout principles\*\* — Composition principles/)
    expect(section).toMatch(/conceptual collisions\*\* — Conceptual collisions/)
  })

  // @requirement: FR-054
  it('inclut les 4 nouvelles catégories STORY-112', () => {
    expect(section).toMatch(/web layout principles/)
    expect(section).toMatch(/anti pattern layout/)
    expect(section).toMatch(/conceptual collisions/)
    expect(section).toMatch(/brand values visual translation/)
  })

  // @requirement: FR-054
  it('inclut au moins quelques termes représentatifs des nouvelles catégories', () => {
    expect(section).toMatch(/top-heavy composition/)
    expect(section).toMatch(/seamless fade to bottom/)
    expect(section).toMatch(/broken grid/)
    expect(section).toMatch(/zen garden × futuristic glass panels/)
    expect(section).toMatch(/innovation → asymmetric layout/)
  })
})
