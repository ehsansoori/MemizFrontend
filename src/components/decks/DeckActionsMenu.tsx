import { useEffect, useRef, useState } from 'react'

export type DeckActionsMenuProps = {
  onRename: () => void
  onDelete: () => void
  onReview?: () => void
  deleteDisabled?: boolean
  busy?: boolean
}

export function DeckActionsMenu({
  onRename,
  onDelete,
  onReview,
  deleteDisabled,
  busy,
}: DeckActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
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

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        disabled={busy}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-0.5 text-[13px] text-accent hover:underline disabled:opacity-50"
        onClick={() => setOpen((o) => !o)}
      >
        Actions
        <span className="text-[10px]" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-0.5 min-w-[7.5rem] border border-slate-200 bg-white py-0.5 shadow-sm dark:border-slate-600 dark:bg-slate-900"
        >
          {onReview ? (
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-1.5 text-left text-[13px] text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => {
                setOpen(false)
                onReview()
              }}
            >
              Review
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-1.5 text-left text-[13px] text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => {
              setOpen(false)
              onRename()
            }}
          >
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={deleteDisabled}
            className="block w-full px-3 py-1.5 text-left text-[13px] text-red-700 hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/40"
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  )
}
