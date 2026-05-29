import { createContext, type Dispatch } from 'react'
import type { GeneratedCard } from '@/types/cards'
import type {
  ReviewAction,
  ReviewState,
  SessionStats,
} from '@/store/generatedSession/reviewTypes'

export type ReviewContextValue = {
  state: ReviewState
  dispatch: Dispatch<ReviewAction>
  stats: SessionStats
  currentCard: GeneratedCard | null
  /** Open the deck picker to commit one or more draft cards to the library. */
  openCommitModal: (cardIds: string[]) => void
  /** Save draft cards to the globally active deck (no modal). */
  commitToActiveDeck: (cardIds: string[]) => Promise<void>
}

export const ReviewContext = createContext<ReviewContextValue | null>(null)
