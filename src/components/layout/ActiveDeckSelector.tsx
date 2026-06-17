import { useEffect, useMemo, useRef, useState } from 'react'
import { findInboxDeck, sortDecksWithInboxFirst } from '@/domain/inboxDeck'
import { useLibraryStore } from '@/store/library/libraryStore'

type ActiveDeckSelectorProps = {
  /** Full-width field style for page headers (e.g. Make Card). */
  variant?: 'default' | 'field'
  className?: string
}

const fieldTriggerClass =
  'flex h-12 w-full items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left text-[15px] font-medium text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100'

export function ActiveDeckSelector({ variant = 'default', className }: ActiveDeckSelectorProps) {
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
  const isField = variant === 'field'

  return (
    <div ref={wrapRef} className={['relative min-w-0', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={isField ? `Active deck: ${label}` : undefined}
        className={
          isField
            ? fieldTriggerClass
            : 'inline-flex max-w-[12rem] items-center gap-0.5 truncate text-[13px] text-accent hover:underline disabled:opacity-50'
        }
        onClick={() => setOpen((o) => !o)}
      >
        <span className="truncate">{label}</span>
        <span className={isField ? 'shrink-0 text-slate-400' : 'text-[10px]'} aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Active deck"
          className={[
            'absolute z-50 mt-1.5 max-h-56 overflow-y-auto border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900',
            isField ? 'left-0 right-0 rounded-2xl' : 'right-0 min-w-[10rem]',
          ].join(' ')}
        >
          {sortedDecks.map((d) => {
            const selected = d.id === activeDeckId
            return (
              <li key={d.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={[
                    'block w-full px-4 py-2.5 text-left text-[15px] transition hover:bg-slate-100 dark:hover:bg-slate-800',
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
