import type { SavedCard } from '@/types/cards'

export function buildFacesFromData(card: SavedCard): { front: string; back: string } {
  const { data } = card
  const frontParts = [data.word]
  if (data.phonetic?.trim()) frontParts.push(data.phonetic.trim())
  const backParts: string[] = []
  if (data.targetMeaning?.trim()) {
    backParts.push(`Target meaning\n${data.targetMeaning.trim()}`)
  }
  if (data.englishMeaning?.trim()) {
    backParts.push(`English meaning\n${data.englishMeaning.trim()}`)
  }
  return {
    front: frontParts.join('\n'),
    back: backParts.join('\n\n') || card.back,
  }
}
