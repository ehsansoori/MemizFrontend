import type { TemplateFieldDef } from '@/types/deckProfile'
import type { CardTemplate } from '@/types/deckProfile'
import {
  getCustomConfig,
  getDefinitionConfig,
  getExamplesConfig,
  resolveFieldKind,
} from '@/domain/expandTemplateFields'

export type SimpleCardPatchKey =
  | 'word'
  | 'phonetic'
  | 'partOfSpeech'
  | 'targetMeaning'
  | 'englishMeaning'
  | 'notes'

export type TemplateCardBlock =
  | {
      type: 'simple'
      id: string
      label: string
      patchKey: SimpleCardPatchKey
      input: 'text' | 'multiline' | 'tag'
      prominent?: boolean
    }
  | {
      type: 'examples'
      id: string
      label: string
      count: number
      includeTranslation: boolean
    }
  | {
      type: 'definitions'
      id: string
      label: string
      count: number
      includeTranslation: boolean
    }
  | { type: 'audio'; id: string; label: string }
  | { type: 'image'; id: string; label: string }
  | {
      type: 'custom'
      id: string
      label: string
      count: number
      input: 'text' | 'multiline' | 'image' | 'audio' | 'video'
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

  if (kind === 'definition') {
    const cfg = getDefinitionConfig(field)
    return {
      type: 'definitions',
      id: field.id,
      label: field.label,
      count: cfg.count,
      includeTranslation: cfg.includeTranslation,
    }
  }

  if (kind === 'custom') {
    const cfg = getCustomConfig(field)
    const input =
      cfg.fieldType === 'editableText'
        ? 'multiline'
        : cfg.fieldType === 'image'
          ? 'image'
          : cfg.fieldType === 'audio'
            ? 'audio'
            : cfg.fieldType === 'video'
              ? 'video'
              : 'text'
    return {
      type: 'custom',
      id: field.id,
      label: cfg.name,
      count: Math.max(1, cfg.count),
      input,
    }
  }

  if (field.fieldType === 'audio' || kind === 'audio') {
    return { type: 'audio', id: field.id, label: field.label }
  }

  if (field.fieldType === 'image') {
    return { type: 'image', id: field.id, label: field.label }
  }

  if (field.label === 'Word' || field.key.startsWith('word')) {
    return {
      type: 'simple',
      id: field.id,
      label: field.label,
      patchKey: 'word',
      input: 'text',
      prominent: true,
    }
  }

  if (field.label === 'Meaning' || field.key.startsWith('meaning')) {
    return {
      type: 'simple',
      id: field.id,
      label: field.label,
      patchKey: 'targetMeaning',
      input: 'multiline',
    }
  }

  if (field.label === 'Pronunciation' || field.key.startsWith('phonetic')) {
    return {
      type: 'simple',
      id: field.id,
      label: field.label,
      patchKey: 'phonetic',
      input: 'text',
    }
  }

  if (field.label === 'Part Of Speech' || field.key.startsWith('part_of_speech')) {
    return {
      type: 'simple',
      id: field.id,
      label: field.label,
      patchKey: 'partOfSpeech',
      input: 'tag',
    }
  }

  if (field.label === 'Note' || field.key.startsWith('note')) {
    return {
      type: 'simple',
      id: field.id,
      label: field.label,
      patchKey: 'notes',
      input: 'multiline',
    }
  }

  return {
    type: 'simple',
    id: field.id,
    label: field.label,
    patchKey: 'notes',
    input: field.fieldType === 'longText' ? 'multiline' : 'text',
  }
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
