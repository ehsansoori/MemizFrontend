import type { CardFieldKey, CardFieldLayout } from '@/types/cards'
import type { CardTemplate, TemplateFieldDef } from '@/types/deckProfile'
import { dedupeTemplateFieldsByPreset } from '@/domain/templateBuilderPresets'
import { normalizeTemplateId } from '@/domain/migrateTemplateIds'
import {
  BASIC_LANGUAGE_TEMPLATE_ID,
  LANGUAGE_DEFAULT_TEMPLATE_ID,
} from '@/domain/templateIds'
import { templateFieldsToCardTemplate } from '@/domain/templateFieldsToCardTemplate'
import { builtinTemplateOverrideRepository } from '@/storage/builtinTemplateOverrideRepository'
import { createLayoutBlock, normalizeLayoutOrder } from '@/utils/cardLayoutModel'

export {
  BASIC_TEMPLATE_ID,
  BASIC_LANGUAGE_TEMPLATE_ID,
  LANGUAGE_DEFAULT_TEMPLATE_ID,
  QUESTION_ANSWER_TEMPLATE_ID,
  TERM_DEFINITION_TEMPLATE_ID,
  CUSTOM_TEMPLATE_PREFIX,
} from '@/domain/templateIds'

function f(
  id: string,
  key: string,
  label: string,
  side: TemplateFieldDef['side'],
  fieldKind: TemplateFieldDef['fieldKind'],
  config?: TemplateFieldDef['config'],
): TemplateFieldDef {
  return { id, key, label, side, fieldKind, config }
}

function layoutsFromKeys(
  frontKeys: CardFieldKey[],
  backKeys: CardFieldKey[],
): { frontLayout: CardFieldLayout[]; backLayout: CardFieldLayout[] } {
  return {
    frontLayout: normalizeLayoutOrder(frontKeys.map((k, i) => createLayoutBlock(k, i))),
    backLayout: normalizeLayoutOrder(backKeys.map((k, i) => createLayoutBlock(k, i))),
  }
}

/** Canonical Basic Language Template fields (MVP). */
export function createCanonicalBasicLanguageFields(): TemplateFieldDef[] {
  return [
    f('input_front', 'input', 'Input', 'front', 'input'),
    f('pronunciations', 'pronunciations', 'Pronunciations', 'back', 'pronunciations', {
      sources: ['us', 'br'],
    }),
    f('translation', 'translation', 'Translation', 'back', 'translation'),
    f('pos', 'partOfSpeech', 'Part Of Speech', 'back', 'partOfSpeech'),
    f(
      'examples',
      'examples',
      'Examples',
      'back',
      'examples',
      { count: 3, includeTranslation: true },
    ),
  ]
}

/** @deprecated Use createCanonicalBasicLanguageFields */
export const createCanonicalLanguageDefaultFields = createCanonicalBasicLanguageFields

const BASIC_LANGUAGE_TEMPLATE: CardTemplate = (() => {
  const fields = createCanonicalBasicLanguageFields()
  const { frontLayout, backLayout } = layoutsFromKeys(
    ['input'],
    ['pronunciations', 'translation', 'partOfSpeech', 'examples'],
  )
  return {
    id: BASIC_LANGUAGE_TEMPLATE_ID,
    name: 'Basic Language Template',
    description: 'Input on the front; pronunciation, translation, part of speech, and examples on the back.',
    fields,
    isBuiltin: true,
    frontLayout,
    backLayout,
  }
})()

const BUILTIN_TEMPLATES: CardTemplate[] = [BASIC_LANGUAGE_TEMPLATE]

const LEGACY_TEMPLATE_ALIASES: Record<string, string> = {
  basic: BASIC_LANGUAGE_TEMPLATE_ID,
  language_default: BASIC_LANGUAGE_TEMPLATE_ID,
  language_basic: BASIC_LANGUAGE_TEMPLATE_ID,
  language_extended: BASIC_LANGUAGE_TEMPLATE_ID,
  language: BASIC_LANGUAGE_TEMPLATE_ID,
  ielts: BASIC_LANGUAGE_TEMPLATE_ID,
  question_answer: BASIC_LANGUAGE_TEMPLATE_ID,
  term_definition: BASIC_LANGUAGE_TEMPLATE_ID,
}

export function getCanonicalLanguageDefaultTemplate(): CardTemplate {
  return getBuiltinTemplate(BASIC_LANGUAGE_TEMPLATE_ID)!
}

export function getBuiltinTemplates(): CardTemplate[] {
  return BUILTIN_TEMPLATES.map((template) => getBuiltinTemplate(template.id)!)
}

export function getBuiltinTemplate(id: string): CardTemplate | undefined {
  const resolved = LEGACY_TEMPLATE_ALIASES[normalizeTemplateId(id)] ?? normalizeTemplateId(id)
  const base = BUILTIN_TEMPLATES.find((t) => t.id === resolved)
  if (!base) return undefined

  if (resolved === BASIC_LANGUAGE_TEMPLATE_ID) {
    const overrideFields = builtinTemplateOverrideRepository.getOverrideFields()
    if (overrideFields) {
      const sanitized = dedupeTemplateFieldsByPreset(overrideFields)
      return templateFieldsToCardTemplate({
        id: BASIC_LANGUAGE_TEMPLATE_ID,
        name: base.name,
        description: base.description,
        fields: sanitized,
        isBuiltin: true,
      })
    }
  }

  return {
    ...base,
    fields: base.fields.map((field) => ({ ...field })),
  }
}

export function isLanguageDefaultTemplate(id: string | undefined): boolean {
  if (!id) return false
  const normalized = normalizeTemplateId(id)
  return normalized === BASIC_LANGUAGE_TEMPLATE_ID || normalized === LANGUAGE_DEFAULT_TEMPLATE_ID
}

export function isBasicLanguageTemplate(template: Pick<CardTemplate, 'id'>): boolean {
  return isLanguageDefaultTemplate(template.id)
}

/** @deprecated */
export function isBasicTemplate(template: CardTemplate): boolean {
  return isBasicLanguageTemplate(template)
}

export function isTemplateEditable(_template: Pick<CardTemplate, 'id'>): boolean {
  return true
}

export function isCustomTemplate(template: Pick<CardTemplate, 'isBuiltin'>): boolean {
  return !template.isBuiltin
}

export function canEditInDefaultTemplateDropdown(
  template: Pick<CardTemplate, 'id' | 'isBuiltin'>,
): boolean {
  return isCustomTemplate(template) || isLanguageDefaultTemplate(template.id)
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
      .map((block) => block.fieldType)
      .join('|')
  return fieldKey(a.front) === fieldKey(b.front) && fieldKey(a.back) === fieldKey(b.back)
}
