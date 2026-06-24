import type { CardTemplate } from '@/types/deckProfile'
import type { CardGenerationOptionsDto, DifficultyOption, ToneOption } from '@/types/cards'
import type { LanguageDeckSettings } from '@/types/deckProfile'
import { getPronunciationsConfig, resolveFieldKind } from '@/domain/expandTemplateFields'
import {
  countTemplateExamples,
  templateHasPartOfSpeech,
  templateHasPronunciations,
  templateHasTranslation,
  templateIncludesExampleTranslations,
} from '@/domain/templateUtils'

export function templateSupportsAiGeneration(template: CardTemplate): boolean {
  return template.fields.some((f) => {
    if (f.side !== 'front') return false
    const kind = resolveFieldKind(f)
    return kind === 'input' || kind === 'text'
  })
}

/** Single source of truth: map the active template to API generation options. */
export function templateToGenerationOptions(
  template: CardTemplate,
  lang: Pick<LanguageDeckSettings, 'tone' | 'difficulty' | 'sourceLanguage'>,
): CardGenerationOptionsDto {
  const exampleCount = countTemplateExamples(template)
  const hasExamples = exampleCount > 0
  const pronunciationsField = template.fields.find((f) => resolveFieldKind(f) === 'pronunciations')
  const pronunciations = templateHasPronunciations(template) && pronunciationsField
    ? getPronunciationsConfig(pronunciationsField, lang.sourceLanguage).sources
    : []

  return {
    pronunciations,
    includePhonetic: pronunciations.length > 0,
    includePartOfSpeech: templateHasPartOfSpeech(template),
    includeTargetMeaning: templateHasTranslation(template),
    includeEnglishMeaning: false,
    includeExampleTranslations: hasExamples && templateIncludesExampleTranslations(template),
    exampleCount: hasExamples ? exampleCount : 0,
    tone: lang.tone as ToneOption,
    difficulty: lang.difficulty as DifficultyOption,
  }
}
