import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReviewFlashcard } from '@/components/review/ReviewFlashcard'
import { ReviewRatingButtons, type ReviewRating } from '@/components/review/ReviewRatingButtons'
import { ReviewStudyHeader } from '@/components/review/ReviewStudyHeader'
import {
  countByQueue,
  filterCardsByQueue,
  type ReviewQueueFilter,
} from '@/domain/reviewQueue'
import { useLibraryStore } from '@/store/library/libraryStore'
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

export function ReviewPage() {
  const activeDeckId = useLibraryStore((s) => s.activeDeckId)
  const allCards = useLibraryStore((s) => s.cards)
  const decks = useLibraryStore((s) => s.decks)

  const [queue, setQueue] = useState<ReviewQueueFilter>('new')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const lastViewedCardIdRef = useRef<string | null>(null)

  const activeDeckName = useMemo(
    () => decks.find((d) => d.id === activeDeckId)?.name ?? 'Deck',
    [decks, activeDeckId],
  )

  const deckCards = useMemo(
    () => (activeDeckId ? allCards.filter((c) => c.deckId === activeDeckId) : []),
    [allCards, activeDeckId],
  )

  const queueCounts = useMemo(() => countByQueue(deckCards), [deckCards])

  const queueCards = useMemo(
    () => filterCardsByQueue(deckCards, queue),
    [deckCards, queue],
  )

  const total = queueCards.length
  const currentCard: SavedCard | null = queueCards[currentIndex] ?? null

  useEffect(() => {
    lastViewedCardIdRef.current = queueCards[currentIndex]?.id ?? null
  }, [queueCards, currentIndex])

  useEffect(() => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setSessionComplete(false)
  }, [activeDeckId, queue])

  useEffect(() => {
    if (queueCards.length === 0) {
      setCurrentIndex(0)
      return
    }
    const lastId = lastViewedCardIdRef.current
    if (lastId) {
      const idx = queueCards.findIndex((c) => c.id === lastId)
      if (idx >= 0) {
        setCurrentIndex(idx)
        return
      }
    }
    setCurrentIndex(0)
  }, [queueCards])

  const advance = useCallback(() => {
    setShowAnswer(false)
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setSessionComplete(true)
    }
  }, [currentIndex, total])

  const handleRate = useCallback(
    (_rating: ReviewRating) => {
      advance()
    },
    [advance],
  )

  const restartSession = () => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setSessionComplete(false)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || sessionComplete || total === 0) return

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!showAnswer) {
          setShowAnswer(true)
        }
      }

      if (showAnswer) {
        if (e.key === '1') {
          e.preventDefault()
          handleRate('again')
        }
        if (e.key === '2') {
          e.preventDefault()
          handleRate('hard')
        }
        if (e.key === '3') {
          e.preventDefault()
          handleRate('good')
        }
        if (e.key === '4') {
          e.preventDefault()
          handleRate('easy')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showAnswer, sessionComplete, total, handleRate])

  if (sessionComplete) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-surface-950">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <svg
            className="h-10 w-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-white">
          Session complete
        </h1>
        <p className="mt-2 text-[14px] text-slate-500 dark:text-slate-400">
          You reviewed all {total} {queue} cards in {activeDeckName}.
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={restartSession}
            className="h-12 rounded-2xl bg-accent text-[15px] font-semibold text-white transition active:scale-[0.98]"
          >
            Study again
          </button>
          <Link
            to="/decks"
            className="flex h-12 items-center justify-center rounded-2xl bg-slate-200 text-[15px] font-semibold text-slate-700 transition active:scale-[0.98] dark:bg-slate-800 dark:text-slate-200"
          >
            Back to decks
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-surface-950">
      <ReviewStudyHeader
        current={total > 0 ? currentIndex + 1 : 0}
        total={total}
        queue={queue}
        queueCounts={queueCounts}
        onQueueChange={setQueue}
      />

      {total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-[16px] font-semibold text-slate-700 dark:text-slate-200">
            {deckCards.length === 0 ? 'No cards in this deck' : `No ${queue} cards`}
          </p>
          <p className="mt-2 text-[14px] text-slate-500 dark:text-slate-400">
            {deckCards.length === 0
              ? 'Add cards to start studying.'
              : 'Switch queue or add more cards.'}
          </p>
          <Link
            to={activeDeckId ? `/decks/${activeDeckId}` : '/decks'}
            className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-accent px-8 text-[15px] font-semibold text-white transition active:scale-[0.98]"
          >
            {deckCards.length === 0 ? 'Go to deck' : 'Back to deck'}
          </Link>
        </div>
      ) : currentCard ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
            <ReviewFlashcard key={currentCard.id} card={currentCard} showAnswer={showAnswer} />

            {!showAnswer ? (
              <button
                type="button"
                onClick={() => setShowAnswer(true)}
                className="review-show-answer-animate mt-6 flex h-14 w-full max-w-lg items-center justify-center rounded-2xl bg-accent text-[16px] font-bold text-white shadow-lg shadow-accent/25 transition active:scale-[0.98]"
              >
                Show Answer
              </button>
            ) : null}
          </div>

          {showAnswer ? (
            <footer className="shrink-0 border-t border-slate-200/80 bg-white/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm dark:border-slate-800 dark:bg-surface-950/95">
              <ReviewRatingButtons onRate={handleRate} />
              <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
                1 Again · 2 Hard · 3 Good · 4 Easy
              </p>
            </footer>
          ) : (
            <footer className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
              <p className="text-center text-[12px] text-slate-400 dark:text-slate-500">
                Tap Show Answer or press Space
              </p>
            </footer>
          )}
        </>
      ) : null}
    </div>
  )
}
