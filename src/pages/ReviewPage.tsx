import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CardNavigation } from '@/components/controls/CardNavigation'
import { ReviewCardFilter } from '@/components/review/ReviewCardFilter'
import { ReviewDeckSelector } from '@/components/review/ReviewDeckSelector'
import {
  filterAndRankCardsBySearch,
  type ReviewSearchField,
} from '@/domain/cardSearch'
import {
  countByQueue,
  filterCardsByQueue,
  type ReviewQueueFilter,
} from '@/domain/reviewQueue'
import { useLibraryStore } from '@/store/library/libraryStore'
import { cardFaceDisplayText } from '@/utils/renderCardFace'
import type { SavedCard } from '@/types/cards'

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  if (
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t instanceof HTMLSelectElement
  ) {
    return true
  }
  if (t.isContentEditable) return true
  return false
}

const queueTabs: { id: ReviewQueueFilter; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'review', label: 'Review' },
]

export function ReviewPage() {
  const activeDeckId = useLibraryStore((s) => s.activeDeckId)
  const allCards = useLibraryStore((s) => s.cards)

  const [query, setQuery] = useState('')
  const [searchField, setSearchField] = useState<ReviewSearchField>('all')
  const [queue, setQueue] = useState<ReviewQueueFilter>('new')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const lastViewedCardIdRef = useRef<string | null>(null)

  const deckCards = useMemo(
    () => (activeDeckId ? allCards.filter((c) => c.deckId === activeDeckId) : []),
    [allCards, activeDeckId],
  )

  const queueCounts = useMemo(() => countByQueue(deckCards), [deckCards])

  const queueCards = useMemo(
    () => filterCardsByQueue(deckCards, queue),
    [deckCards, queue],
  )

  const filteredCards = useMemo(
    () => filterAndRankCardsBySearch(queueCards, query, searchField),
    [queueCards, query, searchField],
  )

  const total = filteredCards.length
  const currentCard: SavedCard | null = filteredCards[currentIndex] ?? null
  const isFiltering = query.trim().length > 0

  const faceText = useMemo(() => {
    if (!currentCard) return ''
    const raw = showBack ? currentCard.back : currentCard.front
    return cardFaceDisplayText(raw)
  }, [currentCard, showBack])

  useEffect(() => {
    lastViewedCardIdRef.current = filteredCards[currentIndex]?.id ?? null
  }, [filteredCards, currentIndex])

  useEffect(() => {
    setCurrentIndex(0)
    setShowBack(false)
  }, [activeDeckId, queue, searchField])

  useEffect(() => {
    if (filteredCards.length === 0) {
      setCurrentIndex(0)
      return
    }
    const lastId = lastViewedCardIdRef.current
    if (lastId) {
      const idx = filteredCards.findIndex((c) => c.id === lastId)
      if (idx >= 0) {
        setCurrentIndex(idx)
        return
      }
    }
    setCurrentIndex(0)
  }, [filteredCards])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(total - 1, i + 1))
  }, [total])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setShowBack((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext])

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-4 sm:px-8">
      <ReviewDeckSelector />

      <ReviewCardFilter
        query={query}
        field={searchField}
        matchCount={total}
        totalInQueue={queueCards.length}
        onQueryChange={setQuery}
        onFieldChange={setSearchField}
      />

      <div className="mb-4 flex gap-4" role="tablist" aria-label="Card queue">
        {queueTabs.map((tab) => {
          const active = queue === tab.id
          const count = queueCounts[tab.id]
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setQueue(tab.id)}
              className={[
                'text-[13px] text-accent hover:underline',
                active ? 'font-semibold underline' : 'font-normal',
              ].join(' ')}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {total === 0 ? (
        <p className="px-3 py-10 text-center text-[13px] text-slate-500">
          {deckCards.length === 0 ? (
            <>
              No cards in this deck.{' '}
              <Link to="/add-cards" className="text-accent hover:underline">
                Add Cards
              </Link>
            </>
          ) : isFiltering ? (
            <>No cards match your search in this field.</>
          ) : (
            `No ${queue} cards.`
          )}
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3 px-3">
          <button
            type="button"
            onClick={() => setShowBack((v) => !v)}
            className="w-full max-w-xl border border-slate-200 bg-white px-6 py-10 text-left dark:border-slate-700 dark:bg-slate-900/40"
          >
            <p className="mb-3 text-[11px] text-slate-400">
              {showBack ? 'Back' : 'Front'}
            </p>
            <p className="whitespace-pre-wrap text-lg font-semibold leading-relaxed text-slate-900 dark:text-slate-50">
              {faceText}
            </p>
          </button>

          <CardNavigation
            currentIndex={currentIndex}
            total={total}
            onPrev={goPrev}
            onNext={goNext}
            disabled={total <= 1}
          />
          <p className="text-[11px] text-slate-400">← → · Space to flip</p>
        </div>
      )}
    </main>
  )
}
