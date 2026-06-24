import { CardTemplateBlocksView } from '@/components/cardDisplay/CardTemplateBlocksView'
import { getTemplateCardBlocks } from '@/domain/templateCardBlocks'
import { alignCardDataForDisplay, resolveSavedCardTemplate } from '@/domain/resolveDeckTemplate'
import type { GeneratedCardData } from '@/types/cards'
import type { TemplateCardBlock } from '@/domain/templateCardBlocks'
import type { SavedCard } from '@/types/cards'

export type SavedCardTemplateSide = 'front' | 'back' | 'all'

/** Shared read-only display variant for Study, Quiz, and browse previews. */
export const SAVED_CARD_READ_VARIANT = 'study' as const

export function getSavedCardTemplateBlocks(
  card: SavedCard,
  side: SavedCardTemplateSide = 'all',
): { blocks: TemplateCardBlock[]; data: GeneratedCardData } {
  const template = resolveSavedCardTemplate(card)
  const { front, back } = getTemplateCardBlocks(template)
  const blocks = side === 'front' ? front : side === 'back' ? back : [...front, ...back]

  return {
    blocks,
    data: alignCardDataForDisplay(card),
  }
}

type SavedCardTemplateBlocksViewProps = {
  card: SavedCard
  side?: SavedCardTemplateSide
  variant?: 'study' | 'quiz' | 'preview'
  contentAlign?: 'start' | 'center'
  className?: string
}

/** Template-driven card renderer from the card's saved template snapshot. */
export function SavedCardTemplateBlocksView({
  card,
  side = 'all',
  variant = 'preview',
  contentAlign = 'start',
  className,
}: SavedCardTemplateBlocksViewProps) {
  const { blocks, data } = getSavedCardTemplateBlocks(card, side)

  return (
    <CardTemplateBlocksView
      blocks={blocks}
      data={data}
      variant={variant}
      contentAlign={contentAlign}
      className={className}
    />
  )
}
