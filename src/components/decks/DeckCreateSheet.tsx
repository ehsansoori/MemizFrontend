import { useEffect, useMemo, useRef, useState } from 'react'
import { BottomSheet } from '@/components/decks/BottomSheet'
import { BASIC_TEMPLATE_ID } from '@/domain/cardTemplates'
import { createDefaultDeckSettings } from '@/domain/deckSettings'
import { DECK_TYPES } from '@/domain/deckTypes'
import { listAllTemplates } from '@/domain/resolveDeckTemplate'
import type { CreateDeckParams, DeckTypeId } from '@/types/deckProfile'

export type DeckCreateSheetProps = {
  open: boolean
  busy?: boolean
  initialTemplateId?: string
  onClose: () => void
  onSubmit: (params: CreateDeckParams) => void
  onCreateTemplate: () => void
}

const CREATE_TEMPLATE_VALUE = '__create_template__'

const selectClass =
  'h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100'

export function DeckCreateSheet({
  open,
  busy,
  initialTemplateId,
  onClose,
  onSubmit,
  onCreateTemplate,
}: DeckCreateSheetProps) {
  const [name, setName] = useState('')
  const [deckTypeId, setDeckTypeId] = useState<DeckTypeId>('custom')
  const [defaultTemplateId, setDefaultTemplateId] = useState(BASIC_TEMPLATE_ID)
  const inputRef = useRef<HTMLInputElement>(null)

  const templates = useMemo(() => listAllTemplates(), [open])

  useEffect(() => {
    if (open) {
      setName('')
      setDeckTypeId('custom')
      setDefaultTemplateId(initialTemplateId ?? BASIC_TEMPLATE_ID)
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open, initialTemplateId])

  const trimmed = name.trim()
  const canSubmit = !busy && trimmed.length > 0

  const submit = () => {
    if (!canSubmit) return
    onSubmit({
      name: trimmed,
      deckTypeId,
      defaultTemplateId,
      settings: createDefaultDeckSettings(deckTypeId),
    })
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      busy={busy}
      title="Create deck"
      heading={
        <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Create deck</h2>
      }
    >
      <div className="space-y-4 px-5 pb-5">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-slate-500">Deck Name</span>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. English Vocabulary"
            className={selectClass}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-slate-500">Deck Type</span>
          <select
            value={deckTypeId}
            onChange={(e) => setDeckTypeId(e.target.value as DeckTypeId)}
            className={selectClass}
          >
            {DECK_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[12px] text-slate-400">
            {DECK_TYPES.find((t) => t.id === deckTypeId)?.description}
          </p>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-slate-500">Default Template</span>
          <select
            value={defaultTemplateId}
            onChange={(e) => {
              const value = e.target.value
              if (value === CREATE_TEMPLATE_VALUE) {
                onCreateTemplate()
                return
              }
              setDefaultTemplateId(value)
            }}
            className={selectClass}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
            <option value={CREATE_TEMPLATE_VALUE}>+ Create Template</option>
          </select>
          <p className="mt-1 text-[12px] text-slate-400">
            Used for new cards only. Existing cards keep their own template.
          </p>
        </label>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl bg-slate-100 text-[15px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="h-12 flex-1 rounded-2xl bg-accent text-[15px] font-semibold text-white disabled:opacity-40"
          >
            Create
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
