import { TemplateOrderedFields } from '@/components/cardDisplay/TemplateOrderedFields'
import { BottomSheet } from '@/components/decks/BottomSheet'
import { getTemplateDisplaySegments, savedCardWord } from '@/domain/templateFieldDisplay'
import type { SavedCard } from '@/types/cards'

export type DeckCardPreviewSheetProps = {
  open: boolean
  card: SavedCard | null
  onClose: () => void
}

export function DeckCardPreviewSheet({ open, card, onClose }: DeckCardPreviewSheetProps) {
  if (!card) {
    return (
      <BottomSheet open={false} onClose={onClose} title="Card preview">
        {null}
      </BottomSheet>
    )
  }

  const { front, back } = getTemplateDisplaySegments(card)

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`Preview ${savedCardWord(card)}`}
      heading={
        <h2 className="truncate text-[17px] font-bold text-slate-900 dark:text-white">
          Card preview
        </h2>
      }
    >
      <div className="space-y-6 px-5 pb-5">
        {front.length > 0 ? (
          <section>
            <TemplateOrderedFields segments={front} variant="preview" />
          </section>
        ) : null}
        {back.length > 0 ? (
          <section className={front.length > 0 ? 'border-t border-slate-100 pt-5 dark:border-slate-800' : ''}>
            <TemplateOrderedFields segments={back} variant="preview" />
          </section>
        ) : null}
      </div>
    </BottomSheet>
  )
}
