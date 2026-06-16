import { useState } from 'react'
import { BottomSheet } from '@/components/decks/BottomSheet'
import { cardFaceDisplayText } from '@/utils/renderCardFace'
import type { SavedCard } from '@/types/cards'

export type DeckCardPreviewSheetProps = {
  open: boolean
  card: SavedCard | null
  onClose: () => void
}

export function DeckCardPreviewSheet({ open, card, onClose }: DeckCardPreviewSheetProps) {
  const [showBack, setShowBack] = useState(false)

  const handleClose = () => {
    setShowBack(false)
    onClose()
  }

  const faceText = card
    ? cardFaceDisplayText(showBack ? card.back : card.front)
    : ''

  return (
    <BottomSheet
      open={open && card !== null}
      onClose={handleClose}
      title={card ? `Preview ${card.data.word}` : 'Card preview'}
      heading={
        <div className="flex items-center justify-between gap-3">
          <h2 className="truncate text-[17px] font-bold text-slate-900 dark:text-white">
            Card preview
          </h2>
          <button
            type="button"
            onClick={() => setShowBack((v) => !v)}
            className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition active:scale-95 dark:bg-slate-800 dark:text-slate-300"
          >
            {showBack ? 'Show front' : 'Show back'}
          </button>
        </div>
      }
    >
      <div className="px-5 pb-5">
        <div className="min-h-[180px] rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {showBack ? 'Back' : 'Front'}
          </p>
          <p className="whitespace-pre-wrap text-[18px] font-semibold leading-relaxed text-slate-900 dark:text-slate-50">
            {faceText || '—'}
          </p>
        </div>
      </div>
    </BottomSheet>
  )
}
