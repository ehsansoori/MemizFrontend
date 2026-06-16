import type {
  CustomFieldConfig,
  DefinitionFieldConfig,
  ExamplesFieldConfig,
  TemplateFieldDef,
  TemplateFieldKind,
  TemplateFieldSide,
  TemplateFieldType,
} from '@/types/deckProfile'

export type BuilderPresetId =
  | 'word'
  | 'meaning'
  | 'pronunciation'
  | 'pronunciation_audio'
  | 'part_of_speech'
  | 'note'
  | 'image'
  | 'definition'
  | 'examples'
  | 'custom'

export const BUILDER_PRESETS: { id: BuilderPresetId; label: string; defaultSide: TemplateFieldSide }[] =
  [
    { id: 'word', label: 'Word', defaultSide: 'front' },
    { id: 'meaning', label: 'Meaning', defaultSide: 'back' },
    { id: 'pronunciation', label: 'Pronunciation', defaultSide: 'front' },
    { id: 'pronunciation_audio', label: 'Pronunciation Audio', defaultSide: 'front' },
    { id: 'part_of_speech', label: 'Part Of Speech', defaultSide: 'back' },
    { id: 'note', label: 'Note', defaultSide: 'back' },
    { id: 'image', label: 'Image', defaultSide: 'back' },
    { id: 'definition', label: 'Definition', defaultSide: 'back' },
    { id: 'examples', label: 'Examples', defaultSide: 'back' },
    { id: 'custom', label: 'Custom Field', defaultSide: 'back' },
  ]

export const FRONT_DROP_ID = 'template-drop-front'
export const BACK_DROP_ID = 'template-drop-back'

const DEFAULT_REPEATABLE_CONFIG = {
  count: 1,
  includeTranslation: true,
} satisfies ExamplesFieldConfig

function fieldId(): string {
  return crypto.randomUUID()
}

function baseField(
  key: string,
  label: string,
  side: TemplateFieldSide,
  fieldKind: TemplateFieldKind,
  fieldType?: TemplateFieldType,
  config?: TemplateFieldDef['config'],
): TemplateFieldDef {
  const id = fieldId()
  return {
    id,
    key: `${key}_${id.slice(0, 6)}`,
    label,
    side,
    fieldKind,
    fieldType,
    config,
  }
}

export function createPresetField(
  preset: BuilderPresetId,
  side: TemplateFieldSide,
  custom?: CustomFieldConfig,
): TemplateFieldDef | null {
  switch (preset) {
    case 'word':
      return baseField('word', 'Word', side, 'text', 'text')
    case 'meaning':
      return baseField('meaning', 'Meaning', side, 'longText', 'longText')
    case 'pronunciation':
      return baseField('phonetic', 'Pronunciation', side, 'text', 'text')
    case 'pronunciation_audio':
      return baseField('pronunciation_audio', 'Pronunciation Audio', side, 'audio', 'audio')
    case 'part_of_speech':
      return baseField('part_of_speech', 'Part Of Speech', side, 'tag', 'tag')
    case 'note':
      return baseField('note', 'Note', side, 'longText', 'longText')
    case 'image':
      return baseField('image', 'Image', side, 'image', 'image')
    case 'definition':
      return baseField('definition', 'Definition', side, 'definition', 'longText', {
        ...DEFAULT_REPEATABLE_CONFIG,
      } satisfies DefinitionFieldConfig)
    case 'examples':
      return baseField('examples', 'Examples', side, 'examples', 'longText', {
        ...DEFAULT_REPEATABLE_CONFIG,
      } satisfies ExamplesFieldConfig)
    case 'custom':
      return baseField(
        'custom',
        custom?.name ?? 'Custom Field',
        side,
        'custom',
        'text',
        custom ?? {
          name: 'Custom Field',
          fieldType: 'editableText',
          count: 1,
        },
      )
    default:
      return null
  }
}

export function fieldsForSide(fields: TemplateFieldDef[], side: TemplateFieldSide): TemplateFieldDef[] {
  return fields.filter((f) => f.side === side)
}

export function appendFieldToSide(
  fields: TemplateFieldDef[],
  field: TemplateFieldDef,
  side: TemplateFieldSide,
): TemplateFieldDef[] {
  const front = fieldsForSide(fields, 'front')
  const back = fieldsForSide(fields, 'back')
  return side === 'front' ? [...front, field, ...back] : [...front, ...back, field]
}

export function reorderFieldsOnSide(
  fields: TemplateFieldDef[],
  side: TemplateFieldSide,
  activeId: string,
  overId: string,
): TemplateFieldDef[] {
  const sideFields = fieldsForSide(fields, side)
  const other = fields.filter((f) => f.side !== side)
  const oldIndex = sideFields.findIndex((f) => f.id === activeId)
  const newIndex = sideFields.findIndex((f) => f.id === overId)
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return fields
  const reordered = [...sideFields]
  const [moved] = reordered.splice(oldIndex, 1)
  reordered.splice(newIndex, 0, moved)
  return side === 'front' ? [...reordered, ...other] : [...other, ...reordered]
}

export function moveFieldToSide(
  fields: TemplateFieldDef[],
  fieldId: string,
  targetSide: TemplateFieldSide,
  overId?: string,
): TemplateFieldDef[] {
  const field = fields.find((f) => f.id === fieldId)
  if (!field) return fields
  const without = fields.filter((f) => f.id !== fieldId)
  const moved = { ...field, side: targetSide }
  const targetSideFields = fieldsForSide(without, targetSide)
  if (!overId || overId === FRONT_DROP_ID || overId === BACK_DROP_ID) {
    const insertAt =
      targetSide === 'front'
        ? targetSideFields.length
        : without.filter((f) => f.side === 'front').length + targetSideFields.length
    const next = [...without]
    next.splice(insertAt, 0, moved)
    return next
  }
  const overIndex = targetSideFields.findIndex((f) => f.id === overId)
  const frontCount = without.filter((f) => f.side === 'front').length
  const insertAt =
    targetSide === 'front'
      ? overIndex < 0
        ? targetSideFields.length
        : overIndex
      : overIndex < 0
        ? frontCount + targetSideFields.length
        : frontCount + overIndex
  const next = [...without]
  next.splice(insertAt, 0, moved)
  return next
}

export function createDefaultBuilderFields(): TemplateFieldDef[] {
  return [createPresetField('word', 'front')!, createPresetField('meaning', 'back')!]
}

export const DEFAULT_BUILDER_FIELDS: TemplateFieldDef[] = createDefaultBuilderFields()
