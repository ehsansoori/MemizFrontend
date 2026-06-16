export type ManualFieldType =
  | 'pronunciation'
  | 'example'
  | 'exampleTranslation'
  | 'image'
  | 'audio'
  | 'notes'
  | 'custom'

/**
 * Manual creation field row. Aligns with draft template extensions in
 * `domain/draftTemplate.ts` for future audio/image/custom template support.
 */
export type ManualField = {
  id: string
  type: ManualFieldType
  value: string
  customLabel?: string
  imagePreviewUrl?: string
}

export const MANUAL_FIELD_OPTIONS: {
  type: ManualFieldType
  label: string
  description: string
}[] = [
  { type: 'pronunciation', label: 'Pronunciation', description: 'Phonetic spelling' },
  { type: 'example', label: 'Example', description: 'Example sentence' },
  {
    type: 'exampleTranslation',
    label: 'Example Translation',
    description: 'Translation for an example',
  },
  { type: 'image', label: 'Image', description: 'Upload or generate an image' },
  { type: 'audio', label: 'Audio', description: 'Word or sentence audio' },
  { type: 'notes', label: 'Notes', description: 'Extra notes' },
  { type: 'custom', label: 'Custom Field', description: 'Your own label and value' },
]

export function createManualField(type: ManualFieldType): ManualField {
  return {
    id: crypto.randomUUID(),
    type,
    value: '',
    customLabel: type === 'custom' ? 'Custom' : undefined,
  }
}

export function manualFieldLabel(field: ManualField): string {
  if (field.type === 'custom') return field.customLabel?.trim() || 'Custom'
  return MANUAL_FIELD_OPTIONS.find((o) => o.type === field.type)?.label ?? field.type
}
