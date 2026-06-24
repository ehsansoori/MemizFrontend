import { SavedCardTemplateBlocksView, SAVED_CARD_READ_VARIANT } from '@/components/cardDisplay/SavedCardTemplateBlocksView'
import type { SavedCard } from '@/types/cards'

type ReviewAnswerDetailsProps = {
  card: SavedCard
  variant?: 'study' | 'quiz' | 'preview'
}

export function ReviewAnswerDetails({ card, variant = SAVED_CARD_READ_VARIANT }: ReviewAnswerDetailsProps) {
  return (
    <div className="w-full">
      <SavedCardTemplateBlocksView card={card} side="back" variant={variant} />
    </div>
  )
}
