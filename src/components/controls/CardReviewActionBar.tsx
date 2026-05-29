import { useCallback, useEffect, useRef, useState } from 'react'
import { useGeneratedSessionStore } from '@/store/generatedSession/reviewHooks'
import {
  isRegenerateMutationAbort,
  useRegenerateCardsMutation,
} from '@/hooks/cards/useRegenerateCardsMutation'
import { getApiErrorMessage } from '@/services/api/getApiErrorMessage'
import { useToast } from '@/providers/toastContext'
import { useLibraryStore } from '@/store/library/libraryStore'
import { renderCardFaceText } from '@/utils/renderCardFace'

function IconMoreHorizontal({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  )
}

/** Top-right on the card: ⋯ opens a floating popover (does not affect layout flow). */
export function CardReviewActionBar() {
  const { state, dispatch, currentCard, openCommitModal, commitToActiveDeck } =
    useGeneratedSessionStore()
  const activeDeckId = useLibraryStore((s) => s.activeDeckId)
  const decks = useLibraryStore((s) => s.decks)
  const activeDeckName =
    decks.find((d) => d.id === activeDeckId)?.name ?? 'active deck'
  const { showToast } = useToast()
  const regenerateMutation = useRegenerateCardsMutation()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [copyHint, setCopyHint] = useState<string | null>(null)

  const total = state.session?.cards.length ?? 0

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const runRegenerate = useCallback(
    (mode: 'full' | 'examplesOnly') => {
      if (!currentCard) return
      setOpen(false)
      dispatch({ type: 'SET_CARD_REGENERATING', cardId: currentCard.id, value: true })

      regenerateMutation.mutate(
        { cards: [currentCard], mode },
        {
          onSuccess: ({ cards }) => {
            const next = cards[0]
            if (next) {
              dispatch({ type: 'REPLACE_CARD', card: next })
            }
          },
          onError: (err) => {
            if (isRegenerateMutationAbort(err)) return
            const message = getApiErrorMessage(err, 'Could not regenerate card.')
            showToast(message, 'error')
          },
          onSettled: () => {
            dispatch({
              type: 'SET_CARD_REGENERATING',
              cardId: currentCard.id,
              value: false,
            })
          },
        },
      )
    },
    [currentCard, dispatch, regenerateMutation, showToast],
  )

  const copyCard = useCallback(async () => {
    if (!currentCard) return
    setOpen(false)
    const front = renderCardFaceText(currentCard.data, currentCard.frontLayout)
    const back = renderCardFaceText(currentCard.data, currentCard.backLayout)
    const text = `${front}\n\n—\n\n${back}`
    try {
      await navigator.clipboard.writeText(text)
      setCopyHint('Copied')
    } catch {
      setCopyHint('Copy failed')
    }
    window.setTimeout(() => setCopyHint(null), 2000)
  }, [currentCard])

  if (!currentCard || total === 0) {
    return null
  }

  const busy = currentCard.isRegenerating || regenerateMutation.isPending

  return (
    <div ref={wrapRef} className="absolute top-2 right-2 z-30 sm:top-3 sm:right-3">
      <button
        type="button"
        aria-label="Card actions"
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100/90 hover:text-slate-800 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
      >
        <IconMoreHorizontal className="opacity-90" />
      </button>
      {copyHint ? (
        <span
          className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded-md border border-slate-200/90 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          role="status"
        >
          {copyHint}
        </span>
      ) : null}
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[12.5rem] overflow-hidden rounded-lg border border-slate-200/90 bg-white py-1 shadow-lg ring-1 ring-slate-900/[0.06] dark:border-slate-700 dark:bg-slate-900 dark:ring-white/[0.06]"
        >
          <button
            type="button"
            role="menuitem"
            disabled={busy || !activeDeckId}
            className="flex w-full px-3 py-2 text-left text-[13px] text-slate-700 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:enabled:hover:bg-slate-800/80"
            onClick={() => {
              setOpen(false)
              void commitToActiveDeck([currentCard.id])
            }}
          >
            Save to {activeDeckName}
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            className="flex w-full px-3 py-2 text-left text-[13px] text-slate-700 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:enabled:hover:bg-slate-800/80"
            onClick={() => {
              setOpen(false)
              openCommitModal([currentCard.id])
            }}
          >
            Save to another deck…
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            className="flex w-full px-3 py-2 text-left text-[13px] text-slate-700 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:enabled:hover:bg-slate-800/80"
            onClick={() => runRegenerate('full')}
          >
            Regenerate card
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            className="flex w-full px-3 py-2 text-left text-[13px] text-slate-700 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:enabled:hover:bg-slate-800/80"
            onClick={() => runRegenerate('examplesOnly')}
          >
            Regenerate examples
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            className="flex w-full px-3 py-2 text-left text-[13px] text-slate-700 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:enabled:hover:bg-slate-800/80"
            onClick={() => void copyCard()}
          >
            Copy card text
          </button>
          <div className="my-0.5 h-px bg-slate-100 dark:bg-slate-800" />
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            className="flex w-full px-3 py-2 text-left text-[13px] text-red-600 transition hover:bg-red-50/90 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/35"
            onClick={() => {
              setOpen(false)
              if (window.confirm('Remove this card from the draft session?')) {
                dispatch({ type: 'DELETE_CARD', cardId: currentCard.id })
              }
            }}
          >
            Delete card
          </button>
        </div>
      ) : null}
    </div>
  )
}
