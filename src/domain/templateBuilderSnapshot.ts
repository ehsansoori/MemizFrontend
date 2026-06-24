import type { TemplateFieldDef } from '@/types/deckProfile'

export type TemplateBuilderSnapshot = {
  name: string
  fields: TemplateFieldDef[]
}

export function cloneTemplateFields(fields: TemplateFieldDef[]): TemplateFieldDef[] {
  return JSON.parse(JSON.stringify(fields)) as TemplateFieldDef[]
}

export function snapshotTemplateBuilder(
  name: string,
  fields: TemplateFieldDef[],
): TemplateBuilderSnapshot {
  return {
    name: name.trim(),
    fields: cloneTemplateFields(fields),
  }
}

function normalizeFieldForCompare(field: TemplateFieldDef) {
  return {
    id: field.id,
    key: field.key,
    label: field.label,
    side: field.side,
    fieldKind: field.fieldKind,
    fieldType: field.fieldType,
    config: field.config ?? null,
  }
}

export function templateBuilderSnapshotsEqual(
  a: TemplateBuilderSnapshot,
  b: TemplateBuilderSnapshot,
): boolean {
  if (a.name.trim() !== b.name.trim()) return false
  if (a.fields.length !== b.fields.length) return false
  const aNorm = a.fields.map(normalizeFieldForCompare)
  const bNorm = b.fields.map(normalizeFieldForCompare)
  return JSON.stringify(aNorm) === JSON.stringify(bNorm)
}
