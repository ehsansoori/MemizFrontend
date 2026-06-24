import type { SavedCard } from '@/types/cards'
import { cardInput } from '@/domain/languageCardData'

export function buildFacesFromData(card: SavedCard): { front: string; back: string } {
  const { data } = card
  const input = cardInput(data)
  const frontParts = [input]
  const backParts: string[] = []
  if (data.translation?.trim()) {
    backParts.push(data.translation.trim())
  }
  return {
    front: frontParts.filter(Boolean).join('\n'),
    back: backParts.join('\n\n') || card.back,
  }
}
