import type { CardFieldLayout } from '@/types/cards'
import {
  createDefaultBackLayout,
  createDefaultFrontLayout,
  createLayoutBlock,
  normalizeLayoutOrder,
} from '@/utils/cardLayoutModel'

/** Reserved extension slots for future draft fields (audio, image, custom templates). */
export type DraftTemplateExtensions = {
  audio?: boolean
  image?: boolean
  example?: boolean
  customFields?: boolean
}

export type DraftTemplateId = 'standard' | 'minimal' | 'detailed'

export type DraftTemplate = {
  id: DraftTemplateId
  name: string
  description: string
  frontLayout: CardFieldLayout[]
  backLayout: CardFieldLayout[]
  extensions: DraftTemplateExtensions
}

function minimalBackLayout(): CardFieldLayout[] {
  return normalizeLayoutOrder([
    createLayoutBlock('targetMeaning', 0),
    createLayoutBlock('englishMeaning', 1),
  ])
}

function detailedBackLayout(): CardFieldLayout[] {
  return createDefaultBackLayout()
}

export const DRAFT_TEMPLATES: DraftTemplate[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Word on front, meanings and examples on back.',
    frontLayout: createDefaultFrontLayout(),
    backLayout: createDefaultBackLayout(),
    extensions: { example: true },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Word on front, meanings only on back.',
    frontLayout: createDefaultFrontLayout(),
    backLayout: minimalBackLayout(),
    extensions: {},
  },
  {
    id: 'detailed',
    name: 'Detailed',
    description: 'Word on front, all fields on back.',
    frontLayout: createDefaultFrontLayout(),
    backLayout: detailedBackLayout(),
    extensions: { audio: true, image: true, example: true, customFields: true },
  },
]

export function getDraftTemplate(id: DraftTemplateId): DraftTemplate {
  return DRAFT_TEMPLATES.find((t) => t.id === id) ?? DRAFT_TEMPLATES[0]
}

export function templateLayoutsMatch(
  a: { front: CardFieldLayout[]; back: CardFieldLayout[] },
  b: { front: CardFieldLayout[]; back: CardFieldLayout[] },
): boolean {
  const fieldKey = (layout: CardFieldLayout[]) =>
    normalizeLayoutOrder(layout)
      .map((b) => b.fieldType)
      .join('|')
  return fieldKey(a.front) === fieldKey(b.front) && fieldKey(a.back) === fieldKey(b.back)
}

export type DraftSessionProgress = {
  /** Total cards generated in this session (saved + remaining). */
  draftTotal: number
  saved: number
  remaining: number
}

export function computeDraftProgress(
  draftTotal: number,
  saved: number,
  remaining: number,
): DraftSessionProgress {
  return { draftTotal, saved, remaining }
}
