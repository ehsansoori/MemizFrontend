import { BottomSheet } from '@/components/decks/BottomSheet'
import { SelectField } from '@/components/ui/SelectField'
import { DIFFICULTY_OPTIONS, TONE_OPTIONS } from '@/constants/formOptions'
import type { DifficultyOption, ToneOption } from '@/types/cards'

type AiGenerationSettingsSheetProps = {
  open: boolean
  onClose: () => void
  busy?: boolean
  difficulty: DifficultyOption
  tone: ToneOption
  deckDifficulty: DifficultyOption
  deckTone: ToneOption
  onDifficultyChange: (value: DifficultyOption) => void
  onToneChange: (value: ToneOption) => void
}

const sectionTitleClass =
  'text-[12px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500'

export function AiGenerationSettingsSheet({
  open,
  onClose,
  busy,
  difficulty,
  tone,
  deckDifficulty,
  deckTone,
  onDifficultyChange,
  onToneChange,
}: AiGenerationSettingsSheetProps) {
  const difficultyOverridden = difficulty !== deckDifficulty
  const toneOverridden = tone !== deckTone

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      busy={busy}
      title="AI settings"
      heading={
        <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">AI Settings</h2>
      }
    >
      <div className="space-y-4 px-5 pb-5">
        <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
          Language and template come from your deck. Adjust level and tone for this card only.
        </p>

        <section className="space-y-4">
          <p className={sectionTitleClass}>Generation</p>
          <SelectField
            id="ai-difficulty"
            label="Level"
            options={DIFFICULTY_OPTIONS}
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as DifficultyOption)}
            disabled={busy}
            hint={
              difficultyOverridden
                ? 'Overriding deck default for this card.'
                : 'Using deck default level.'
            }
          />
          <SelectField
            id="ai-tone"
            label="Tone"
            options={TONE_OPTIONS}
            value={tone}
            onChange={(e) => onToneChange(e.target.value as ToneOption)}
            disabled={busy}
            hint={
              toneOverridden ? 'Overriding deck default for this card.' : 'Using deck default tone.'
            }
          />
        </section>

        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="h-12 w-full rounded-2xl bg-accent text-[15px] font-semibold text-white disabled:opacity-40"
        >
          Done
        </button>
      </div>
    </BottomSheet>
  )
}
