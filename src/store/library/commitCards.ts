import {
  createInboxDeck,
  findInboxDeck,
  isReservedInboxName,
} from '@/domain/inboxDeck'
import { createDefaultStudyProgress } from '@/domain/studyDefaults'
import { renderCardFaceText } from '@/utils/renderCardFace'
import { storage } from '@/storage/adapter'
import type { Deck, SavedCard } from '@/types/cards'
import type { CommitCardsSource, CommitToDeckResult } from '@/store/library/types'

function newId(): string {
  return crypto.randomUUID()
}

function nowIso(): string {
  return new Date().toISOString()
}

function savedCardFromGenerated(card: CommitCardsSource['cardsToCommit'][0], deckId: string): SavedCard {
  const t = nowIso()
  return {
    id: newId(),
    originalGeneratedCardId: card.id,
    deckId,
    front: renderCardFaceText(card.data, card.frontLayout),
    back: renderCardFaceText(card.data, card.backLayout),
    data: { ...card.data, examples: card.data.examples.map((e) => ({ ...e })) },
    savedAt: t,
    updatedAt: t,
    study: createDefaultStudyProgress(),
  }
}

/**
 * Persist committed draft cards to IndexedDB (local-first).
 * Returns new domain rows for in-memory store update.
 */
export async function persistCommitToDeck(
  source: CommitCardsSource,
): Promise<CommitToDeckResult> {
  const { cardsToCommit, input } = source
  if (cardsToCommit.length === 0) {
    throw new Error('No cards to commit.')
  }

  const t = nowIso()
  let deckId: string
  let deckName: string
  let deckRow: Deck

  if ('newDeckName' in input) {
    const name = input.newDeckName.trim()
    if (!name) throw new Error('Deck name is required.')

    if (isReservedInboxName(name)) {
      const allDecks = await storage.decks.getAll()
      const existing = findInboxDeck(allDecks)
      if (existing) {
        const touched = await storage.decks.touchLastUsed(existing.id)
        deckRow = touched ?? { ...existing, lastUsedAt: t, updatedAt: t }
        deckId = deckRow.id
        deckName = deckRow.name
      } else {
        deckRow = createInboxDeck()
        await storage.decks.put(deckRow)
        deckId = deckRow.id
        deckName = deckRow.name
      }
    } else {
      deckRow = {
        id: newId(),
        name,
        createdAt: t,
        updatedAt: t,
        lastUsedAt: t,
      }
      await storage.decks.put(deckRow)
      deckId = deckRow.id
      deckName = name
    }
  } else {
    const existing = await storage.decks.getById(input.deckId)
    if (!existing) throw new Error('Deck not found.')
    const touched = await storage.decks.touchLastUsed(input.deckId)
    deckRow = touched ?? { ...existing, lastUsedAt: t, updatedAt: t }
    deckId = deckRow.id
    deckName = deckRow.name
  }

  const savedCards = cardsToCommit.map((c) => savedCardFromGenerated(c, deckId))
  await storage.cards.putMany(savedCards)

  return { deckId, deckName, savedCards }
}
