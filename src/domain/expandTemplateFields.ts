import type { ExamplesFieldConfig, PronunciationsFieldConfig, TemplateFieldDef, TemplateFieldKind, TemplateFieldType } from '@/types/deckProfile'
import { defaultPronunciationSourcesForLanguage, normalizePronunciationSources } from '@/domain/pronunciations'

export type ExpandedTemplateField = {
  id: string
  key: string
  label: string
  side: TemplateFieldDef['side']
  fieldType: TemplateFieldType
  sourceFieldId: string
}

export const CONFIGURABLE_FIELD_KINDS: TemplateFieldKind[] = ['examples', 'pronunciations']

function defaultExamplesConfig(): ExamplesFieldConfig {
  return { count: 3, includeTranslation: true }
}

function defaultPronunciationsConfig(sourceLanguage?: string): PronunciationsFieldConfig {
  return { sources: defaultPronunciationSourcesForLanguage(sourceLanguage) }
}

export function resolveFieldKind(field: TemplateFieldDef): TemplateFieldKind {
  if (field.fieldKind) {
    const kind = field.fieldKind as string
    if (kind === 'word' || kind === 'text') return 'input'
    if (
      kind === 'longText' &&
      (field.key.startsWith('translation') || field.label === 'Translation')
    ) {
      return 'translation'
    }
    return field.fieldKind
  }
  const key = field.key.toLowerCase()
  if (key.startsWith('input') || key === 'word' || key === 'term' || key === 'question' || key === 'front') {
    return 'input'
  }
  if (
    key.startsWith('translation') ||
    key.includes('meaning') ||
    key === 'definition' ||
    key === 'answer' ||
    key === 'back'
  ) {
    return 'translation'
  }
  if (key.startsWith('pronunciations') || key.includes('phonetic') || key.includes('pronunciation')) {
    return 'pronunciations'
  }
  if (key.startsWith('partofspeech') || key.startsWith('part_of_speech') || key === 'pos') {
    return 'partOfSpeech'
  }
  if (key.startsWith('example') || field.label === 'Examples') return 'examples'
  if (field.label === 'Word' || field.label === 'Input') return 'input'
  if (field.label === 'Translation' || field.label === 'Meaning') return 'translation'
  if (field.label === 'Pronunciations' || field.label === 'Pronunciation') return 'pronunciations'
  if (field.label === 'Part Of Speech') return 'partOfSpeech'
  return (field.fieldType ?? 'text') as TemplateFieldKind
}

export function getExamplesConfig(field: TemplateFieldDef): ExamplesFieldConfig {
  const cfg = field.config as ExamplesFieldConfig | undefined
  if (cfg && typeof cfg.count === 'number') {
    const count = Math.min(5, Math.max(1, Math.round(cfg.count))) as ExamplesFieldConfig['count']
    return {
      count,
      includeTranslation: cfg.includeTranslation ?? true,
    }
  }
  return defaultExamplesConfig()
}

export function getPronunciationsConfig(
  field: TemplateFieldDef,
  sourceLanguage?: string,
): PronunciationsFieldConfig {
  const cfg = field.config as PronunciationsFieldConfig | undefined
  if (cfg && Array.isArray(cfg.sources)) {
    return { sources: normalizePronunciationSources(cfg.sources) }
  }
  return defaultPronunciationsConfig(sourceLanguage)
}

function expanded(
  source: TemplateFieldDef,
  key: string,
  label: string,
  fieldType: TemplateFieldType,
): ExpandedTemplateField {
  return {
    id: `${source.id}__${key}`,
    key,
    label,
    side: source.side,
    fieldType,
    sourceFieldId: source.id,
  }
}

export function expandTemplateField(field: TemplateFieldDef): ExpandedTemplateField[] {
  const kind = resolveFieldKind(field)

  if (kind === 'input') {
    return [expanded(field, 'input', field.label, 'text')]
  }
  if (kind === 'translation') {
    return [expanded(field, 'translation', field.label, 'longText')]
  }
  if (kind === 'pronunciations') {
    return [expanded(field, 'pronunciations', field.label, 'text')]
  }
  if (kind === 'partOfSpeech') {
    return [expanded(field, 'partOfSpeech', field.label, 'tag')]
  }
  if (kind === 'examples') {
    return [expanded(field, 'examples', field.label, 'longText')]
  }

  const fieldType = (field.fieldType ?? 'text') as TemplateFieldType
  return [
    {
      id: field.id,
      key: field.key,
      label: field.label,
      side: field.side,
      fieldType,
      sourceFieldId: field.id,
    },
  ]
}

export function expandTemplateFields(fields: TemplateFieldDef[]): ExpandedTemplateField[] {
  return fields.flatMap(expandTemplateField)
}

export function formatFieldConfigSummary(field: TemplateFieldDef): string | null {
  const kind = resolveFieldKind(field)
  if (kind === 'examples') {
    const cfg = getExamplesConfig(field)
    return [`Count: ${cfg.count}`, cfg.includeTranslation ? 'Translation: Yes' : 'Translation: Off'].join(
      ' · ',
    )
  }
  if (kind === 'pronunciations') {
    const cfg = getPronunciationsConfig(field)
    return cfg.sources.length > 0 ? `Sources: ${cfg.sources.join(', ')}` : 'No sources'
  }
  return null
}

export function isConfigurableField(field: TemplateFieldDef): boolean {
  return CONFIGURABLE_FIELD_KINDS.includes(resolveFieldKind(field))
}
