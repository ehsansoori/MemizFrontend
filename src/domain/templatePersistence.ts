import { dedupeTemplateFieldsByPreset } from '@/domain/templateBuilderPresets'
import {
  getBuiltinTemplate,
  isLanguageDefaultTemplate,
  LANGUAGE_DEFAULT_TEMPLATE_ID,
  CUSTOM_TEMPLATE_PREFIX,
} from '@/domain/cardTemplates'
import { validateTemplateFields } from '@/domain/templateValidation'
import { builtinTemplateOverrideRepository } from '@/storage/builtinTemplateOverrideRepository'
import { customTemplateRepository } from '@/storage/customTemplateRepository'
import type { CardTemplate, TemplateFieldDef } from '@/types/deckProfile'

export function saveTemplateFromBuilder(
  name: string,
  fields: TemplateFieldDef[],
  templateId?: string,
): CardTemplate {
  const sanitized = dedupeTemplateFieldsByPreset(fields)
  const validation = validateTemplateFields(sanitized)
  if (!validation.valid) {
    throw new Error(validation.errors[0] ?? 'Invalid template.')
  }
  if (templateId && isLanguageDefaultTemplate(templateId)) {
    return builtinTemplateOverrideRepository.saveOverride(sanitized)
  }
  if (templateId?.startsWith(CUSTOM_TEMPLATE_PREFIX)) {
    return customTemplateRepository.update(templateId, name, sanitized)
  }
  if (templateId && customTemplateRepository.getById(templateId)) {
    return customTemplateRepository.update(templateId, name, sanitized)
  }
  return customTemplateRepository.save(name, sanitized)
}

export function resetTemplateToDefault(templateId: string): CardTemplate | null {
  if (!isLanguageDefaultTemplate(templateId)) return null
  builtinTemplateOverrideRepository.resetOverride()
  return getBuiltinTemplate(LANGUAGE_DEFAULT_TEMPLATE_ID) ?? null
}
