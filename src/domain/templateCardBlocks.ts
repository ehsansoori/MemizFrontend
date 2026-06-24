import type { TemplateFieldDef } from '@/types/deckProfile'
import type { CardTemplate } from '@/types/deckProfile'
import { getExamplesConfig, getPronunciationsConfig, resolveFieldKind } from '@/domain/expandTemplateFields'

export type LanguageCardPatchKey = 'input' | 'translation' | 'partOfSpeech'

export type TemplateCardBlock =
  | {
      type: 'simple'
      id: string
      label: string
      patchKey: LanguageCardPatchKey
      prominent?: boolean
    }
  | {
      type: 'pronunciations'
      id: string
      label: string
      sources: string[]
    }
  | {
      type: 'examples'
      id: string
      label: string
      count: number
      includeTranslation: boolean
    }

function fieldToBlock(field: TemplateFieldDef): TemplateCardBlock | null {
  const kind = resolveFieldKind(field)

  if (kind === 'examples') {
    const cfg = getExamplesConfig(field)
    return {
      type: 'examples',
      id: field.id,
      label: field.label,
      count: cfg.count,
      includeTranslation: cfg.includeTranslation,
    }
  }

  if (kind === 'input') {
    return {
      type: 'simple',
      id: field.id,
      label: field.label,
      patchKey: 'input',
      prominent: field.side === 'front',
    }
  }

  if (kind === 'translation') {
    return {
      type: 'simple',
      id: field.id,
      label: field.label,
      patchKey: 'translation',
    }
  }

  if (kind === 'pronunciations') {
    const cfg = getPronunciationsConfig(field)
    return {
      type: 'pronunciations',
      id: field.id,
      label: field.label,
      sources: cfg.sources,
    }
  }

  if (kind === 'partOfSpeech') {
    return {
      type: 'simple',
      id: field.id,
      label: field.label,
      patchKey: 'partOfSpeech',
    }
  }

  return null
}

export function getTemplateCardBlocks(template: CardTemplate): {
  front: TemplateCardBlock[]
  back: TemplateCardBlock[]
} {
  const front: TemplateCardBlock[] = []
  const back: TemplateCardBlock[] = []

  for (const field of template.fields) {
    const block = fieldToBlock(field)
    if (!block) continue
    if (field.side === 'front') front.push(block)
    else back.push(block)
  }

  return { front, back }
}

function blockFieldKind(block: TemplateCardBlock): string {
  if (block.type === 'simple') return block.patchKey
  return block.type
}

export function getFrontFieldKinds(template: CardTemplate): Set<string> {
  const kinds = new Set<string>()
  for (const field of template.fields) {
    if (field.side !== 'front') continue
    const kind = resolveFieldKind(field)
    if (kind) kinds.add(kind)
  }
  return kinds
}

function templateIncludesExamplesField(template: CardTemplate): boolean {
  return template.fields.some((field) => resolveFieldKind(field) === 'examples')
}

/** Back blocks for study/quiz — omits fields already shown on the front. */
export function getReviewBackBlocks(template: CardTemplate): TemplateCardBlock[] {
  const { back } = getTemplateCardBlocks(template)
  const frontKinds = getFrontFieldKinds(template)
  const hasExamplesField = templateIncludesExamplesField(template)
  return back.filter((block) => {
    if (frontKinds.has(blockFieldKind(block))) return false
    if (block.type === 'examples' && !hasExamplesField) return false
    return true
  })
}
