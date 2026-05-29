import { useEffect, useMemo, useRef, useState } from 'react'
import { findInboxDeck, sortDecksWithInboxFirst } from '@/domain/inboxDeck'
import { useLibraryStore } from '@/store/library/libraryStore'

/** Deck picker shown as the main title on the Review page. */
export function ReviewDeckSelector() {
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

  return (
    <div ref={wrapRef} className="relative mb-3">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex max-w-full items-center gap-1 text-left text-[15px] font-semibold text-accent hover:underline disabled:opacity-50"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="truncate">{label}</span>
        <span className="text-[11px] font-normal" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Deck"
          className="absolute left-0 z-50 mt-0.5 max-h-56 min-w-[10rem] overflow-y-auto border border-slate-200 bg-white py-0.5 shadow-sm dark:border-slate-600 dark:bg-slate-900"
        >
          {sortedDecks.map((d) => {
            const selected = d.id === activeDeckId
            return (
              <li key={d.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={[
                    'block w-full px-3 py-1.5 text-left text-[13px] hover:bg-slate-100 dark:hover:bg-slate-800',
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
