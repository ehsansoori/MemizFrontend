import type {
  CustomFieldConfig,
  DefinitionFieldConfig,
  ExamplesFieldConfig,
  TemplateFieldDef,
  TemplateFieldKind,
  TemplateFieldSide,
  TemplateFieldType,
} from '@/types/deckProfile'

export type ExpandedTemplateField = {
  id: string
  key: string
  label: string
  side: TemplateFieldSide
  fieldType: TemplateFieldType
  sourceFieldId: string
}

export const CONFIGURABLE_FIELD_KINDS: TemplateFieldKind[] = ['definition', 'examples', 'custom']

function defaultRepeatableConfig(): ExamplesFieldConfig {
  return { count: 1, includeTranslation: true }
}

export function resolveFieldKind(field: TemplateFieldDef): TemplateFieldKind {
  if (field.fieldKind) return field.fieldKind
  if (field.key.startsWith('example') || field.label === 'Examples') return 'examples'
  if (field.key.startsWith('definition') || field.label === 'Definition') return 'definition'
  return (field.fieldType ?? 'text') as TemplateFieldKind
}

export function getExamplesConfig(field: TemplateFieldDef): ExamplesFieldConfig {
  const cfg = field.config as ExamplesFieldConfig | undefined
  if (cfg && typeof cfg.count === 'number') return cfg
  return defaultRepeatableConfig()
}

export function getDefinitionConfig(field: TemplateFieldDef): DefinitionFieldConfig {
  const cfg = field.config as DefinitionFieldConfig | undefined
  if (cfg && typeof cfg.count === 'number') return cfg
  return defaultRepeatableConfig()
}

export function getCustomConfig(field: TemplateFieldDef): CustomFieldConfig {
  const cfg = field.config as CustomFieldConfig | undefined
  if (cfg && 'fieldType' in cfg) return cfg
  return {
    name: field.label,
    fieldType: 'editableText',
    count: 1,
    audioSource: 'upload',
    videoSource: 'upload',
  }
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

function expandRepeatableSlots(
  source: TemplateFieldDef,
  cfg: ExamplesFieldConfig,
  baseKey: string,
  baseLabel: string,
  translationKeyPrefix: string,
  translationLabel: string,
): ExpandedTemplateField[] {
  const rows: ExpandedTemplateField[] = []
  for (let i = 1; i <= cfg.count; i++) {
    const key = cfg.count === 1 ? `${baseKey}_1` : `${baseKey}_${i}`
    const label = cfg.count > 1 ? `${baseLabel} ${i}` : baseLabel
    rows.push(expanded(source, key, label, 'longText'))
    if (cfg.includeTranslation) {
      const tKey = cfg.count === 1 ? `${translationKeyPrefix}_1` : `${translationKeyPrefix}_${i}`
      const tLabel = cfg.count > 1 ? `${translationLabel} ${i}` : translationLabel
      rows.push(expanded(source, tKey, tLabel, 'longText'))
    }
  }
  return rows
}

export function expandTemplateField(field: TemplateFieldDef): ExpandedTemplateField[] {
  const kind = resolveFieldKind(field)

  if (kind === 'examples') {
    return expandRepeatableSlots(
      field,
      getExamplesConfig(field),
      'example',
      'Example',
      'example_translation',
      'Translation',
    )
  }

  if (kind === 'definition') {
    return expandRepeatableSlots(
      field,
      getDefinitionConfig(field),
      'definition',
      'Definition',
      'definition_translation',
      'Translation',
    )
  }

  if (kind === 'custom') {
    const cfg = getCustomConfig(field)
    const count = Math.min(10, Math.max(1, cfg.count))
    const slots = count > 1 ? count : 1

    const fieldTypeForCustom = (): TemplateFieldType => {
      switch (cfg.fieldType) {
        case 'image':
          return 'image'
        case 'audio':
          return 'audio'
        case 'video':
          return 'video'
        case 'text':
        case 'editableText':
        default:
          return cfg.fieldType === 'editableText' ? 'longText' : 'text'
      }
    }

    const type = fieldTypeForCustom()
    if (cfg.fieldType === 'text') {
      return [expanded(field, field.key, cfg.name, 'text')]
    }

    if (slots === 1) {
      return [expanded(field, field.key, cfg.name, type)]
    }

    return Array.from({ length: slots }, (_, i) => {
      const n = i + 1
      return expanded(field, `${field.key}_${n}`, `${cfg.name} ${n}`, type)
    })
  }

  if (field.label === 'Meaning' || field.key.startsWith('meaning')) {
    return [expanded(field, 'targetMeaning', 'Meaning', 'longText')]
  }
  if (field.label === 'Pronunciation' || field.key.startsWith('phonetic')) {
    return [expanded(field, 'phonetic', 'Pronunciation', 'text')]
  }
  if (field.label === 'Note' || field.key.startsWith('note')) {
    return [expanded(field, 'notes', 'Note', 'longText')]
  }

  const fieldType = (field.fieldType ?? kind) as TemplateFieldType
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

function formatRepeatableSummary(cfg: ExamplesFieldConfig): string {
  const parts = [`Count: ${cfg.count}`]
  parts.push(cfg.includeTranslation ? 'Translation: Yes' : 'Translation: Off')
  return parts.join(' · ')
}

export function formatFieldConfigSummary(field: TemplateFieldDef): string | null {
  const kind = resolveFieldKind(field)
  switch (kind) {
    case 'examples':
      return formatRepeatableSummary(getExamplesConfig(field))
    case 'definition':
      return formatRepeatableSummary(getDefinitionConfig(field))
    case 'custom': {
      const cfg = getCustomConfig(field)
      const typeLabel =
        cfg.fieldType === 'editableText'
          ? 'Editable Text'
          : cfg.fieldType.charAt(0).toUpperCase() + cfg.fieldType.slice(1)
      const parts = [typeLabel]
      if (cfg.count > 1) parts.push(`Count: ${cfg.count}`)
      if (cfg.fieldType === 'audio' && cfg.audioSource) {
        parts.push(cfg.audioSource === 'upload' ? 'Upload' : 'Record')
      }
      if (cfg.fieldType === 'video' && cfg.videoSource) {
        parts.push(cfg.videoSource === 'upload' ? 'Upload' : 'Record')
      }
      return parts.join(' · ')
    }
    default:
      return null
  }
}

export function isConfigurableField(field: TemplateFieldDef): boolean {
  return CONFIGURABLE_FIELD_KINDS.includes(resolveFieldKind(field))
}
