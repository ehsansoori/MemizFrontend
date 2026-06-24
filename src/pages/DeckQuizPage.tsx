import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { StudyCardActionsSheet } from '@/components/deckStudy/StudyCardActionsSheet'
import { DeckQuizHeader } from '@/components/deckQuiz/DeckQuizHeader'
import { ReviewFlashcard } from '@/components/review/ReviewFlashcard'
import { ReviewRatingButtons, type ReviewRating } from '@/components/review/ReviewRatingButtons'
import { applyReviewRating } from '@/domain/applyReviewRating'
import { buildEditCardPath } from '@/domain/editCardNavigation'
import { cardInput } from '@/domain/languageCardData'
import { savedCardWord } from '@/domain/templateFieldDisplay'
import { useToast } from '@/providers/toastContext'
import { storage } from '@/storage/adapter'
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

export function DeckQuizPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const cardIdParam = searchParams.get('card')
  const atIndexParam = searchParams.get('atIndex')
  const { showToast } = useToast()

  const decks = useLibraryStore((s) => s.decks)
  const allCards = useLibraryStore((s) => s.cards)
  const hydrated = useLibraryStore((s) => s.hydrated)
  const reload = useLibraryStore((s) => s.reload)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const lastViewedCardIdRef = useRef<string | null>(null)

  const busy = ratingBusy || deleteBusy

  const deck = useMemo(
    () => (deckId ? decks.find((d) => d.id === deckId) : undefined),
    [decks, deckId],
  )

  const deckCards = useMemo(() => {
    if (!deckId) return []
    return allCards
      .filter((c) => c.deckId === deckId)
      .sort((a, b) => cardInput(a.data).localeCompare(cardInput(b.data), undefined, { sensitivity: 'base' }))
  }, [allCards, deckId])

  const total = deckCards.length
  const currentCard: SavedCard | null = deckCards[currentIndex] ?? null

  useEffect(() => {
    lastViewedCardIdRef.current = deckCards[currentIndex]?.id ?? null
  }, [deckCards, currentIndex])

  useEffect(() => {
    setActionsOpen(false)
  }, [currentCard?.id])

  useEffect(() => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setSessionComplete(false)
  }, [deckId])

  useEffect(() => {
    if (deckCards.length === 0) {
      setCurrentIndex(0)
      return
    }
    if (atIndexParam !== null) {
      const targetIndex = Number.parseInt(atIndexParam, 10)
      if (Number.isFinite(targetIndex)) {
        const idx = Math.max(0, Math.min(targetIndex, deckCards.length - 1))
        setCurrentIndex(idx)
        setShowAnswer(false)
        setSessionComplete(false)
        return
      }
    }
    if (cardIdParam) {
      const idx = deckCards.findIndex((c) => c.id === cardIdParam)
      if (idx >= 0) {
        setCurrentIndex(idx)
        setShowAnswer(false)
        setSessionComplete(false)
        return
      }
    }
    const lastId = lastViewedCardIdRef.current
    if (lastId) {
      const idx = deckCards.findIndex((c) => c.id === lastId)
      if (idx >= 0) {
        setCurrentIndex(idx)
        return
      }
    }
    setCurrentIndex(0)
  }, [deckCards, cardIdParam, atIndexParam])

  const advance = useCallback(() => {
    setShowAnswer(false)
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setSessionComplete(true)
    }
  }, [currentIndex, total])

  const handleRate = useCallback(
    async (rating: ReviewRating) => {
      if (!currentCard || ratingBusy) return
      setRatingBusy(true)
      try {
        const study = applyReviewRating(currentCard.study, rating)
        await storage.cards.put({
          ...currentCard,
          study,
          updatedAt: new Date().toISOString(),
        })
        await reload()
        advance()
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Could not save progress.', 'error')
      } finally {
        setRatingBusy(false)
      }
    },
    [currentCard, ratingBusy, reload, advance, showToast],
  )

  const restartSession = () => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setSessionComplete(false)
  }

  const handleDeleteCard = async () => {
    if (!currentCard || !deckId) return
    if (!window.confirm(`Delete “${savedCardWord(currentCard)}”?`)) return
    setDeleteBusy(true)
    try {
      const remaining = deckCards.filter((c) => c.id !== currentCard.id)
      await storage.cards.softDelete(currentCard.id)
      await reload()
      setActionsOpen(false)
      showToast('Card deleted.', 'success')
      if (remaining.length === 0) {
        navigate(`/decks/${deckId}`)
        return
      }
      const nextIdx = Math.min(currentIndex, remaining.length - 1)
      setCurrentIndex(nextIdx)
      setShowAnswer(false)
      setSessionComplete(false)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not delete card.', 'error')
    } finally {
      setDeleteBusy(false)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        isTypingTarget(e.target) ||
        sessionComplete ||
        total === 0 ||
        busy ||
        actionsOpen
      ) {
        return
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!showAnswer) setShowAnswer(true)
      }

      if (showAnswer) {
        if (e.key === '1') {
          e.preventDefault()
          void handleRate('again')
        }
        if (e.key === '2') {
          e.preventDefault()
          void handleRate('hard')
        }
        if (e.key === '3') {
          e.preventDefault()
          void handleRate('good')
        }
        if (e.key === '4') {
          e.preventDefault()
          void handleRate('easy')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showAnswer, sessionComplete, total, busy, actionsOpen, handleRate])

  if (hydrated && !deck) {
    return <Navigate to="/decks" replace />
  }

  if (!deck || !deckId) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 dark:bg-surface-950">
        <p className="text-[14px] text-slate-500">Loading…</p>
      </div>
    )
  }

  if (sessionComplete) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-surface-950">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-white">Quiz complete</h1>
        <p className="mt-2 text-[14px] text-slate-500 dark:text-slate-400">
          You reviewed all {total} cards in {deck.name}.
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={restartSession}
            className="h-12 rounded-2xl bg-accent text-[15px] font-semibold text-white transition active:scale-[0.98]"
          >
            Quiz again
          </button>
          <Link
            to={`/decks/${deckId}`}
            className="flex h-12 items-center justify-center rounded-2xl bg-slate-200 text-[15px] font-semibold text-slate-700 transition active:scale-[0.98] dark:bg-slate-800 dark:text-slate-200"
          >
            Back to deck
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-surface-950">
      <DeckQuizHeader
        deckId={deckId}
        deckName={deck.name}
        current={total > 0 ? currentIndex + 1 : 0}
        total={total}
      />

      {total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-[16px] font-semibold text-slate-700 dark:text-slate-200">
            No cards in this deck
          </p>
          <p className="mt-2 text-[14px] text-slate-500 dark:text-slate-400">
            Add cards before starting a quiz.
          </p>
          <Link
            to={`/decks/${deckId}`}
            className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-accent px-8 text-[15px] font-semibold text-white transition active:scale-[0.98]"
          >
            Back to deck
          </Link>
        </div>
      ) : currentCard ? (
        <div
          className={[
            'mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-4 py-3 md:max-w-xl md:px-6 md:py-6 lg:max-w-2xl',
            showAnswer ? 'items-stretch' : 'items-center justify-center',
          ].join(' ')}
        >
          <ReviewFlashcard
            key={currentCard.id}
            card={currentCard}
            showAnswer={showAnswer}
            menuDisabled={busy}
            onMenu={() => setActionsOpen(true)}
            footer={
              showAnswer ? (
                <>
                  <ReviewRatingButtons onRate={(r) => void handleRate(r)} disabled={busy} />
                  <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
                    1 Again · 2 Hard · 3 Good · 4 Easy
                  </p>
                </>
              ) : undefined
            }
          />

          {!showAnswer ? (
            <button
              type="button"
              onClick={() => setShowAnswer(true)}
              disabled={busy}
              className="review-show-answer-animate mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-accent text-[16px] font-bold text-white shadow-lg shadow-accent/25 transition active:scale-[0.98] disabled:opacity-40"
            >
              Show Answer
            </button>
          ) : null}

          <StudyCardActionsSheet
            open={actionsOpen}
            cardLabel={savedCardWord(currentCard)}
            busy={busy}
            onClose={() => setActionsOpen(false)}
            onEdit={() => {
              setActionsOpen(false)
              navigate(
                buildEditCardPath(deckId, currentCard.id, {
                  sourcePage: 'quiz',
                  sourceDeckId: deckId,
                  sourceSessionState: {
                    cardId: currentCard.id,
                    cardIndex: currentIndex,
                    showAnswer,
                  },
                }),
              )
            }}
            onDelete={() => void handleDeleteCard()}
          />
        </div>
      ) : null}

      {!showAnswer && total > 0 && currentCard ? (
        <footer className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
          <p className="text-center text-[12px] text-slate-400 dark:text-slate-500">
            Tap Show Answer or press Space
          </p>
        </footer>
      ) : null}
    </div>
  )
}
