import type { SavedCard } from '@/types/cards'
import {
  getTemplateDisplaySegments,
  savedCardBackText,
  savedCardFrontText,
  savedCardMeaning,
  savedCardMeaningPreview,
  savedCardWord,
  type FieldDisplayRole,
  type TemplateDisplaySegment,
} from '@/domain/templateFieldDisplay'

export {
  getTemplateDisplaySegments,
  savedCardBackText,
  savedCardFrontText,
  savedCardMeaning,
  savedCardMeaningPreview,
  savedCardWord,
  type FieldDisplayRole,
  type TemplateDisplaySegment,
}

export function cardReviewCount(card: SavedCard): number {
  return card.study.reviewCount ?? 0
}

export function savedCardBackPreview(card: SavedCard, maxLength = 72): string {
  const text = savedCardBackText(card)
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}
