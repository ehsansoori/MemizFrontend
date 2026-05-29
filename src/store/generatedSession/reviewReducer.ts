import type {
  CardFieldLayout,
  GeneratedCard,
  GeneratedSession,
} from '@/types/cards'
import {
  cloneLayoutForCard,
  createDefaultBackLayout,
  createDefaultFrontLayout,
  partitionLayouts,
} from '@/utils/cardLayoutModel'
import type {
  ReviewAction,
  ReviewState,
  SessionStats,
} from '@/store/generatedSession/reviewTypes'

function newId(): string {
  return crypto.randomUUID()
}

function nowIso(): string {
  return new Date().toISOString()
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return Math.max(0, Math.min(index, length - 1))
}

function applyLayoutToCards(
  cards: GeneratedCard[],
  frontTemplate: CardFieldLayout[],
  backTemplate: CardFieldLayout[],
): GeneratedCard[] {
  const t = nowIso()
  return cards.map((c) => ({
    ...c,
    frontLayout: cloneLayoutForCard(frontTemplate),
    backLayout: cloneLayoutForCard(backTemplate),
    updatedAt: t,
  }))
}

function bumpSessionUpdated(s: GeneratedSession): GeneratedSession {
  return { ...s, updatedAt: nowIso() }
}

export const initialReviewState: ReviewState = {
  session: null,
  currentIndex: 0,
  frontLayout: createDefaultFrontLayout(),
  backLayout: createDefaultBackLayout(),
}

export function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case 'SET_SESSION_FROM_CARDS': {
      const t = nowIso()
      const { front, back } = partitionLayouts(
        state.frontLayout,
        state.backLayout,
      )
      const cards = action.cards.map((c) => ({
        ...c,
        frontLayout: cloneLayoutForCard(front),
        backLayout: cloneLayoutForCard(back),
        updatedAt: t,
      }))
      const session: GeneratedSession = {
        sessionId: newId(),
        createdAt: t,
        updatedAt: t,
        sourceType: action.sourceType,
        cards,
      }
      return {
        ...state,
        session,
        currentIndex: 0,
      }
    }
    case 'CLEAR_SESSION': {
      return { ...state, session: null, currentIndex: 0 }
    }
    case 'SET_INDEX': {
      const len = state.session?.cards.length ?? 0
      return { ...state, currentIndex: clampIndex(action.index, len) }
    }
    case 'NAV_PREV': {
      const len = state.session?.cards.length ?? 0
      return {
        ...state,
        currentIndex: clampIndex(state.currentIndex - 1, len),
      }
    }
    case 'NAV_NEXT': {
      const len = state.session?.cards.length ?? 0
      return {
        ...state,
        currentIndex: clampIndex(state.currentIndex + 1, len),
      }
    }
    case 'SET_LAYOUT': {
      const { front, back } = partitionLayouts(
        action.frontLayout,
        action.backLayout,
      )
      if (!state.session) {
        return {
          ...state,
          frontLayout: front,
          backLayout: back,
        }
      }
      const cards = applyLayoutToCards(state.session.cards, front, back)
      return {
        ...state,
        frontLayout: front,
        backLayout: back,
        session: bumpSessionUpdated({
          ...state.session,
          cards,
        }),
      }
    }
    case 'UPDATE_CARD_DATA': {
      if (!state.session) return state
      const t = nowIso()
      const cards = state.session.cards.map((c) =>
        c.id === action.cardId
          ? {
              ...c,
              data: { ...c.data, ...action.data },
              isEdited: true,
              updatedAt: t,
            }
          : c,
      )
      return {
        ...state,
        session: bumpSessionUpdated({ ...state.session, cards }),
      }
    }
    case 'REPLACE_CARD': {
      if (!state.session) return state
      const cards = state.session.cards.map((c) =>
        c.id === action.card.id ? { ...action.card, updatedAt: nowIso() } : c,
      )
      return {
        ...state,
        session: bumpSessionUpdated({ ...state.session, cards }),
      }
    }
    case 'SET_CARD_REGENERATING': {
      if (!state.session) return state
      const cards = state.session.cards.map((c) =>
        c.id === action.cardId
          ? { ...c, isRegenerating: action.value, updatedAt: nowIso() }
          : c,
      )
      return {
        ...state,
        session: bumpSessionUpdated({ ...state.session, cards }),
      }
    }
    case 'REMOVE_COMMITTED_CARDS': {
      if (!state.session) return state
      const idSet = new Set(action.cardIds)
      const oldCards = state.session.cards
      const remaining = oldCards.filter((c) => !idSet.has(c.id))
      const newLen = remaining.length

      if (newLen === 0) {
        return {
          ...state,
          session: null,
          currentIndex: 0,
        }
      }

      const oldIdx = state.currentIndex
      const oldCurrentId = oldCards[oldIdx]?.id

      let nextIndex: number
      if (oldCurrentId && !idSet.has(oldCurrentId)) {
        const idx = remaining.findIndex((c) => c.id === oldCurrentId)
        nextIndex = idx >= 0 ? idx : clampIndex(oldIdx, newLen)
      } else {
        nextIndex = Math.min(oldIdx, newLen - 1)
      }
      nextIndex = clampIndex(nextIndex, newLen)

      return {
        ...state,
        session: bumpSessionUpdated({ ...state.session, cards: remaining }),
        currentIndex: nextIndex,
      }
    }
    case 'DELETE_CARD': {
      if (!state.session) return state
      const oldCards = state.session.cards
      const deletedIndex = oldCards.findIndex((c) => c.id === action.cardId)
      const cards = oldCards.filter((c) => c.id !== action.cardId)
      const newLen = cards.length
      let nextIndex = state.currentIndex
      if (deletedIndex >= 0 && deletedIndex < nextIndex) nextIndex -= 1
      if (deletedIndex >= 0 && deletedIndex === nextIndex && nextIndex >= newLen) {
        nextIndex = newLen - 1
      }
      nextIndex = clampIndex(nextIndex, newLen)
      if (newLen === 0) {
        return { ...state, session: null, currentIndex: 0 }
      }
      return {
        ...state,
        currentIndex: nextIndex,
        session: bumpSessionUpdated({
          ...state.session,
          cards,
        }),
      }
    }
    default:
      return state
  }
}

export function computeStats(session: GeneratedSession | null): SessionStats {
  return {
    draftCardCount: session?.cards.length ?? 0,
  }
}
