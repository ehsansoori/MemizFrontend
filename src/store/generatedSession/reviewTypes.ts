import type {
  CardFieldLayout,
  GeneratedCard,
  GeneratedCardData,
  GeneratedSession,
  SessionSourceType,
} from '@/types/cards'

export type SessionStats = {
  draftCardCount: number
}

export type ReviewState = {
  session: GeneratedSession | null
  currentIndex: number
  frontLayout: CardFieldLayout[]
  backLayout: CardFieldLayout[]
}

export type ReviewAction =
  | {
      type: 'SET_SESSION_FROM_CARDS'
      cards: GeneratedCard[]
      sourceType: SessionSourceType
    }
  | { type: 'CLEAR_SESSION' }
  | { type: 'SET_INDEX'; index: number }
  | { type: 'NAV_PREV' }
  | { type: 'NAV_NEXT' }
  | {
      type: 'SET_LAYOUT'
      frontLayout: CardFieldLayout[]
      backLayout: CardFieldLayout[]
    }
  | { type: 'UPDATE_CARD_DATA'; cardId: string; data: Partial<GeneratedCardData> }
  | { type: 'REPLACE_CARD'; card: GeneratedCard }
  | { type: 'SET_CARD_REGENERATING'; cardId: string; value: boolean }
  | { type: 'REMOVE_COMMITTED_CARDS'; cardIds: string[] }
  | { type: 'DELETE_CARD'; cardId: string }
