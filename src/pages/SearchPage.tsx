import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DeckCardPreviewSheet } from '@/components/deckDetails/DeckCardPreviewSheet'
import { CARD_STATUS_LABELS, CARD_STATUS_STYLES } from '@/domain/cardStudyDisplay'
import { savedCardWord } from '@/domain/templateFieldDisplay'
import { filterAndRankCardsBySearch } from '@/domain/cardSearch'
import { useLibraryStore } from '@/store/library/libraryStore'
import type { SavedCard } from '@/types/cards'

type SearchResult = {
  card: SavedCard
  deckName: string
}

export function SearchPage() {
  const decks = useLibraryStore((s) => s.decks)
  const cards = useLibraryStore((s) => s.cards)
  const [query, setQuery] = useState('')
  const [previewCard, setPreviewCard] = useState<SavedCard | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const deckNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const deck of decks) {
      m.set(deck.id, deck.name)
    }
    return m
  }, [decks])

  const results = useMemo((): SearchResult[] => {
    const matched = filterAndRankCardsBySearch(cards, query, 'all')
    return matched.map((card) => ({
      card,
      deckName: deckNameById.get(card.deckId) ?? 'Unknown deck',
    }))
  }, [cards, query, deckNameById])

  const trimmedQuery = query.trim()
  const hasQuery = trimmedQuery.length > 0

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-8 pt-4 sm:px-6">
      <div className="mb-5">
        <Link
          to="/decks"
          className="mb-3 inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-medium text-accent"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
          Search
        </h1>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          Search across all cards in every deck
        </p>
      </div>

      <div className="relative mb-5">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
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
          placeholder="Search words, meanings, examples…"
          aria-label="Search all cards"
          enterKeyHint="search"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[15px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/25 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800"
        />
      </div>

      {!hasQuery ? (
        <div className="mt-16 flex flex-col items-center px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-200">
            Search your library
          </p>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            Type to find cards by word, meaning, or example text.
          </p>
        </div>
      ) : results.length === 0 ? (
        <p className="mt-12 text-center text-[14px] text-slate-500 dark:text-slate-400">
          No cards match &ldquo;{trimmedQuery}&rdquo;
        </p>
      ) : (
        <>
          <p className="mb-3 text-[12px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </p>
          <ul className="space-y-2" role="listbox" aria-label="Search results">
            {results.map(({ card, deckName }, index) => (
              <li
                key={card.id}
                className="deck-card-animate"
                style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
              >
                <button
                  type="button"
                  role="option"
                  onClick={() => setPreviewCard(card)}
                  className="flex w-full min-h-[68px] items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-left transition active:scale-[0.99] dark:border-slate-700/70 dark:bg-surface-900"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold text-slate-900 dark:text-white">
                      {savedCardWord(card)}
                    </p>
                    <p className="mt-0.5 truncate text-[13px] text-slate-500 dark:text-slate-400">
                      {deckName}
                    </p>
                  </div>
                  <span
                    className={[
                      'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                      CARD_STATUS_STYLES[card.study.status],
                    ].join(' ')}
                  >
                    {CARD_STATUS_LABELS[card.study.status]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <DeckCardPreviewSheet
        open={previewCard !== null}
        card={previewCard}
        onClose={() => setPreviewCard(null)}
      />
    </main>
  )
}
