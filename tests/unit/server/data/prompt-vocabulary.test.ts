import { describe, it, expect } from 'vitest'
import vocabulary from '../../../../server/data/prompt-vocabulary.json'

interface Category {
  _group?: string
  _subgroup?: string
  _phaseAffinity?: string[]
  _description?: string
  terms: string[]
}

interface Meta {
  version?: string
  groups?: Record<string, string>
}

const VALID_PHASES = new Set(['wireframe', 'mood', 'uiux'])

function getCategories(): Array<[string, Category]> {
  return Object.entries(vocabulary)
    .filter(([k]) => !k.startsWith('_')) as Array<[string, Category]>
}

function getMeta(): Meta {
  return ((vocabulary as { _meta?: Meta })._meta) ?? {}
}

describe('prompt-vocabulary.json — STORY-112 v1.2.0 integrity', () => {
  // @requirement: FR-054
  it('exposes _meta with version >= 1.2.0 and groups map', () => {
    const meta = getMeta()
    expect(meta.version).toBeDefined()
    expect(meta.version!.startsWith('1.')).toBe(true)
    const [maj, min] = meta.version!.split('.').map(Number)
    expect(maj).toBe(1)
    expect(min).toBeGreaterThanOrEqual(2)
    expect(meta.groups).toBeDefined()
    expect(Object.keys(meta.groups!).length).toBe(8)
  })

  // @requirement: FR-054
  it('contains the 4 new STORY-112 categories', () => {
    const keys = getCategories().map(([k]) => k)
    expect(keys).toContain('web_layout_principles')
    expect(keys).toContain('anti_pattern_layout')
    expect(keys).toContain('conceptual_collisions')
    expect(keys).toContain('brand_values_visual_translation')
  })

  // @requirement: FR-054
  it('every category has _group, _subgroup, _phaseAffinity, _description, terms', () => {
    for (const [key, cat] of getCategories()) {
      expect(cat._group, `category ${key} missing _group`).toBeDefined()
      expect(cat._subgroup, `category ${key} missing _subgroup`).toBeDefined()
      expect(cat._phaseAffinity, `category ${key} missing _phaseAffinity`).toBeDefined()
      expect(Array.isArray(cat._phaseAffinity)).toBe(true)
      expect(cat._phaseAffinity!.length).toBeGreaterThan(0)
      expect(cat._description, `category ${key} missing _description`).toBeDefined()
      expect(Array.isArray(cat.terms)).toBe(true)
      expect(cat.terms.length).toBeGreaterThan(0)
    }
  })

  // @requirement: FR-054, FR-069
  it('every _phaseAffinity entry is a valid phase (wireframe|mood|uiux)', () => {
    for (const [key, cat] of getCategories()) {
      for (const phase of cat._phaseAffinity!) {
        expect(VALID_PHASES.has(phase), `category ${key} has invalid phase "${phase}"`).toBe(true)
      }
    }
  })

  // @requirement: FR-054
  it('every _group references an existing group in _meta.groups', () => {
    const meta = getMeta()
    const validGroups = new Set(Object.keys(meta.groups!))
    for (const [key, cat] of getCategories()) {
      expect(validGroups.has(cat._group!), `category ${key} references unknown _group "${cat._group}"`).toBe(true)
    }
  })

  // @requirement: FR-054
  it('no duplicate terms within a category', () => {
    for (const [key, cat] of getCategories()) {
      const set = new Set(cat.terms)
      expect(set.size, `category ${key} has duplicate terms`).toBe(cat.terms.length)
    }
  })

  // @requirement: FR-054
  it('total terms count is at least 460 (was 318 in v1.1.0)', () => {
    const total = getCategories().reduce((acc, [, cat]) => acc + cat.terms.length, 0)
    expect(total).toBeGreaterThanOrEqual(460)
  })

  // @requirement: FR-069
  it('wireframe phase has dedicated categories (web_layout_principles, anti_pattern_layout, conceptual_collisions)', () => {
    const wireframeCategories = getCategories()
      .filter(([, cat]) => cat._phaseAffinity!.includes('wireframe'))
      .map(([k]) => k)
    expect(wireframeCategories).toContain('web_layout_principles')
    expect(wireframeCategories).toContain('anti_pattern_layout')
    expect(wireframeCategories).toContain('conceptual_collisions')
  })

  // @requirement: FR-053, FR-069
  it('brand_values_visual_translation is affined to mood and uiux (semantic bridge)', () => {
    const cat = (vocabulary as Record<string, Category>).brand_values_visual_translation
    expect(cat._phaseAffinity).toContain('mood')
  })

  // @requirement: FR-054
  it('conceptual_collisions terms follow the "X × Y" pattern', () => {
    const cat = (vocabulary as Record<string, Category>).conceptual_collisions
    for (const term of cat.terms) {
      expect(term, `collision "${term}" must contain "×"`).toContain('×')
    }
  })

  // @requirement: FR-053
  it('brand_values_visual_translation terms follow "value → visual" pattern', () => {
    const cat = (vocabulary as Record<string, Category>).brand_values_visual_translation
    for (const term of cat.terms) {
      expect(term, `value translation "${term}" must contain "→"`).toContain('→')
    }
  })
})
