import type { ReactNode } from 'react'
import { SavedCardTemplateBlocksView, SAVED_CARD_READ_VARIANT } from '@/components/cardDisplay/SavedCardTemplateBlocksView'
import { CardActionsMenuButton } from '@/components/cards/CardActionsMenuButton'
import type { SavedCard } from '@/types/cards'

type ReviewFlashcardProps = {
  card: SavedCard
  showAnswer: boolean
  footer?: ReactNode
  menuDisabled?: boolean
  onMenu?: () => void
}

export function ReviewFlashcard({
  card,
  showAnswer,
  footer,
  menuDisabled,
  onMenu,
}: ReviewFlashcardProps) {
  const menuButton = onMenu ? (
    <CardActionsMenuButton disabled={menuDisabled} onClick={onMenu} />
  ) : null

  if (showAnswer) {
    return (
      <div className="review-card-animate flex min-h-0 w-full flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-lg dark:border-slate-700/80 dark:bg-surface-900 dark:shadow-card-dark md:min-h-[min(68dvh,720px)]">
          <div className="relative shrink-0 border-b border-slate-100 px-6 py-5 dark:border-slate-800 md:px-8 md:py-6">
            {menuButton ? (
              <div className="absolute right-4 top-4 md:right-6 md:top-5">{menuButton}</div>
            ) : null}
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Question
            </p>
            <div className="mt-3 pr-8">
              <SavedCardTemplateBlocksView
                card={card}
                side="front"
                variant={SAVED_CARD_READ_VARIANT}
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 scrollbar-minimal md:px-8 md:py-8">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Answer
              </p>
              <SavedCardTemplateBlocksView
                card={card}
                side="back"
                variant={SAVED_CARD_READ_VARIANT}
              />
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
    <div className="review-card-animate flex min-h-0 w-full flex-1 flex-col">
      <div className="relative flex min-h-[min(52dvh,420px)] w-full flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-card dark:border-slate-700/80 dark:bg-surface-900 dark:shadow-card-dark md:min-h-[min(48dvh,480px)]">
        {menuButton ? (
          <div className="absolute right-4 top-4 z-10 md:right-6 md:top-5">{menuButton}</div>
        ) : null}

        <p className="shrink-0 px-6 pt-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 md:px-10 md:pt-8">
          Question
        </p>

        <div className="flex min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-minimal">
          <div className="m-auto flex w-full justify-center px-6 pb-6 pt-2 pr-14 md:px-10 md:pb-10 md:pt-4 md:pr-16">
            <SavedCardTemplateBlocksView
              card={card}
              side="front"
              variant={SAVED_CARD_READ_VARIANT}
              contentAlign="center"
              className="w-full max-w-prose"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
