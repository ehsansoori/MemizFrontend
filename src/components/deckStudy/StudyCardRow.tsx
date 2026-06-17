import { CARD_STATUS_LABELS, CARD_STATUS_STYLES } from '@/domain/cardStudyDisplay'
import type { SavedCard } from '@/types/cards'
import { cardFaceDisplayText } from '@/utils/renderCardFace'

type StudyCardRowProps = {
  card: SavedCard
  disabled?: boolean
  onEdit: () => void
  onDelete: () => void
}

export function StudyCardRow({ card, disabled, onEdit, onDelete }: StudyCardRowProps) {
  const frontText = cardFaceDisplayText(card.front) || card.data.word
  const backText =
    cardFaceDisplayText(card.back) ||
    card.data.targetMeaning ||
    card.data.englishMeaning ||
    'No meaning yet'

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/70 dark:bg-surface-900">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Front
        </p>
        <span
          className={[
            'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
            CARD_STATUS_STYLES[card.study.status],
          ].join(' ')}
        >
          {CARD_STATUS_LABELS[card.study.status]}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-[17px] font-semibold leading-snug text-slate-900 dark:text-white">
        {frontText}
      </p>

      <div className="my-4 border-t border-slate-100 dark:border-slate-800" />

      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        Back
      </p>
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
        {backText}
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onEdit}
          className="flex min-h-[40px] flex-1 items-center justify-center rounded-xl bg-slate-100 text-[13px] font-semibold text-slate-700 transition active:scale-[0.98] disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="flex min-h-[40px] flex-1 items-center justify-center rounded-xl bg-red-50 text-[13px] font-semibold text-red-600 transition active:scale-[0.98] disabled:opacity-40 dark:bg-red-950/40 dark:text-red-400"
        >
          Delete
        </button>
      </div>
    </article>
  )
}
