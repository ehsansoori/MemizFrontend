import { useCallback, useMemo, useReducer, useState, type ReactNode } from 'react'
import { DeckCommitModal } from '@/components/decks/DeckCommitModal'
import { useToast } from '@/providers/toastContext'
import { useLibraryStore } from '@/store/library/libraryStore'
import type { CommitToDeckInput } from '@/store/library/types'
import {
  computeStats,
  initialReviewState,
  reviewReducer,
} from '@/store/generatedSession/reviewReducer'
import { ReviewContext } from '@/store/generatedSession/reviewContext'

export function GeneratedSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reviewReducer, initialReviewState)
  const [commitTarget, setCommitTarget] = useState<string[] | null>(null)
  const [commitModalKey, setCommitModalKey] = useState(0)
  const { showToast } = useToast()

  const decks = useLibraryStore((s) => s.decks)
  const activeDeckId = useLibraryStore((s) => s.activeDeckId)
  const commitCards = useLibraryStore((s) => s.commitCards)
  const commitCardsToActiveDeck = useLibraryStore((s) => s.commitCardsToActiveDeck)

  const currentCard = useMemo(() => {
    if (!state.session?.cards.length) return null
    return state.session.cards[state.currentIndex] ?? null
  }, [state.session, state.currentIndex])

  const stats = useMemo(() => computeStats(state.session), [state.session])

  const openCommitModal = useCallback((cardIds: string[]) => {
    if (cardIds.length === 0) return
    setCommitTarget(cardIds)
    setCommitModalKey((k) => k + 1)
  }, [])

  const commitToActiveDeck = useCallback(
    async (cardIds: string[]) => {
      if (!state.session || cardIds.length === 0) return
      const idSet = new Set(cardIds)
      const cardsToCommit = state.session.cards.filter((c) => idSet.has(c.id))
      if (cardsToCommit.length === 0) return

      try {
        const result = await commitCardsToActiveDeck(cardsToCommit)
        dispatch({ type: 'REMOVE_COMMITTED_CARDS', cardIds })
        showToast(`Saved to deck: ${result.deckName}`, 'success')
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not save to deck. Please try again.'
        showToast(message, 'error')
        openCommitModal(cardIds)
      }
    },
    [state.session, commitCardsToActiveDeck, showToast, openCommitModal],
  )

  const handleCommitToDeck = useCallback(
    async (input: CommitToDeckInput) => {
      if (!state.session || !commitTarget?.length) return

      const idSet = new Set(commitTarget)
      const cardsToCommit = state.session.cards.filter((c) => idSet.has(c.id))
      if (cardsToCommit.length === 0) return

      try {
        const result = await commitCards({ cardsToCommit, input })
        dispatch({ type: 'REMOVE_COMMITTED_CARDS', cardIds: commitTarget })
        showToast(`Saved to deck: ${result.deckName}`, 'success')
        setCommitTarget(null)
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not save to deck. Please try again.'
        showToast(message, 'error')
        throw e
      }
    },
    [state.session, commitTarget, commitCards, showToast],
  )

  const value = useMemo(
    () => ({
      state,
      dispatch,
      stats,
      currentCard,
      openCommitModal,
      commitToActiveDeck,
    }),
    [state, dispatch, stats, currentCard, openCommitModal, commitToActiveDeck],
  )

  return (
    <ReviewContext.Provider value={value}>
      {children}
      <DeckCommitModal
        key={commitModalKey}
        cardIds={commitTarget}
        decks={decks}
        defaultDeckId={activeDeckId}
        onCommit={handleCommitToDeck}
        onClose={() => setCommitTarget(null)}
      />
    </ReviewContext.Provider>
  )
}
