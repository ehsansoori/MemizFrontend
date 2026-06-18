import { useEffect, useRef } from 'react'
import { TemplateOrderedFields } from '@/components/cardDisplay/TemplateOrderedFields'
import { splitStudyDisplaySegments } from '@/domain/templateFieldDisplay'
import type { SavedCard } from '@/types/cards'

type StudyCardViewProps = {
  card: SavedCard
  menuDisabled?: boolean
  onMenu: () => void
}

export function StudyCardView({ card, menuDisabled, onMenu }: StudyCardViewProps) {
  const { sticky, scrollable } = splitStudyDisplaySegments(card)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || scrollable.length === 0) return
    el.scrollTop = 0
  }, [card.id, scrollable.length])

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-slate-100 bg-white pb-3 pt-0.5 dark:border-slate-800/80 dark:bg-surface-950">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <TemplateOrderedFields segments={sticky} variant="study-header" />
          </div>
          <button
            type="button"
            disabled={menuDisabled}
            aria-label="Card actions"
            onClick={onMenu}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-95 disabled:opacity-40 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="12" cy="5" r="1.75" />
              <circle cx="12" cy="12" r="1.75" />
              <circle cx="12" cy="19" r="1.75" />
            </svg>
          </button>
        </div>
      </header>

      {scrollable.length > 0 ? (
        <div
          ref={scrollRef}
          data-study-scroll
          className="study-scroll-panel scrollbar-minimal min-h-0 flex-1 overflow-y-auto pb-4 pt-4 sm:pt-5"
        >
          <TemplateOrderedFields segments={scrollable} variant="study-body" />
        </div>
      ) : (
        <div className="min-h-0 flex-1" aria-hidden />
      )}
    </article>
  )
}
