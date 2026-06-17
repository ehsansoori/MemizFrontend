import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { BrowseCardActionsSheet } from '@/components/deckBrowse/BrowseCardActionsSheet'
import { BrowseCardRow } from '@/components/deckBrowse/BrowseCardRow'
import { DeckCardFilterBar } from '@/components/deckBrowse/DeckCardFilterBar'
import { savedCardWord } from '@/domain/cardFaceText'
import {
  countDeckCardsByStatus,
  filterDeckCardsForBrowse,
  type DeckCardStatusFilter,
} from '@/domain/deckCardList'
import { createDuplicateSavedCard } from '@/domain/duplicateSavedCard'
import { useToast } from '@/providers/toastContext'
import { storage } from '@/storage/adapter'
import { useLibraryStore } from '@/store/library/libraryStore'
import type { SavedCard } from '@/types/cards'

export function DeckBrowsePage() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const decks = useLibraryStore((s) => s.decks)
  const allCards = useLibraryStore((s) => s.cards)
  const hydrated = useLibraryStore((s) => s.hydrated)
  const reload = useLibraryStore((s) => s.reload)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DeckCardStatusFilter>('all')
  const [busy, setBusy] = useState(false)
  const [actionsCard, setActionsCard] = useState<SavedCard | null>(null)

  const deck = useMemo(
    () => (deckId ? decks.find((d) => d.id === deckId) : undefined),
    [decks, deckId],
  )

  const deckCards = useMemo(
    () => (deckId ? allCards.filter((c) => c.deckId === deckId) : []),
    [allCards, deckId],
  )

  const filteredCards = useMemo(
    () => filterDeckCardsForBrowse(deckCards, query, statusFilter),
    [deckCards, query, statusFilter],
  )

  const statusCounts = useMemo(() => countDeckCardsByStatus(deckCards), [deckCards])

  if (hydrated && !deck) {
    return <Navigate to="/decks" replace />
  }

  const openStudyAtCard = (cardId: string) => {
    if (!deckId) return
    navigate(`/decks/${deckId}/study?card=${cardId}`)
  }

  const handleDeleteCard = async (card: SavedCard) => {
    if (!window.confirm(`Delete “${card.data.word}”?`)) return
    setBusy(true)
    try {
      await storage.cards.softDelete(card.id)
      await reload()
      setActionsCard(null)
      showToast('Card deleted.', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not delete card.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDuplicateCard = async (card: SavedCard) => {
    setBusy(true)
    try {
      await storage.cards.put(createDuplicateSavedCard(card))
      await reload()
      setActionsCard(null)
      showToast('Card duplicated.', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not duplicate card.', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (!deck) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <p className="text-center text-[14px] text-slate-500">Loading…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-8 pt-4 sm:px-6">
      <div className="mb-5">
        <Link
          to={`/decks/${deckId}`}
          className="mb-3 inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-medium text-accent"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
          {deck.name}
        </Link>
        <h1 className="text-[24px] font-bold tracking-tight text-slate-900 dark:text-white">Browse</h1>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          Find and manage cards. Tap a card to open it in Study.
        </p>
      </div>

      <DeckCardFilterBar
        query={query}
        onQueryChange={setQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusCounts={statusCounts}
      />

      {filteredCards.length === 0 ? (
        <div className="mt-12 flex flex-col items-center px-6 text-center">
          <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-200">
            {deckCards.length === 0 ? 'No cards in this deck' : 'No cards match'}
          </p>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            {deckCards.length === 0
              ? 'Add cards from the deck page.'
              : 'Try another search or filter.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredCards.map((card) => (
            <li key={card.id}>
              <BrowseCardRow
                card={card}
                disabled={busy}
                onOpen={() => openStudyAtCard(card.id)}
                onMenu={() => setActionsCard(card)}
              />
            </li>
          ))}
        </ul>
      )}

      <BrowseCardActionsSheet
        open={actionsCard !== null}
        cardLabel={actionsCard ? savedCardWord(actionsCard) : ''}
        busy={busy}
        onClose={() => setActionsCard(null)}
        onEdit={() => {
          if (!actionsCard || !deckId) return
          const cardId = actionsCard.id
          setActionsCard(null)
          navigate(`/decks/${deckId}/cards/${cardId}/edit?from=browse`)
        }}
        onDuplicate={() => {
          if (!actionsCard) return
          void handleDuplicateCard(actionsCard)
        }}
        onDelete={() => {
          if (!actionsCard) return
          void handleDeleteCard(actionsCard)
        }}
      />
    </main>
  )
}
