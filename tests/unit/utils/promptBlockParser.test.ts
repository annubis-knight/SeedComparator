import { describe, it, expect } from 'vitest'
import { parsePromptBlocks } from '../../../app/utils/promptBlockParser'

describe('parsePromptBlocks', () => {
  // @requirement: FR-074 (STORY-109)
  it('extrait un seul bloc prompt', () => {
    const text = 'Voici un prompt :\n```prompt\nA serene wireframe layout\n```\nBonne chance !'
    expect(parsePromptBlocks(text)).toEqual(['A serene wireframe layout'])
  })

  // @requirement: FR-074 (STORY-109)
  it('extrait plusieurs blocs dans l\'ordre', () => {
    const text = [
      'Variante A :',
      '```prompt',
      'Wireframe low-fi',
      '```',
      'Variante B :',
      '```prompt',
      'Mood board warm tones',
      '```',
      'Variante C :',
      '```prompt',
      'High-fidelity UI dark',
      '```',
    ].join('\n')
    expect(parsePromptBlocks(text)).toEqual([
      'Wireframe low-fi',
      'Mood board warm tones',
      'High-fidelity UI dark',
    ])
  })

  // @requirement: FR-074 (STORY-109)
  it('retourne un tableau vide s\'il n\'y a aucun bloc', () => {
    expect(parsePromptBlocks('Aucun bloc ici, juste du texte.')).toEqual([])
  })

  // @requirement: FR-074 (STORY-109)
  it('ne confond pas un bloc ```code``` ordinaire avec un bloc ```prompt```', () => {
    const text = '```js\nconsole.log("hello")\n```\n```prompt\nReal prompt here\n```'
    expect(parsePromptBlocks(text)).toEqual(['Real prompt here'])
  })

  // @requirement: FR-074 (STORY-109)
  it('ignore les blocs prompt vides', () => {
    const text = '```prompt\n\n```\n```prompt\nValide\n```'
    expect(parsePromptBlocks(text)).toEqual(['Valide'])
  })

  // @requirement: FR-074 (STORY-109)
  it('trim le contenu de chaque bloc', () => {
    const text = '```prompt\n  trimmed content  \n```'
    expect(parsePromptBlocks(text)).toEqual(['trimmed content'])
  })
})
