import {
  DEFAULT_SOURCE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
} from '@/constants/formOptions'
import type { Deck } from '@/types/cards'
import type { CardTemplate, DeckSettings, LanguageDeckSettings } from '@/types/deckProfile'
import { deckTypeSupportsLanguageSettings } from '@/domain/deckTypes'
import { templateToGenerationOptions } from '@/domain/templateGeneration'

export const DEFAULT_AUDIO_PROVIDER = 'system'

export function createDefaultLanguageSettings(): LanguageDeckSettings {
  return {
    sourceLanguage: DEFAULT_SOURCE_LANGUAGE,
    targetLanguage: DEFAULT_TARGET_LANGUAGE,
    difficulty: 'intermediate',
    tone: 'friendly',
    audioProvider: DEFAULT_AUDIO_PROVIDER,
    includePhonetic: true,
    includePartOfSpeech: true,
    includeTargetMeaning: true,
    includeEnglishMeaning: true,
    includeExampleTranslations: true,
  }
}

export function createDefaultDeckSettings(deckTypeId: Deck['deckTypeId']): DeckSettings {
  if (deckTypeSupportsLanguageSettings(deckTypeId)) {
    return { language: createDefaultLanguageSettings() }
  }
  return {}
}

export function resolveDeckSettings(deck: Deck | undefined): DeckSettings {
  if (!deck) return {}
  if (deck.settings) return deck.settings
  if (deckTypeSupportsLanguageSettings(deck.deckTypeId)) {
    return { language: createDefaultLanguageSettings() }
  }
  return {}
}

export function resolveLanguageSettings(deck: Deck | undefined): LanguageDeckSettings | null {
  if (!deckTypeSupportsLanguageSettings(deck?.deckTypeId)) return null
  return resolveDeckSettings(deck).language ?? createDefaultLanguageSettings()
}

export function languageSettingsToGenerationOptions(
  lang: LanguageDeckSettings,
  template: CardTemplate,
) {
  return templateToGenerationOptions(template, lang)
}

export { defaultTemplateIdForDeckType } from '@/domain/templateDeckTypes'
