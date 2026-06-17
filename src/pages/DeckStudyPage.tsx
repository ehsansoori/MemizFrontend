import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BrowseCardActionsSheet } from '@/components/deckBrowse/BrowseCardActionsSheet'
import { DeckModeHeader } from '@/components/deckStudy/DeckModeHeader'
import { StudyCardView } from '@/components/deckStudy/StudyCardView'
import { savedCardFrontText } from '@/domain/cardFaceText'
import { sortDeckCardsAlphabetically } from '@/domain/deckCardList'
import { createDuplicateSavedCard } from '@/domain/duplicateSavedCard'
import { useToast } from '@/providers/toastContext'
import { storage } from '@/storage/adapter'
import { useLibraryStore } from '@/store/library/libraryStore'

export function DeckStudyPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()

  const decks = useLibraryStore((s) => s.decks)
  const allCards = useLibraryStore((s) => s.cards)
  const hydrated = useLibraryStore((s) => s.hydrated)
  const reload = useLibraryStore((s) => s.reload)

  const [index, setIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)

  const deck = useMemo(
    () => (deckId ? decks.find((d) => d.id === deckId) : undefined),
    [decks, deckId],
  )

  const deckCards = useMemo(() => {
    if (!deckId) return []
    return sortDeckCardsAlphabetically(allCards.filter((c) => c.deckId === deckId))
  }, [allCards, deckId])

  const cardIdParam = searchParams.get('card')

  useEffect(() => {
    if (deckCards.length === 0) {
      setIndex(0)
      return
    }
    if (cardIdParam) {
      const idx = deckCards.findIndex((c) => c.id === cardIdParam)
      if (idx >= 0) {
        setIndex(idx)
        return
      }
    }
    setIndex((prev) => Math.min(prev, deckCards.length - 1))
  }, [deckCards, cardIdParam])

  const currentCard = deckCards[index]
  const total = deckCards.length
  const position = total > 0 ? index + 1 : 0

  useEffect(() => {
    setActionsOpen(false)
  }, [currentCard?.id])

  if (hydrated && !deck) {
    return <Navigate to="/decks" replace />
  }

  if (hydrated && deck && total === 0) {
    return <Navigate to={`/decks/${deckId}`} replace />
  }

  const syncCardParam = (nextIndex: number) => {
    const card = deckCards[nextIndex]
    if (!card) return
    setSearchParams({ card: card.id }, { replace: true })
  }

  const goToIndex = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= total) return
    setIndex(nextIndex)
    syncCardParam(nextIndex)
  }

  const handleDeleteCard = async () => {
    if (!currentCard || !deckId) return
    if (!window.confirm(`Delete “${currentCard.data.word}”?`)) return
    setBusy(true)
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
      const nextIdx = Math.min(index, remaining.length - 1)
      setSearchParams({ card: remaining[nextIdx].id }, { replace: true })
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not delete card.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDuplicateCard = async () => {
    if (!currentCard) return
    setBusy(true)
    try {
      const copy = createDuplicateSavedCard(currentCard)
      await storage.cards.put(copy)
      await reload()
      setActionsOpen(false)
      showToast('Card duplicated.', 'success')
      setSearchParams({ card: copy.id }, { replace: true })
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not duplicate card.', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (!deck || !currentCard) {
    return (
      <main className="flex min-h-0 flex-1 flex-col">
        <p className="py-8 text-center text-[14px] text-slate-500">Loading…</p>
      </main>
    )
  }

  const editUrl = `/decks/${deckId}/cards/${currentCard.id}/edit?from=study`

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <DeckModeHeader
        deckId={deckId!}
        deckName={deck.name}
        modeLabel="Study"
        current={position}
        total={total}
      />

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-5 sm:px-6">
        <StudyCardView
          card={currentCard}
          menuDisabled={busy}
          onMenu={() => setActionsOpen(true)}
        />

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={index === 0 || busy}
            onClick={() => goToIndex(index - 1)}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white text-[14px] font-semibold text-slate-700 transition active:scale-[0.98] disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
            </svg>
            Previous
          </button>
          <button
            type="button"
            disabled={index >= total - 1 || busy}
            onClick={() => goToIndex(index + 1)}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white text-[14px] font-semibold text-slate-700 transition active:scale-[0.98] disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
          >
            Next
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <BrowseCardActionsSheet
        open={actionsOpen}
        cardLabel={savedCardFrontText(currentCard)}
        busy={busy}
        onClose={() => setActionsOpen(false)}
        onEdit={() => {
          setActionsOpen(false)
          navigate(editUrl)
        }}
        onDuplicate={() => void handleDuplicateCard()}
        onDelete={() => void handleDeleteCard()}
      />
    </main>
  )
}
