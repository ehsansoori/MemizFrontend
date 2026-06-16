import type { CardFieldLayout, DifficultyOption, ToneOption } from '@/types/cards'

/** Purpose of a deck — drives which settings are available. */
export type DeckTypeId =
  | 'language_learning'
  | 'it_certification'
  | 'medical'
  | 'history'
  | 'geography'
  | 'law'
  | 'custom'

export type TemplateFieldType =
  | 'text'
  | 'longText'
  | 'audio'
  | 'image'
  | 'video'
  | 'tag'
  | 'url'
  | 'number'

/** Semantic field kinds — may expand into multiple concrete fields. */
export type TemplateFieldKind = TemplateFieldType | 'examples' | 'definition' | 'custom'

export type RepeatableFieldConfig = {
  count: 1 | 2 | 3 | 4 | 5
  includeTranslation: boolean
}

export type ExamplesFieldConfig = RepeatableFieldConfig
export type DefinitionFieldConfig = RepeatableFieldConfig

export type CustomFieldType = 'text' | 'editableText' | 'image' | 'audio' | 'video'
export type MediaSourceMode = 'upload' | 'record'

export type CustomFieldConfig = {
  name: string
  fieldType: CustomFieldType
  count: number
  audioSource?: MediaSourceMode
  videoSource?: MediaSourceMode
}

export type TemplateFieldConfig =
  | ExamplesFieldConfig
  | DefinitionFieldConfig
  | CustomFieldConfig

export type TemplateFieldSide = 'front' | 'back'

/** One field slot on a card template (no language/generation settings). */
export type TemplateFieldDef = {
  id: string
  key: string
  label: string
  side: TemplateFieldSide
  fieldKind?: TemplateFieldKind
  fieldType?: TemplateFieldType
  config?: TemplateFieldConfig
}

/** Card layout template — fields only. */
export type CardTemplate = {
  id: string
  name: string
  description: string
  fields: TemplateFieldDef[]
  isBuiltin: boolean
  frontLayout: CardFieldLayout[]
  backLayout: CardFieldLayout[]
}

/** Language-specific deck settings (not part of templates). */
export type LanguageDeckSettings = {
  sourceLanguage: string
  targetLanguage: string
  difficulty: DifficultyOption
  tone: ToneOption
  audioProvider: string
  includePhonetic: boolean
  includePartOfSpeech: boolean
  includeTargetMeaning: boolean
  includeEnglishMeaning: boolean
  includeExampleTranslations: boolean
}

export type DeckSettings = {
  language?: LanguageDeckSettings
}

export type CreateDeckParams = {
  name: string
  deckTypeId: DeckTypeId
  defaultTemplateId: string
  settings?: DeckSettings
}
