import { createDefaultStudyProgress } from '@/domain/studyDefaults'
import type { SavedCard } from '@/types/cards'

function newId(): string {
  return crypto.randomUUID()
}

function nowIso(): string {
  return new Date().toISOString()
}

/** Clone a saved card with fresh ids and reset study progress. */
export function createDuplicateSavedCard(source: SavedCard): SavedCard {
  const t = nowIso()
  return {
    ...source,
    id: newId(),
    originalGeneratedCardId: newId(),
    data: {
      ...source.data,
      examples: source.data.examples.map((e) => ({ ...e })),
    },
    savedAt: t,
    updatedAt: t,
    study: createDefaultStudyProgress(),
  }
}
