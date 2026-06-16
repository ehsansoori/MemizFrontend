import type { CardTemplate } from '@/types/deckProfile'
import type { DifficultyOption, ToneOption } from '@/types/cards'
import type { LanguageDeckSettings } from '@/types/deckProfile'
import { resolveFieldKind } from '@/domain/expandTemplateFields'
import {
  countTemplateExamples,
  templateHasPartOfSpeech,
  templateIncludesExampleTranslations,
} from '@/domain/templateUtils'

function templateHasPhonetic(template: CardTemplate): boolean {
  return template.fields.some(
    (f) =>
      f.label === 'Pronunciation' ||
      f.key.startsWith('phonetic') ||
      resolveFieldKind(f) === 'text' && f.label.toLowerCase().includes('pronunciation'),
  )
}

function templateHasMeaning(template: CardTemplate): boolean {
  return template.fields.some(
    (f) => f.label === 'Meaning' || f.key.startsWith('meaning') || f.key.startsWith('targetMeaning'),
  )
}

export function templateToGenerationOptions(
  template: CardTemplate,
  lang: LanguageDeckSettings,
) {
  const includeExamples = countTemplateExamples(template) > 0

  return {
    includePhonetic: templateHasPhonetic(template),
    includePartOfSpeech: templateHasPartOfSpeech(template),
    includeTargetMeaning: templateHasMeaning(template),
    includeEnglishMeaning: false,
    includeExampleTranslations:
      includeExamples && templateIncludesExampleTranslations(template),
    tone: lang.tone as ToneOption,
    difficulty: lang.difficulty as DifficultyOption,
    exampleCount: countTemplateExamples(template),
  }
}
