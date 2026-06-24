import { expandTemplateFields } from '@/domain/expandTemplateFields'
import type { CardFieldKey } from '@/types/cards'
import type { CardTemplate, TemplateFieldDef } from '@/types/deckProfile'
import { createLayoutBlock, normalizeLayoutOrder, partitionLayouts } from '@/utils/cardLayoutModel'

function expandedKeyToFieldKey(key: string): CardFieldKey {
  const k = key.toLowerCase()
  if (k === 'input' || k === 'word' || k === 'front') return 'input'
  if (k === 'translation' || k.includes('meaning') || k === 'back') return 'translation'
  if (k.includes('pronunciation') || k.includes('phonetic')) return 'pronunciations'
  if (k.includes('speech') || k === 'pos' || k === 'partofspeech') return 'partOfSpeech'
  if (k.includes('example')) return 'examples'
  return 'input'
}

export function templateFieldsToCardTemplate(params: {
  id: string
  name: string
  description: string
  fields: TemplateFieldDef[]
  isBuiltin: boolean
}): CardTemplate {
  const expanded = expandTemplateFields(params.fields)
  const frontFields = expanded.filter((f) => f.side === 'front')
  const backFields = expanded.filter((f) => f.side === 'back')
  const frontLayout = normalizeLayoutOrder(
    frontFields.map((f, i) => createLayoutBlock(expandedKeyToFieldKey(f.key), i)),
  )
  const backLayout = normalizeLayoutOrder(
    backFields.map((f, i) => createLayoutBlock(expandedKeyToFieldKey(f.key), i)),
  )
  const partitioned = partitionLayouts(frontLayout, backLayout)
  return {
    id: params.id,
    name: params.name,
    description: params.description,
    fields: params.fields.map((f) => ({ ...f })),
    isBuiltin: params.isBuiltin,
    frontLayout: partitioned.front,
    backLayout: partitioned.back,
  }
}
