import { FlashcardBackView } from '@/components/cardDisplay/FlashcardBackView'
import type { TemplateCardBlock } from '@/domain/templateCardBlocks'
import type { GeneratedCardData } from '@/types/cards'

type CardTemplateBlocksViewProps = {
  blocks: TemplateCardBlock[]
  data: GeneratedCardData
  variant?: 'study' | 'quiz' | 'preview'
  contentAlign?: 'start' | 'center'
  className?: string
}

/** Read-only template block renderer shared by Study View and card previews. */
export function CardTemplateBlocksView({
  blocks,
  data,
  variant = 'preview',
  contentAlign = 'start',
  className,
}: CardTemplateBlocksViewProps) {
  if (blocks.length === 0) return null

  return (
    <div className={className}>
      <FlashcardBackView
        data={data}
        blocks={blocks}
        variant={variant}
        contentAlign={contentAlign}
        showWord={false}
      />
    </div>
  )
}
