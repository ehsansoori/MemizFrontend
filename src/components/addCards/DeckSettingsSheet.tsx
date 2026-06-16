import { BottomSheet } from '@/components/decks/BottomSheet'
import { SelectField } from '@/components/ui/SelectField'
import {
  DIFFICULTY_OPTIONS,
  LANGUAGE_OPTIONS,
  TONE_OPTIONS,
} from '@/constants/formOptions'
import type { LanguageDeckSettings } from '@/types/deckProfile'

const AUDIO_PROVIDERS = [
  { value: 'system', label: 'System (default)' },
  { value: 'google', label: 'Google TTS (soon)' },
  { value: 'azure', label: 'Azure TTS (soon)' },
]

type DeckSettingsSheetProps = {
  open: boolean
  onClose: () => void
  settings: LanguageDeckSettings
  disabled?: boolean
  onChange: (settings: LanguageDeckSettings) => void
  onSave: () => void
}

export function DeckSettingsSheet({
  open,
  onClose,
  settings,
  disabled,
  onChange,
  onSave,
}: DeckSettingsSheetProps) {
  const patch = <K extends keyof LanguageDeckSettings>(key: K, value: LanguageDeckSettings[K]) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      busy={disabled}
      title="Deck settings"
      heading={
        <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Deck Settings</h2>
      }
    >
      <div className="max-h-[70dvh] space-y-4 overflow-y-auto px-5 pb-5 scrollbar-minimal">
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          Language and generation style for this deck. Card structure is controlled by each
          card&apos;s template.
        </p>
        <SelectField
          id="deck-source-lang"
          label="Source Language"
          options={LANGUAGE_OPTIONS}
          value={settings.sourceLanguage}
          onChange={(e) => patch('sourceLanguage', e.target.value)}
          disabled={disabled}
        />
        <SelectField
          id="deck-target-lang"
          label="Target Language"
          options={LANGUAGE_OPTIONS.filter((o) => o.value !== 'auto')}
          value={settings.targetLanguage}
          onChange={(e) => patch('targetLanguage', e.target.value)}
          disabled={disabled}
        />
        <SelectField
          id="deck-difficulty"
          label="Difficulty"
          options={DIFFICULTY_OPTIONS}
          value={settings.difficulty}
          onChange={(e) => patch('difficulty', e.target.value as LanguageDeckSettings['difficulty'])}
          disabled={disabled}
        />
        <SelectField
          id="deck-tone"
          label="Tone"
          options={TONE_OPTIONS}
          value={settings.tone}
          onChange={(e) => patch('tone', e.target.value as LanguageDeckSettings['tone'])}
          disabled={disabled}
        />
        <SelectField
          id="deck-audio"
          label="Audio Provider"
          options={AUDIO_PROVIDERS}
          value={settings.audioProvider}
          onChange={(e) => patch('audioProvider', e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={onSave}
          className="h-12 w-full rounded-2xl bg-accent text-[15px] font-semibold text-white disabled:opacity-40"
        >
          Save Settings
        </button>
      </div>
    </BottomSheet>
  )
}
