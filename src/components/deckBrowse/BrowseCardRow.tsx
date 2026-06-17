import { CARD_STATUS_LABELS } from '@/domain/cardStudyDisplay'
import { savedCardMeaningPreview, savedCardWord } from '@/domain/cardFaceText'
import type { SavedCard } from '@/types/cards'
import type { CardReviewStatus } from '@/types/study'

type BrowseCardRowProps = {
  card: SavedCard
  disabled?: boolean
  onOpen: () => void
  onMenu: () => void
}

const BROWSE_STATUS_STYLES: Record<CardReviewStatus, string> = {
  new: 'text-sky-600/80 dark:text-sky-400/80',
  learning: 'text-violet-600/80 dark:text-violet-400/80',
  review: 'text-amber-600/80 dark:text-amber-400/80',
  mastered: 'text-emerald-600/80 dark:text-emerald-400/80',
  suspended: 'text-slate-500 dark:text-slate-400',
}

export function BrowseCardRow({ card, disabled, onOpen, onMenu }: BrowseCardRowProps) {
  const word = savedCardWord(card)
  const meaning = savedCardMeaningPreview(card)

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-4 shadow-sm transition active:scale-[0.99] dark:border-slate-700/60 dark:bg-surface-900">
      <button
        type="button"
        disabled={disabled}
        onClick={onOpen}
        className="min-w-0 flex-1 text-left transition disabled:opacity-40"
      >
        <p className="truncate text-[17px] font-semibold leading-snug text-slate-900 dark:text-white">
          {word}
        </p>
        <p className="mt-1 truncate text-[14px] leading-snug text-slate-500 dark:text-slate-400">
          {meaning}
        </p>
      </button>

      <div className="flex shrink-0 items-center gap-4">
        <span
          className={[
            'text-[9px] font-medium uppercase tracking-wide',
            BROWSE_STATUS_STYLES[card.study.status],
          ].join(' ')}
        >
          {CARD_STATUS_LABELS[card.study.status]}
        </span>

        <button
          type="button"
          disabled={disabled}
          aria-label={`Actions for ${word}`}
          onClick={(e) => {
            e.stopPropagation()
            onMenu()
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-95 disabled:opacity-40 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="12" cy="5" r="1.75" />
            <circle cx="12" cy="12" r="1.75" />
            <circle cx="12" cy="19" r="1.75" />
          </svg>
        </button>
      </div>
    </div>
  )
}
