import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { StudyCardNavigationShell } from '@/components/deckStudy/StudyCardNavigationShell'
import { StudyCardActionsSheet } from '@/components/deckStudy/StudyCardActionsSheet'
import { StudyCardNavigatorModal } from '@/components/deckStudy/StudyCardNavigatorModal'
import { StudyCardView } from '@/components/deckStudy/StudyCardView'
import { StudyBottomToolbar } from '@/components/deckStudy/StudyBottomToolbar'
import { StudyModeHeader, studyContentWidthClass } from '@/components/deckStudy/StudyModeHeader'
import { savedCardWord } from '@/domain/templateFieldDisplay'
import { sortDeckCardsAlphabetically } from '@/domain/deckCardList'
import { useToast } from '@/providers/toastContext'
import { storage } from '@/storage/adapter'
import { useLibraryStore } from '@/store/library/libraryStore'

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
  const [navigatorOpen, setNavigatorOpen] = useState(false)

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

  const syncCardParam = useCallback(
    (nextIndex: number) => {
      const card = deckCards[nextIndex]
      if (!card) return
      setSearchParams({ card: card.id }, { replace: true })
    },
    [deckCards, setSearchParams],
  )

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= total) return
      setIndex(nextIndex)
      syncCardParam(nextIndex)
    },
    [total, syncCardParam],
  )

  const goToCardId = useCallback(
    (cardId: string) => {
      const idx = deckCards.findIndex((c) => c.id === cardId)
      if (idx >= 0) goToIndex(idx)
    },
    [deckCards, goToIndex],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || navigatorOpen || actionsOpen || busy) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToIndex(index - 1)
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToIndex(index + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, goToIndex, navigatorOpen, actionsOpen, busy])

  if (hydrated && !deck) {
    return <Navigate to="/decks" replace />
  }

  if (hydrated && deck && total === 0) {
    return <Navigate to={`/decks/${deckId}`} replace />
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

  if (!deck || !currentCard || !deckId) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-white dark:bg-surface-950">
        <p className="text-[14px] text-slate-500">Loading…</p>
      </div>
    )
  }

  const editUrl = `/decks/${deckId}/cards/${currentCard.id}/edit?from=study`

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-surface-950">
      <StudyModeHeader deckId={deckId} deckName={deck.name} />

      <div className={`${studyContentWidthClass} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        <StudyCardNavigationShell
          canGoPrev={index > 0}
          canGoNext={index < total - 1}
          onPrev={() => goToIndex(index - 1)}
          onNext={() => goToIndex(index + 1)}
          disabled={busy || navigatorOpen || actionsOpen}
        >
          <StudyCardView
            key={currentCard.id}
            card={currentCard}
            menuDisabled={busy}
            onMenu={() => setActionsOpen(true)}
          />
        </StudyCardNavigationShell>
      </div>

      <StudyBottomToolbar
        current={position}
        total={total}
        canGoPrev={index > 0}
        canGoNext={index < total - 1}
        onPrev={() => goToIndex(index - 1)}
        onNext={() => goToIndex(index + 1)}
        onOpenNavigator={() => setNavigatorOpen(true)}
      />

      <StudyCardNavigatorModal
        open={navigatorOpen}
        cards={deckCards}
        currentCardId={currentCard.id}
        onClose={() => setNavigatorOpen(false)}
        onSelect={goToCardId}
      />

      <StudyCardActionsSheet
        open={actionsOpen}
        cardLabel={savedCardWord(currentCard)}
        busy={busy}
        onClose={() => setActionsOpen(false)}
        onEdit={() => {
          setActionsOpen(false)
          navigate(editUrl)
        }}
        onDelete={() => void handleDeleteCard()}
      />
    </div>
  )
}
