import { useEffect, useRef, useState } from 'react'
import { BottomSheet } from '@/components/decks/BottomSheet'
import type { SavedCard } from '@/types/cards'

export type DeckCardEditSheetProps = {
  open: boolean
  card: SavedCard | null
  busy?: boolean
  onClose: () => void
  onSubmit: (card: SavedCard, values: { word: string; targetMeaning: string; englishMeaning: string }) => void
}

export function DeckCardEditSheet({
  open,
  card,
  busy,
  onClose,
  onSubmit,
}: DeckCardEditSheetProps) {
  const [word, setWord] = useState('')
  const [targetMeaning, setTargetMeaning] = useState('')
  const [englishMeaning, setEnglishMeaning] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && card) {
      setWord(card.data.word)
      setTargetMeaning(card.data.targetMeaning ?? '')
      setEnglishMeaning(card.data.englishMeaning ?? '')
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open, card])

  const trimmedWord = word.trim()
  const canSubmit = !busy && trimmedWord.length > 0

  const submit = () => {
    if (!canSubmit || !card) return
    onSubmit(card, {
      word: trimmedWord,
      targetMeaning: targetMeaning.trim(),
      englishMeaning: englishMeaning.trim(),
    })
  }

  return (
    <BottomSheet
      open={open && card !== null}
      onClose={onClose}
      busy={busy}
      title="Edit card"
      heading={
        <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Edit card</h2>
      }
    >
      <div className="space-y-3 px-5 pb-5">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-slate-500 dark:text-slate-400">
            Word
          </span>
          <input
            ref={inputRef}
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/30 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800"
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-slate-500 dark:text-slate-400">
            Target meaning
          </span>
          <textarea
            value={targetMeaning}
            onChange={(e) => setTargetMeaning(e.target.value)}
            rows={2}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/30 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-slate-500 dark:text-slate-400">
            English meaning
          </span>
          <textarea
            value={englishMeaning}
            onChange={(e) => setEnglishMeaning(e.target.value)}
            rows={2}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/30 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800"
          />
        </label>
        <div className="flex gap-3 pt-1">
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
            Save
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
