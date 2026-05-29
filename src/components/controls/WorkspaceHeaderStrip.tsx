import { useCallback, useEffect, useRef, useState } from 'react'
import { useGeneratedSessionStore } from '@/store/generatedSession/reviewHooks'
import { useLibraryStore } from '@/store/library/libraryStore'
import {
  isRegenerateMutationAbort,
  useRegenerateCardsMutation,
} from '@/hooks/cards/useRegenerateCardsMutation'
import { getApiErrorMessage } from '@/services/api/getApiErrorMessage'
import { useToast } from '@/providers/toastContext'


/**
 * Draft card count + floating session menu (generator workspace header).
 */
export function WorkspaceHeaderStrip() {
  const { state, dispatch, openCommitModal, commitToActiveDeck } =
    useGeneratedSessionStore()
  const activeDeckId = useLibraryStore((s) => s.activeDeckId)
  const decks = useLibraryStore((s) => s.decks)
  const activeDeckName =
    decks.find((d) => d.id === activeDeckId)?.name ?? 'active deck'
  const { showToast } = useToast()
  const regenerateMutation = useRegenerateCardsMutation()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const runRegenerateAll = useCallback(() => {
    if (!state.session) return
    setOpen(false)
    if (
      !window.confirm(
        'Regenerate every card still in this draft? Unsaved edits on those cards will be replaced.',
      )
    ) {
      return
    }

    const cards = state.session.cards
    for (const card of cards) {
      dispatch({ type: 'SET_CARD_REGENERATING', cardId: card.id, value: true })
    }

    regenerateMutation.mutate(
      { cards, mode: 'full' },
      {
        onSuccess: ({ cards: nextCards }) => {
          for (const card of nextCards) {
            dispatch({ type: 'REPLACE_CARD', card })
          }
          showToast('All draft cards regenerated.', 'success')
        },
        onError: (err) => {
          if (isRegenerateMutationAbort(err)) return
          showToast(getApiErrorMessage(err, 'Could not regenerate cards.'), 'error')
        },
        onSettled: () => {
          for (const card of cards) {
            dispatch({ type: 'SET_CARD_REGENERATING', cardId: card.id, value: false })
          }
        },
      },
    )
  }, [dispatch, regenerateMutation, showToast, state.session])

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

  if (!state.session) {
    return null
  }

  const draftTotal = state.session.cards.length
  const hasDraftCards = draftTotal > 0
  const busy = regenerateMutation.isPending

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
      <span className="text-[13px] tabular-nums text-slate-600 dark:text-slate-400">
        Draft: <span className="font-semibold text-accent">{draftTotal}</span>
      </span>
      <div ref={wrapRef} className="relative shrink-0">
        <button
          type="button"
          aria-label="Draft session menu"
          aria-expanded={open}
          aria-haspopup="menu"
          disabled={busy}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-0.5 text-[13px] text-accent hover:underline disabled:opacity-50"
        >
          Menu
          <span className="text-[10px]" aria-hidden>
            ▾
          </span>
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1.5 min-w-[12.5rem] overflow-hidden rounded-lg border border-slate-200/90 bg-white py-1 shadow-lg ring-1 ring-slate-900/[0.06] dark:border-slate-700 dark:bg-slate-900 dark:ring-white/[0.06]"
          >
            <button
              type="button"
              role="menuitem"
              disabled={!hasDraftCards || busy}
              className="flex w-full px-3 py-2 text-left text-[13px] text-slate-700 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:enabled:hover:bg-slate-800/80"
              onClick={runRegenerateAll}
            >
              Regenerate all cards
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!hasDraftCards || !activeDeckId}
              className="flex w-full px-3 py-2 text-left text-[13px] text-slate-700 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:enabled:hover:bg-slate-800/80"
              onClick={() => {
                setOpen(false)
                void commitToActiveDeck(state.session!.cards.map((c) => c.id))
              }}
            >
              Save all to {activeDeckName}
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!hasDraftCards}
              className="flex w-full px-3 py-2 text-left text-[13px] text-slate-700 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:enabled:hover:bg-slate-800/80"
              onClick={() => {
                setOpen(false)
                openCommitModal(state.session!.cards.map((c) => c.id))
              }}
            >
              Save all to another deck…
            </button>
            <div className="mx-2 my-0.5 h-px bg-slate-100 dark:bg-slate-800" />
            <button
              type="button"
              role="menuitem"
              className="flex w-full px-3 py-2 text-left text-[13px] text-red-600 transition hover:bg-red-50/90 dark:text-red-400 dark:hover:bg-red-950/35"
              onClick={() => {
                setOpen(false)
                if (
                  window.confirm(
                    'Discard this entire draft? All cards in the workspace will be removed.',
                  )
                ) {
                  dispatch({ type: 'CLEAR_SESSION' })
                }
              }}
            >
              Delete all cards
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
