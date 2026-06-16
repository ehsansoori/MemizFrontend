import { useEffect, useRef, useState } from 'react'
import { BottomSheet } from '@/components/decks/BottomSheet'

export type DeckNameSheetProps = {
  open: boolean
  mode: 'create' | 'rename'
  initialValue?: string
  busy?: boolean
  onClose: () => void
  onSubmit: (name: string) => void
}

export function DeckNameSheet({
  open,
  mode,
  initialValue = '',
  busy,
  onClose,
  onSubmit,
}: DeckNameSheetProps) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue(initialValue)
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open, initialValue])

  const isCreate = mode === 'create'
  const trimmed = value.trim()
  const canSubmit = !busy && trimmed.length > 0 && !(mode === 'rename' && trimmed === initialValue.trim())

  const submit = () => {
    if (!canSubmit) return
    onSubmit(trimmed)
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      busy={busy}
      title={isCreate ? 'Create deck' : 'Rename deck'}
      heading={
        <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">
          {isCreate ? 'Create deck' : 'Rename deck'}
        </h2>
      }
    >
      <div className="px-5 pt-2 pb-5">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Deck name"
          enterKeyHint="done"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/30 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800"
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl bg-slate-100 text-[15px] font-semibold text-slate-700 transition active:scale-[0.98] disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="h-12 flex-1 rounded-2xl bg-accent text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          >
            {isCreate ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
