import { useEffect, useMemo, useRef, useState } from 'react'
import { cardReviewCount, savedCardWord } from '@/domain/cardFaceText'
import { filterAndRankCardsBySearch } from '@/domain/cardSearch'
import type { SavedCard } from '@/types/cards'

type StudyCardNavigatorModalProps = {
  open: boolean
  cards: SavedCard[]
  currentCardId: string
  onClose: () => void
  onSelect: (cardId: string) => void
}

export function StudyCardNavigatorModal({
  open,
  cards,
  currentCardId,
  onClose,
  onSelect,
}: StudyCardNavigatorModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredCards = useMemo(() => {
    const searched = filterAndRankCardsBySearch(cards, query, 'all')
    if (query.trim()) return searched
    return cards
  }, [cards, query])

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jump to card"
        className="flex max-h-[min(88dvh,680px)] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-surface-900 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="relative min-w-0 flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cards"
              aria-label="Search cards"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[15px] text-slate-800 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
            />
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2 scrollbar-minimal">
          {filteredCards.length === 0 ? (
            <li className="px-4 py-8 text-center text-[14px] text-slate-500">No cards match</li>
          ) : (
            filteredCards.map((card) => {
              const active = card.id === currentCardId
              const word = savedCardWord(card)
              const count = cardReviewCount(card)
              const deckIndex = cards.findIndex((c) => c.id === card.id)
              return (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(card.id)
                      onClose()
                    }}
                    className={[
                      'flex w-full items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition',
                      active
                        ? 'bg-accent/10 dark:bg-accent/15'
                        : 'hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60 dark:active:bg-slate-800',
                    ].join(' ')}
                  >
                    <span className="mt-0.5 w-5 shrink-0 tabular-nums text-[13px] text-slate-400 dark:text-slate-500">
                      {deckIndex + 1}.
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold text-slate-900 dark:text-white">
                        {word}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-slate-500 dark:text-slate-400">
                        Reviewed: {count} {count === 1 ? 'time' : 'times'}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
