import type { Deck } from '@/types/cards'
import type { CardTemplate } from '@/types/deckProfile'
import {
  BASIC_TEMPLATE_ID,
  CUSTOM_TEMPLATE_PREFIX,
  getBuiltinTemplate,
  getBuiltinTemplates,
} from '@/domain/cardTemplates'
import { customTemplateRepository } from '@/storage/customTemplateRepository'

export function resolveDeckDefaultTemplateId(deck: Deck | undefined): string {
  return deck?.defaultTemplateId ?? deck?.templateId ?? BASIC_TEMPLATE_ID
}

/** @deprecated Use resolveDeckDefaultTemplateId */
export function resolveDeckTemplateId(deck: Deck | undefined): string {
  return resolveDeckDefaultTemplateId(deck)
}

export function resolveCardTemplate(templateId: string | undefined): CardTemplate {
  const id = templateId ?? BASIC_TEMPLATE_ID
  if (id.startsWith(CUSTOM_TEMPLATE_PREFIX)) {
    return customTemplateRepository.getById(id) ?? getBuiltinTemplate(BASIC_TEMPLATE_ID)!
  }
  return getBuiltinTemplate(id) ?? getBuiltinTemplate(BASIC_TEMPLATE_ID)!
}

export function resolveDeckDefaultTemplate(deck: Deck | undefined): CardTemplate {
  return resolveCardTemplate(resolveDeckDefaultTemplateId(deck))
}

/** @deprecated Use resolveDeckDefaultTemplate */
export function resolveDeckCardTemplate(deck: Deck | undefined): CardTemplate {
  return resolveDeckDefaultTemplate(deck)
}

export function listAllTemplates(): CardTemplate[] {
  return [...getBuiltinTemplates(), ...customTemplateRepository.getAll()]
}
