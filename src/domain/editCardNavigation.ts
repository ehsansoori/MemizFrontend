import type { DeckCardStatusFilter } from '@/domain/deckCardList'

export type EditCardSourcePage = 'study' | 'browse' | 'quiz' | 'deck'

export type BrowseSessionState = {
  query: string
  statusFilter: DeckCardStatusFilter
  scrollY: number
}

export type StudySessionState = {
  cardId: string
  cardIndex: number
}

export type QuizSessionState = {
  cardId: string
  cardIndex: number
  showAnswer?: boolean
}

export type DeckSessionState = Record<string, never>

export type EditCardSourceSessionState =
  | BrowseSessionState
  | StudySessionState
  | QuizSessionState
  | DeckSessionState

export type EditCardSourceContext = {
  sourcePage: EditCardSourcePage
  sourceDeckId: string
  sourceSessionState: EditCardSourceSessionState
}

const SOURCE_PAGE_VALUES = new Set<EditCardSourcePage>(['study', 'browse', 'quiz', 'deck'])
const STORAGE_PREFIX = 'memiz.editCardSource.v1.'

function storageKey(cardId: string): string {
  return `${STORAGE_PREFIX}${cardId}`
}

function parseLegacySourcePage(searchParams: URLSearchParams): EditCardSourcePage | null {
  const returnTo = searchParams.get('returnTo')
  if (returnTo && SOURCE_PAGE_VALUES.has(returnTo as EditCardSourcePage)) {
    return returnTo as EditCardSourcePage
  }

  const from = searchParams.get('from')
  if (from === 'study') return 'study'
  if (from === 'browse') return 'browse'
  if (from === 'quiz' || from === 'review') return 'quiz'

  return null
}

export function saveEditCardSourceContext(cardId: string, context: EditCardSourceContext): void {
  try {
    sessionStorage.setItem(storageKey(cardId), JSON.stringify(context))
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function loadEditCardSourceContext(cardId: string): EditCardSourceContext | null {
  try {
    const raw = sessionStorage.getItem(storageKey(cardId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as EditCardSourceContext
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !SOURCE_PAGE_VALUES.has(parsed.sourcePage) ||
      typeof parsed.sourceDeckId !== 'string'
    ) {
      return null
    }
    return {
      sourcePage: parsed.sourcePage,
      sourceDeckId: parsed.sourceDeckId,
      sourceSessionState: parsed.sourceSessionState ?? {},
    }
  } catch {
    return null
  }
}

export function clearEditCardSourceContext(cardId: string): void {
  try {
    sessionStorage.removeItem(storageKey(cardId))
  } catch {
    // Ignore storage errors.
  }
}

export function buildEditCardPath(
  deckId: string,
  cardId: string,
  context: {
    sourcePage: EditCardSourcePage
    sourceDeckId?: string
    sourceSessionState: EditCardSourceSessionState
  },
): string {
  const fullContext: EditCardSourceContext = {
    sourcePage: context.sourcePage,
    sourceDeckId: context.sourceDeckId ?? deckId,
    sourceSessionState: context.sourceSessionState,
  }
  saveEditCardSourceContext(cardId, fullContext)

  const params = new URLSearchParams({
    sourcePage: fullContext.sourcePage,
    sourceDeckId: fullContext.sourceDeckId,
  })
  return `/decks/${deckId}/cards/${cardId}/edit?${params.toString()}`
}

export function parseEditCardSourceContext(
  cardId: string | undefined,
  searchParams: URLSearchParams,
  routeDeckId?: string,
): EditCardSourceContext | null {
  if (cardId) {
    const stored = loadEditCardSourceContext(cardId)
    if (stored) return stored
  }

  const sourcePage =
    (searchParams.get('sourcePage') as EditCardSourcePage | null) ?? parseLegacySourcePage(searchParams)
  const sourceDeckId = searchParams.get('sourceDeckId') ?? routeDeckId
  if (!sourcePage || !sourceDeckId) return null

  return {
    sourcePage,
    sourceDeckId,
    sourceSessionState: {},
  }
}

export function resolveEditCardReturnUrl(
  context: EditCardSourceContext | null,
  fallbackDeckId: string,
  options?: { cardMoved?: boolean },
): string {
  if (!context) return `/decks/${fallbackDeckId}`

  const { sourcePage, sourceDeckId, sourceSessionState } = context

  switch (sourcePage) {
    case 'study': {
      const state = sourceSessionState as StudySessionState
      if (options?.cardMoved && typeof state.cardIndex === 'number') {
        return `/decks/${sourceDeckId}/study?atIndex=${state.cardIndex}`
      }
      if (state.cardId) {
        return `/decks/${sourceDeckId}/study?card=${state.cardId}`
      }
      return `/decks/${sourceDeckId}/study`
    }
    case 'browse': {
      const state = sourceSessionState as BrowseSessionState
      const params = new URLSearchParams()
      if (state.query) params.set('q', state.query)
      if (state.statusFilter && state.statusFilter !== 'all') {
        params.set('filter', state.statusFilter)
      }
      if (state.scrollY > 0) params.set('scrollY', String(Math.round(state.scrollY)))
      const qs = params.toString()
      return `/decks/${sourceDeckId}/browse${qs ? `?${qs}` : ''}`
    }
    case 'quiz': {
      const state = sourceSessionState as QuizSessionState
      if (options?.cardMoved && typeof state.cardIndex === 'number') {
        return `/decks/${sourceDeckId}/quiz?atIndex=${state.cardIndex}`
      }
      if (state.cardId) {
        return `/decks/${sourceDeckId}/quiz?card=${state.cardId}`
      }
      return `/decks/${sourceDeckId}/quiz`
    }
    case 'deck':
    default:
      return `/decks/${sourceDeckId}`
  }
}

/** @deprecated Use parseEditCardSourceContext().sourcePage */
export function parseEditCardReturnTo(searchParams: URLSearchParams): EditCardSourcePage | null {
  return parseEditCardSourceContext(undefined, searchParams)?.sourcePage ?? null
}
