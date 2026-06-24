import type { ExamplesFieldConfig, TemplateFieldDef, TemplateFieldSide } from '@/types/deckProfile'
import { DEFAULT_ENGLISH_PRONUNCIATION_SOURCES } from '@/domain/pronunciations'

export type BuilderPresetId =
  | 'input'
  | 'translation'
  | 'pronunciations'
  | 'part_of_speech'
  | 'examples'

export const BUILDER_PRESETS: { id: BuilderPresetId; label: string; defaultSide: TemplateFieldSide }[] =
  [
    { id: 'input', label: 'Input', defaultSide: 'front' },
    { id: 'translation', label: 'Translation', defaultSide: 'back' },
    { id: 'pronunciations', label: 'Pronunciations', defaultSide: 'back' },
    { id: 'part_of_speech', label: 'Part Of Speech', defaultSide: 'back' },
    { id: 'examples', label: 'Examples', defaultSide: 'back' },
  ]

export const FRONT_DROP_ID = 'template-drop-front'
export const BACK_DROP_ID = 'template-drop-back'

const DEFAULT_EXAMPLES_CONFIG = {
  count: 3,
  includeTranslation: true,
} satisfies ExamplesFieldConfig

function fieldId(): string {
  return crypto.randomUUID()
}

function baseField(
  key: string,
  label: string,
  side: TemplateFieldSide,
  fieldKind: TemplateFieldDef['fieldKind'],
  config?: TemplateFieldDef['config'],
): TemplateFieldDef {
  const id = fieldId()
  return {
    id,
    key: `${key}_${id.slice(0, 6)}`,
    label,
    side,
    fieldKind,
    config,
  }
}

export function createPresetField(
  preset: BuilderPresetId,
  side: TemplateFieldSide,
): TemplateFieldDef | null {
  switch (preset) {
    case 'input':
      return baseField('input', 'Input', side, 'input')
    case 'translation':
      return baseField('translation', 'Translation', side, 'translation')
    case 'pronunciations':
      return baseField('pronunciations', 'Pronunciations', side, 'pronunciations', {
        sources: [...DEFAULT_ENGLISH_PRONUNCIATION_SOURCES],
      })
    case 'part_of_speech':
      return baseField('partOfSpeech', 'Part Of Speech', side, 'partOfSpeech')
    case 'examples':
      return baseField('examples', 'Examples', side, 'examples', {
        ...DEFAULT_EXAMPLES_CONFIG,
      })
    default:
      return null
  }
}

export function fieldsForSide(fields: TemplateFieldDef[], side: TemplateFieldSide): TemplateFieldDef[] {
  return fields.filter((f) => f.side === side)
}

export function fieldPresetId(field: TemplateFieldDef): BuilderPresetId | null {
  const kind = field.fieldKind
  if (kind === 'input' || field.key.startsWith('input')) return 'input'
  if (kind === 'translation' || field.key.startsWith('translation')) return 'translation'
  if (kind === 'pronunciations' || field.key.startsWith('pronunciations')) return 'pronunciations'
  if (kind === 'partOfSpeech' || field.key.startsWith('partOfSpeech')) return 'part_of_speech'
  if (kind === 'examples' || field.key.startsWith('example')) return 'examples'
  return null
}

export function presetUsedOnSide(
  fields: TemplateFieldDef[],
  side: TemplateFieldSide,
  preset: BuilderPresetId,
  excludeFieldId?: string,
): boolean {
  return fieldsForSide(fields, side)
    .filter((field) => field.id !== excludeFieldId)
    .some((field) => fieldPresetId(field) === preset)
}

export function dedupeTemplateFieldsByPreset(fields: TemplateFieldDef[]): TemplateFieldDef[] {
  const keptByPreset = new Map<BuilderPresetId, TemplateFieldDef>()
  for (const field of fields) {
    const preset = fieldPresetId(field)
    if (!preset) continue
    const existing = keptByPreset.get(preset)
    if (!existing) {
      keptByPreset.set(preset, field)
      continue
    }
    if (field.side === 'front' && existing.side === 'back') {
      keptByPreset.set(preset, field)
    }
  }
  const keptIds = new Set([...keptByPreset.values()].map((field) => field.id))
  return fields.filter((field) => {
    const preset = fieldPresetId(field)
    if (!preset) return true
    return keptIds.has(field.id)
  })
}

export function presetUsedInTemplate(
  fields: TemplateFieldDef[],
  preset: BuilderPresetId,
  excludeFieldId?: string,
): boolean {
  return fields
    .filter((field) => field.id !== excludeFieldId)
    .some((field) => fieldPresetId(field) === preset)
}

export function canAddPresetToSide(
  fields: TemplateFieldDef[],
  _side: TemplateFieldSide,
  preset: BuilderPresetId,
): boolean {
  return !presetUsedInTemplate(fields, preset)
}

export function canMoveFieldToSide(
  fields: TemplateFieldDef[],
  fieldId: string,
  targetSide: TemplateFieldSide,
): boolean {
  const field = fields.find((f) => f.id === fieldId)
  if (!field || field.side === targetSide) return true
  const preset = fieldPresetId(field)
  if (!preset) return true
  return !presetUsedOnSide(fields, targetSide, preset, fieldId)
}

export function availablePresetsForSide(
  fields: TemplateFieldDef[],
  side: TemplateFieldSide,
): BuilderPresetId[] {
  return BUILDER_PRESETS.filter((preset) => canAddPresetToSide(fields, side, preset.id)).map(
    (preset) => preset.id,
  )
}

export function appendFieldToSide(
  fields: TemplateFieldDef[],
  field: TemplateFieldDef,
  side: TemplateFieldSide,
): TemplateFieldDef[] {
  const preset = fieldPresetId(field)
  if (preset && !canAddPresetToSide(fields, side, preset)) return fields
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
  if (!canMoveFieldToSide(fields, fieldId, targetSide)) return fields
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
  return createCanonicalBasicLanguageFieldsFromPresets()
}

function createCanonicalBasicLanguageFieldsFromPresets(): TemplateFieldDef[] {
  return [
    createPresetField('input', 'front')!,
    createPresetField('pronunciations', 'back')!,
    createPresetField('translation', 'back')!,
    createPresetField('part_of_speech', 'back')!,
    createPresetField('examples', 'back')!,
  ]
}

export const DEFAULT_BUILDER_FIELDS: TemplateFieldDef[] = createDefaultBuilderFields()
