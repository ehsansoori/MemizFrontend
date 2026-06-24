import { CURRENT_GENERATION_MODEL_VERSION } from '@/constants/generation'
import type { SavedCard } from '@/types/cards'

export function stampGenerationMetadata(card: SavedCard, at = new Date().toISOString()): SavedCard {
  return {
    ...card,
    lastGeneratedAt: at,
    lastGeneratedModelVersion: CURRENT_GENERATION_MODEL_VERSION,
  }
}

export { CURRENT_GENERATION_MODEL_VERSION }
