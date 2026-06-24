import { CompactAiGenerateButton } from '@/components/addCards/CompactAiGenerateButton'
import { InlineEditableFlashcardField } from '@/components/cardDisplay/InlineEditableFlashcardField'
import { FlashcardSurface } from '@/components/cardDisplay/FlashcardSection'
import type { CardDraft } from '@/domain/cardDraft'

type CardWordInputBarProps = {
  draft: CardDraft
  onChange: (draft: CardDraft) => void
  disabled?: boolean
  aiGenerate?: {
    onClick: () => void
    busy?: boolean
    disabled?: boolean
  }
}

const frontWordClass =
  'font-display text-[clamp(2rem,7vw,2.75rem)] font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white'

/** Top creation bar: word/phrase input + compact AI generate. Always visible on Make/Edit Card. */
export function CardWordInputBar({
  draft,
  onChange,
  disabled,
  aiGenerate,
}: CardWordInputBarProps) {
  return (
    <FlashcardSurface>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <InlineEditableFlashcardField
            value={draft.data.input}
            onCommit={(input) => onChange({ ...draft, data: { ...draft.data, input } })}
            disabled={disabled}
            displayClassName={frontWordClass}
            editClassName={frontWordClass}
            hideWhenEmpty={false}
            emptyHint="Type a word or phrase"
            ariaLabel="Word or phrase"
          />
        </div>
        {aiGenerate ? (
          <CompactAiGenerateButton
            onClick={aiGenerate.onClick}
            busy={aiGenerate.busy}
            disabled={aiGenerate.disabled}
          />
        ) : null}
      </div>
    </FlashcardSurface>
  )
}
