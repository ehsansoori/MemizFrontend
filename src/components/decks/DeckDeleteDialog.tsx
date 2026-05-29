import { useEffect, useRef } from 'react'
import type { Deck } from '@/types/cards'
import type { DeleteDeckMode } from '@/store/library/deckManagement'

type DeckDeleteDialogProps = {
  deck: Deck
  cardCount: number
  inboxName: string
  busy: boolean
  onClose: () => void
  onConfirm: (mode: DeleteDeckMode) => void
}

export function DeckDeleteDialog({
  deck,
  cardCount,
  inboxName,
  busy,
  onClose,
  onConfirm,
}: DeckDeleteDialogProps) {
  const firstActionRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    firstActionRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const hasCards = cardCount > 0

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-950/55 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="deck-delete-title"
        aria-describedby="deck-delete-desc"
        className="w-full max-w-[17.5rem] rounded-xl border border-slate-700/80 bg-slate-900 px-4 py-4 shadow-xl ring-1 ring-white/[0.06]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="deck-delete-title"
          className="text-[14px] font-semibold text-slate-100"
        >
          Delete deck?
        </h3>
        <p
          id="deck-delete-desc"
          className="mt-1.5 text-[12px] leading-relaxed text-slate-400"
        >
          {hasCards ? (
            <>
              <span className="font-medium text-slate-300">&ldquo;{deck.name}&rdquo;</span>{' '}
              has {cardCount} card{cardCount === 1 ? '' : 's'}. What should happen to them?
            </>
          ) : (
            <>
              Permanently delete{' '}
              <span className="font-medium text-slate-300">&ldquo;{deck.name}&rdquo;</span>?
              This cannot be undone.
            </>
          )}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {hasCards ? (
            <>
              <button
                ref={firstActionRef}
                type="button"
                disabled={busy}
                onClick={() => onConfirm('moveToInbox')}
                className="rounded-lg border border-slate-600/60 bg-slate-800/80 px-3 py-2 text-left text-[13px] font-medium text-slate-200 transition hover:border-slate-500/70 hover:bg-slate-800 disabled:opacity-50"
              >
                Move cards to {inboxName}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onConfirm('deleteCards')}
                className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-left text-[13px] font-medium text-red-300 transition hover:bg-red-950/60 disabled:opacity-50"
              >
                Delete all {cardCount} card{cardCount === 1 ? '' : 's'} permanently
              </button>
            </>
          ) : (
            <button
              ref={firstActionRef}
              type="button"
              disabled={busy}
              onClick={() => onConfirm('deleteCards')}
              className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-[13px] font-medium text-red-300 transition hover:bg-red-950/60 disabled:opacity-50"
            >
              Delete deck
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-[13px] font-medium text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-200 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
