import type { CardFieldKey, CardFieldLayout } from '@/types/cards'
import type { CardTemplate, TemplateFieldDef } from '@/types/deckProfile'
import { createLayoutBlock, normalizeLayoutOrder } from '@/utils/cardLayoutModel'

export const BASIC_TEMPLATE_ID = 'basic'
export const CUSTOM_TEMPLATE_PREFIX = 'custom:'

function f(
  id: string,
  key: string,
  label: string,
  side: TemplateFieldDef['side'],
  fieldKind: TemplateFieldDef['fieldKind'],
  config?: TemplateFieldDef['config'],
  fieldType?: TemplateFieldDef['fieldType'],
): TemplateFieldDef {
  return { id, key, label, side, fieldKind, fieldType, config }
}

function layoutsFromLegacy(
  frontKeys: CardFieldKey[],
  backKeys: CardFieldKey[],
): { frontLayout: CardFieldLayout[]; backLayout: CardFieldLayout[] } {
  return {
    frontLayout: normalizeLayoutOrder(frontKeys.map((k, i) => createLayoutBlock(k, i))),
    backLayout: normalizeLayoutOrder(backKeys.map((k, i) => createLayoutBlock(k, i))),
  }
}

const BASIC_TEMPLATE: CardTemplate = (() => {
  const fields = [
    f('word', 'word', 'Word', 'front', 'text', undefined, 'text'),
    f('meaning', 'meaning', 'Meaning', 'back', 'longText', undefined, 'longText'),
  ]
  const { frontLayout, backLayout } = layoutsFromLegacy(['word'], ['targetMeaning'])
  return {
    id: BASIC_TEMPLATE_ID,
    name: 'Basic',
    description: 'Word on the front, meaning on the back.',
    fields,
    isBuiltin: true,
    frontLayout,
    backLayout,
  }
})()

const BUILTIN_TEMPLATES: CardTemplate[] = [BASIC_TEMPLATE]

/** Maps removed built-in template ids to Basic for existing decks and cards. */
const LEGACY_TEMPLATE_ALIASES: Record<string, string> = {
  language: BASIC_TEMPLATE_ID,
  language_basic: BASIC_TEMPLATE_ID,
  language_extended: BASIC_TEMPLATE_ID,
  ielts: BASIC_TEMPLATE_ID,
  question_answer: BASIC_TEMPLATE_ID,
  term_definition: BASIC_TEMPLATE_ID,
}

export function getBuiltinTemplates(): CardTemplate[] {
  return BUILTIN_TEMPLATES
}

export function getBuiltinTemplate(id: string): CardTemplate | undefined {
  const resolved = LEGACY_TEMPLATE_ALIASES[id] ?? id
  return BUILTIN_TEMPLATES.find((t) => t.id === resolved)
}

export function isBasicTemplate(template: CardTemplate): boolean {
  return template.id === BASIC_TEMPLATE_ID
}

export function templateFieldCount(template: CardTemplate): number {
  return template.fields.length
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
