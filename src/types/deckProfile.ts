import type { CardFieldLayout, DifficultyOption, ToneOption } from '@/types/cards'

/** Purpose of a deck — drives which settings are available. */
export type DeckTypeId =
  | 'language_learning'
  | 'question_answer'
  | 'term_definition'
  | 'custom'
  | 'it_certification'
  | 'medical'
  | 'history'
  | 'geography'
  | 'law'

export type TemplateFieldType =
  | 'text'
  | 'longText'
  | 'audio'
  | 'image'
  | 'video'
  | 'tag'
  | 'url'
  | 'number'

/** Semantic field kinds for language card templates. */
export type TemplateFieldKind =
  | TemplateFieldType
  | 'input'
  | 'translation'
  | 'pronunciations'
  | 'partOfSpeech'
  | 'examples'

export type RepeatableFieldConfig = {
  count: 1 | 2 | 3 | 4 | 5
  includeTranslation: boolean
}

export type ExamplesFieldConfig = RepeatableFieldConfig
export type DefinitionFieldConfig = RepeatableFieldConfig

/** Accent/source codes requested during generation (e.g. us, br). */
export type PronunciationsFieldConfig = {
  sources: string[]
}

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
  | PronunciationsFieldConfig
  | CustomFieldConfig

export type TemplateFieldSide = 'front' | 'back'

/** Where a template field is placed — each field exists on exactly one side. */
export type FieldPlacement = TemplateFieldSide

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
