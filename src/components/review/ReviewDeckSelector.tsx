import { useEffect, useMemo, useRef, useState } from 'react'
import { findInboxDeck, sortDecksWithInboxFirst } from '@/domain/inboxDeck'
import { useLibraryStore } from '@/store/library/libraryStore'

/** Deck picker shown as the main title on the Review page. */
export function ReviewDeckSelector({ variant = 'default' }: { variant?: 'default' | 'study' }) {
  const decks = useLibraryStore((s) => s.decks)
  const activeDeckId = useLibraryStore((s) => s.activeDeckId)
  const setActiveDeckId = useLibraryStore((s) => s.setActiveDeckId)
  const hydrated = useLibraryStore((s) => s.hydrated)

  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const sortedDecks = useMemo(() => sortDecksWithInboxFirst(decks), [decks])
  const activeDeck = useMemo(
    () => decks.find((d) => d.id === activeDeckId) ?? findInboxDeck(decks),
    [decks, activeDeckId],
  )

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

  const label = activeDeck?.name ?? 'Inbox'
  const disabled = !hydrated || sortedDecks.length === 0

  const isStudy = variant === 'study'

  return (
    <div ref={wrapRef} className={isStudy ? 'relative min-w-0' : 'relative mb-3'}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          isStudy
            ? 'inline-flex max-w-[10rem] items-center gap-1 truncate text-left text-[15px] font-semibold text-slate-900 dark:text-white disabled:opacity-50'
            : 'inline-flex max-w-full items-center gap-1 text-left text-[15px] font-semibold text-accent hover:underline disabled:opacity-50'
        }
        onClick={() => setOpen((o) => !o)}
      >
        <span className="truncate">{label}</span>
        <span className="text-[11px] font-normal text-slate-400" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Deck"
          className={[
            'absolute z-50 mt-1 max-h-56 min-w-[10rem] overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900',
            isStudy ? 'left-0' : 'left-0',
          ].join(' ')}
        >
          {sortedDecks.map((d) => {
            const selected = d.id === activeDeckId
            return (
              <li key={d.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={[
                    'block w-full px-4 py-2.5 text-left text-[14px] transition hover:bg-slate-100 dark:hover:bg-slate-800',
                    selected
                      ? 'font-semibold text-accent'
                      : 'text-slate-800 dark:text-slate-200',
                  ].join(' ')}
                  onClick={() => {
                    void setActiveDeckId(d.id)
                    setOpen(false)
                  }}
                >
                  {d.name}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
