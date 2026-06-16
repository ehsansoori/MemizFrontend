import { BottomSheet } from '@/components/decks/BottomSheet'
import { SelectField } from '@/components/ui/SelectField'
import { ToggleField } from '@/components/ui/ToggleField'
import { DRAFT_TEMPLATES, type DraftTemplateId } from '@/domain/draftTemplate'
import {
  DIFFICULTY_OPTIONS,
  EXAMPLE_COUNT_OPTIONS,
  LANGUAGE_OPTIONS,
  TONE_OPTIONS,
} from '@/constants/formOptions'
import type { CardGenerationOptionsDto } from '@/types/cards'

type AdvancedSettingsSheetProps = {
  open: boolean
  onClose: () => void
  sourceLanguage: string
  targetLanguage: string
  options: CardGenerationOptionsDto
  templateId: DraftTemplateId
  disabled?: boolean
  onSourceLanguageChange: (value: string) => void
  onTargetLanguageChange: (value: string) => void
  onOptionsChange: <K extends keyof CardGenerationOptionsDto>(
    key: K,
    value: CardGenerationOptionsDto[K],
  ) => void
  onTemplateChange: (templateId: DraftTemplateId) => void
}

export function AdvancedSettingsSheet({
  open,
  onClose,
  sourceLanguage,
  targetLanguage,
  options,
  templateId,
  disabled,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onOptionsChange,
  onTemplateChange,
}: AdvancedSettingsSheetProps) {
  const includeMeanings = options.includeTargetMeaning && options.includeEnglishMeaning

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      busy={disabled}
      title="Advanced settings"
      heading={
        <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Advanced Settings</h2>
      }
    >
      <div className="max-h-[70dvh] space-y-4 overflow-y-auto px-5 pb-5 scrollbar-minimal">
        <SelectField
          id="adv-template"
          label="Card Template"
          options={DRAFT_TEMPLATES.map((t) => ({ value: t.id, label: t.name }))}
          value={templateId}
          onChange={(e) => onTemplateChange(e.target.value as DraftTemplateId)}
          disabled={disabled}
          hint={
            DRAFT_TEMPLATES.find((t) => t.id === templateId)?.description
          }
        />
        <SelectField
          id="adv-source-lang"
          label="Source Language"
          options={LANGUAGE_OPTIONS}
          value={sourceLanguage}
          onChange={(e) => onSourceLanguageChange(e.target.value)}
          disabled={disabled}
        />
        <SelectField
          id="adv-target-lang"
          label="Target Language"
          options={LANGUAGE_OPTIONS.filter((o) => o.value !== 'auto')}
          value={targetLanguage}
          onChange={(e) => onTargetLanguageChange(e.target.value)}
          disabled={disabled}
        />
        <SelectField
          id="adv-example-count"
          label="Example Count"
          options={EXAMPLE_COUNT_OPTIONS.map((n) => ({
            value: String(n),
            label: String(n),
          }))}
          value={String(options.exampleCount)}
          onChange={(e) =>
            onOptionsChange('exampleCount', Number.parseInt(e.target.value, 10))
          }
          disabled={disabled}
        />
        <SelectField
          id="adv-tone"
          label="Tone"
          options={TONE_OPTIONS}
          value={options.tone}
          onChange={(e) =>
            onOptionsChange('tone', e.target.value as CardGenerationOptionsDto['tone'])
          }
          disabled={disabled}
        />
        <SelectField
          id="adv-difficulty"
          label="Difficulty"
          options={DIFFICULTY_OPTIONS}
          value={options.difficulty}
          onChange={(e) =>
            onOptionsChange(
              'difficulty',
              e.target.value as CardGenerationOptionsDto['difficulty'],
            )
          }
          disabled={disabled}
        />

        <fieldset className="space-y-2" disabled={disabled}>
          <legend className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
            Include on cards
          </legend>
          <ToggleField
            id="adv-phonetic"
            label="Include Phonetic"
            checked={options.includePhonetic}
            onChange={(v) => onOptionsChange('includePhonetic', v)}
          />
          <ToggleField
            id="adv-pos"
            label="Include Part of Speech"
            checked={options.includePartOfSpeech}
            onChange={(v) => onOptionsChange('includePartOfSpeech', v)}
          />
          <ToggleField
            id="adv-meanings"
            label="Include Meanings"
            checked={includeMeanings}
            onChange={(v) => {
              onOptionsChange('includeTargetMeaning', v)
              onOptionsChange('includeEnglishMeaning', v)
            }}
          />
          <ToggleField
            id="adv-trans"
            label="Include Example Translations"
            checked={options.includeExampleTranslations}
            onChange={(v) => onOptionsChange('includeExampleTranslations', v)}
          />
        </fieldset>
      </div>
    </BottomSheet>
  )
}
