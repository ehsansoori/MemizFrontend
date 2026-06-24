import { useEffect, useRef, useState } from 'react'
import { CardTemplateSelect } from '@/components/addCards/CardTemplateSelect'
import { BottomSheet } from '@/components/decks/BottomSheet'
import { SelectField } from '@/components/ui/SelectField'
import { LANGUAGE_OPTIONS } from '@/constants/formOptions'
import { createDefaultLanguageSettings } from '@/domain/deckSettings'
import { deckTypeSupportsLanguageSettings } from '@/domain/deckTypes'
import {
  defaultTemplateIdForDeckType,
  isTemplateCompatibleWithDeckType,
} from '@/domain/templateDeckTypes'
import type { CreateDeckParams, DeckTypeId } from '@/types/deckProfile'

export type DeckCreateSheetProps = {
  open: boolean
  busy?: boolean
  initialTemplateId?: string
  templatesRefreshKey?: number
  onClose: () => void
  onSubmit: (params: CreateDeckParams) => void
  onCreateTemplate: () => void
  onEditTemplate: (templateId: string) => void
  onDeleteTemplate: (templateId: string) => void
}

const selectClass =
  'h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100'

export function DeckCreateSheet({
  open,
  busy,
  initialTemplateId,
  templatesRefreshKey = 0,
  onClose,
  onSubmit,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
}: DeckCreateSheetProps) {
  const [name, setName] = useState('')
  const [deckTypeId, setDeckTypeId] = useState<DeckTypeId>('language_learning')
  const [sourceLanguage, setSourceLanguage] = useState(
    () => createDefaultLanguageSettings().sourceLanguage,
  )
  const [targetLanguage, setTargetLanguage] = useState(
    () => createDefaultLanguageSettings().targetLanguage,
  )
  const [defaultTemplateId, setDefaultTemplateId] = useState(() =>
    defaultTemplateIdForDeckType('language_learning'),
  )
  const inputRef = useRef<HTMLInputElement>(null)

  const showLanguageFields = deckTypeSupportsLanguageSettings(deckTypeId)

  useEffect(() => {
    if (open) {
      setName('')
      setDeckTypeId('language_learning')
      setSourceLanguage(createDefaultLanguageSettings().sourceLanguage)
      setTargetLanguage(createDefaultLanguageSettings().targetLanguage)
      const initialType = 'language_learning'
      setDefaultTemplateId(initialTemplateId ?? defaultTemplateIdForDeckType(initialType))
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open, initialTemplateId])

  useEffect(() => {
    if (!open) return
    setDefaultTemplateId((current) => {
      if (isTemplateCompatibleWithDeckType(current, deckTypeId)) return current
      return defaultTemplateIdForDeckType(deckTypeId)
    })
  }, [deckTypeId, open])

  const trimmed = name.trim()
  const canSubmit = !busy && trimmed.length > 0

  const submit = () => {
    if (!canSubmit) return
    onSubmit({
      name: trimmed,
      deckTypeId,
      defaultTemplateId,
      settings: showLanguageFields
        ? {
            language: {
              ...createDefaultLanguageSettings(),
              sourceLanguage,
              targetLanguage,
            },
          }
        : {},
    })
  }

  const handleDeleteTemplate = (templateId: string) => {
    onDeleteTemplate(templateId)
    setDefaultTemplateId((current) =>
      current === templateId ? defaultTemplateIdForDeckType(deckTypeId) : current,
    )
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
      <div className="max-h-[80dvh] space-y-4 overflow-y-auto px-5 pb-5 scrollbar-minimal">
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

      <p className="text-[12px] text-slate-400">Deck type: Language Learning</p>

        {showLanguageFields ? (
          <>
            <SelectField
              id="create-deck-source-lang"
              label="Source Language"
              options={LANGUAGE_OPTIONS}
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              disabled={busy}
            />
            <SelectField
              id="create-deck-target-lang"
              label="Target Language"
              options={LANGUAGE_OPTIONS.filter((o) => o.value !== 'auto')}
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              disabled={busy}
            />
          </>
        ) : null}

        <CardTemplateSelect
          label="Template"
          value={defaultTemplateId}
          onChange={setDefaultTemplateId}
          disabled={busy}
          deckTypeId={deckTypeId}
          refreshKey={templatesRefreshKey}
          onCreateTemplate={onCreateTemplate}
          onEditTemplate={onEditTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          hint="Basic Language Template is used for all language learning decks."
        />

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
