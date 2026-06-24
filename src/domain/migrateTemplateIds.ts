import { LANGUAGE_DEFAULT_TEMPLATE_ID } from '@/domain/templateIds'

export const LEGACY_LANGUAGE_TEMPLATE_IDS = new Set([
  'language_basic',
  'language_extended',
  'language',
  'ielts',
])

export function isLegacyLanguageTemplateId(id: string | undefined): boolean {
  if (!id) return false
  return LEGACY_LANGUAGE_TEMPLATE_IDS.has(id)
}

/** Maps legacy language template ids to Language Default. */
export function normalizeTemplateId(id: string | undefined): string {
  if (!id) return id ?? ''
  if (LEGACY_LANGUAGE_TEMPLATE_IDS.has(id)) return LANGUAGE_DEFAULT_TEMPLATE_ID
  return id
}
