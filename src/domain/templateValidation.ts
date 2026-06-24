import {
  BUILDER_PRESETS,
  fieldPresetId,
  fieldsForSide,
  type BuilderPresetId,
} from '@/domain/templateBuilderPresets'
import type { TemplateFieldDef } from '@/types/deckProfile'

export type TemplateValidationResult = {
  valid: boolean
  errors: string[]
}

function presetLabel(preset: BuilderPresetId): string {
  return BUILDER_PRESETS.find((p) => p.id === preset)?.label ?? preset
}

export function validateTemplateFields(fields: TemplateFieldDef[]): TemplateValidationResult {
  const errors: string[] = []
  const front = fieldsForSide(fields, 'front')
  const back = fieldsForSide(fields, 'back')

  if (front.length === 0) {
    errors.push('Add at least one field to the front of the card.')
  }
  if (back.length === 0) {
    errors.push('Add at least one field to the back of the card.')
  }

  const presetSides = new Map<BuilderPresetId, Set<'front' | 'back'>>()
  for (const field of fields) {
    const preset = fieldPresetId(field)
    if (!preset) continue
    const sides = presetSides.get(preset) ?? new Set()
    sides.add(field.side)
    presetSides.set(preset, sides)
  }

  for (const [preset, sides] of presetSides) {
    if (sides.size > 1) {
      errors.push(
        `"${presetLabel(preset)}" cannot appear on both the front and back. Each field belongs on one side only.`,
      )
      continue
    }
    const count = fields.filter((field) => fieldPresetId(field) === preset).length
    if (count > 1) {
      errors.push(`"${presetLabel(preset)}" is duplicated. Each field can only be used once.`)
    }
  }

  return { valid: errors.length === 0, errors }
}
