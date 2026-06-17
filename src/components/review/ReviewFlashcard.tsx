import type { ReactNode } from 'react'
import { ReviewAnswerDetails } from '@/components/review/ReviewAnswerDetails'
import type { SavedCard } from '@/types/cards'

type ReviewFlashcardProps = {
  card: SavedCard
  showAnswer: boolean
  footer?: ReactNode
}

export function ReviewFlashcard({ card, showAnswer, footer }: ReviewFlashcardProps) {
  if (showAnswer) {
    return (
      <div className="review-card-animate flex min-h-0 w-full flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-lg dark:border-slate-700/80 dark:bg-surface-900 dark:shadow-card-dark md:min-h-[min(68dvh,720px)]">
          <div className="shrink-0 border-b border-slate-100 px-6 py-5 text-center dark:border-slate-800 md:px-8 md:py-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Question
            </p>
            <h2 className="mt-2 font-display text-[clamp(1.5rem,6vw,2.25rem)] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
              {card.data.word}
            </h2>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 scrollbar-minimal md:px-8 md:py-8">
              <ReviewAnswerDetails card={card} variant="quiz" />
            </div>

            {footer ? (
              <div className="shrink-0 border-t border-slate-100 bg-slate-50/90 px-4 py-4 md:px-6 md:py-5 dark:border-slate-800 dark:bg-slate-900/50">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="review-card-animate flex w-full flex-1 flex-col">
      <div className="flex min-h-[min(52dvh,420px)] w-full flex-col rounded-3xl border border-slate-200/90 bg-white shadow-card dark:border-slate-700/80 dark:bg-surface-900 dark:shadow-card-dark md:min-h-[min(48dvh,480px)]">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center md:px-10 md:py-12">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Question
          </p>
          <h2 className="font-display mt-4 text-[clamp(2rem,8vw,3rem)] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
            {card.data.word}
          </h2>
        </div>
      </div>
    </div>
  )
}
