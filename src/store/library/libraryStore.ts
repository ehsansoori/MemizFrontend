import { create } from 'zustand'
import { getActiveDeck, resolveActiveDeckId } from '@/store/library/activeDeck'
import { storage } from '@/storage/adapter'
import { bootstrapLibraryDecks } from '@/storage/seed'
import { migrateMissingCardTemplateSnapshots } from '@/domain/cardTemplateSnapshotMigration'
import { migrateLibraryTemplateIdsInStorage } from '@/storage/migrateLibraryTemplateIds'
import { persistCommitToDeck } from '@/store/library/commitCards'
import {
  createDeckInStorage,
  deleteDeckInStorage,
  renameDeckInStorage,
  updateDeckSettingsInStorage,
  updateDeckDefaultTemplateInStorage,
  type DeleteDeckMode,
} from '@/store/library/deckManagement'
import type {
  CommitCardsSource,
  CommitToDeckResult,
} from '@/store/library/types'
import type { Deck, SavedCard } from '@/types/cards'
import type { CreateDeckParams, DeckSettings } from '@/types/deckProfile'

type LibraryState = {
  decks: Deck[]
  cards: SavedCard[]
  activeDeckId: string | null
  hydrated: boolean
  hydrating: boolean
  error: string | null
}

type LibraryActions = {
  hydrate: () => Promise<void>
  commitCards: (source: CommitCardsSource) => Promise<CommitToDeckResult>
  commitCardsToActiveDeck: (
    cardsToCommit: CommitCardsSource['cardsToCommit'],
  ) => Promise<CommitToDeckResult>
  reload: () => Promise<void>
  setActiveDeckId: (deckId: string) => Promise<void>
  createDeck: (params: CreateDeckParams) => Promise<Deck>
  updateDeckSettings: (deckId: string, settings: DeckSettings) => Promise<void>
  updateDeckDefaultTemplate: (deckId: string, defaultTemplateId: string) => Promise<void>
  renameDeck: (deckId: string, name: string) => Promise<void>
  deleteDeck: (deckId: string, mode: DeleteDeckMode) => Promise<void>
}

export type LibraryStore = LibraryState & LibraryActions

async function loadLibrary(): Promise<{
  decks: Deck[]
  cards: SavedCard[]
  activeDeckId: string | null
}> {
  await migrateLibraryTemplateIdsInStorage()
  await migrateMissingCardTemplateSnapshots()
  const decks = await bootstrapLibraryDecks()
  const cards = await storage.cards.getAll()
  const settings = await storage.settings.get()
  const activeDeckId = resolveActiveDeckId(decks, settings.activeDeckId)
  if (activeDeckId !== settings.activeDeckId) {
    await storage.settings.setActiveDeckId(activeDeckId)
  }
  return { decks, cards, activeDeckId }
}

/** Shared in-flight hydrate (React StrictMode runs effects twice). */
let hydratePromise: Promise<void> | null = null

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  decks: [],
  cards: [],
  activeDeckId: null,
  hydrated: false,
  hydrating: false,
  error: null,

  hydrate: async () => {
    if (get().hydrated) return

    if (!hydratePromise) {
      hydratePromise = (async () => {
        set({ hydrating: true, error: null })
        try {
          const { decks, cards, activeDeckId } = await loadLibrary()
          set({ decks, cards, activeDeckId, hydrated: true, hydrating: false, error: null })
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Failed to load library.'
          set({ hydrating: false, error: message })
          throw e
        } finally {
          hydratePromise = null
        }
      })()
    }

    await hydratePromise
  },

  reload: async () => {
    const { decks, cards, activeDeckId } = await loadLibrary()
    set({ decks, cards, activeDeckId, hydrated: true })
  },

  setActiveDeckId: async (deckId) => {
    const decks = get().decks
    const resolved = resolveActiveDeckId(decks, deckId)
    if (!resolved) return
    await storage.settings.setActiveDeckId(resolved)
    set({ activeDeckId: resolved })
  },

  commitCards: async (source) => {
    const result = await persistCommitToDeck(source)
    const { decks, cards } = await loadLibrary()
    await storage.settings.setActiveDeckId(result.deckId)
    set({ decks, cards, activeDeckId: result.deckId })
    return result
  },

  commitCardsToActiveDeck: async (cardsToCommit) => {
    const activeDeckId = get().activeDeckId
    if (!activeDeckId) {
      throw new Error('No active deck selected.')
    }
    const cardIds = cardsToCommit.map((c) => c.id)
    return get().commitCards({
      cardsToCommit,
      input: { cardIds, deckId: activeDeckId },
    })
  },

  createDeck: async (params) => {
    const deck = await createDeckInStorage(params)
    await storage.settings.setActiveDeckId(deck.id)
    const { decks, cards } = await loadLibrary()
    set({ decks, cards, activeDeckId: deck.id })
    return deck
  },

  updateDeckSettings: async (deckId, settings) => {
    await updateDeckSettingsInStorage(deckId, settings)
    const { decks, cards, activeDeckId } = await loadLibrary()
    set({ decks, cards, activeDeckId })
  },

  updateDeckDefaultTemplate: async (deckId, defaultTemplateId) => {
    await updateDeckDefaultTemplateInStorage(deckId, defaultTemplateId)
    const { decks, cards, activeDeckId } = await loadLibrary()
    set({ decks, cards, activeDeckId })
  },

  renameDeck: async (deckId, name) => {
    await renameDeckInStorage(deckId, name)
    const { decks, cards, activeDeckId } = await loadLibrary()
    set({ decks, cards, activeDeckId })
  },

  deleteDeck: async (deckId, mode) => {
    if (get().decks.length <= 1) {
      throw new Error('You must keep at least one deck.')
    }
    await deleteDeckInStorage(deckId, mode)
    const { decks, cards, activeDeckId: nextActiveId } = await loadLibrary()
    set({ decks, cards, activeDeckId: nextActiveId })
  },
}))

/** Active deck row for header UI. */
export function selectActiveDeck(state: LibraryStore): Deck | undefined {
  return getActiveDeck(state.decks, state.activeDeckId)
}
