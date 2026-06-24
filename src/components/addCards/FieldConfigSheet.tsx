import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SelectField } from '@/components/ui/SelectField'
import { EXAMPLE_COUNT_OPTIONS } from '@/constants/formOptions'
import type { ExamplesFieldConfig, PronunciationsFieldConfig, TemplateFieldDef } from '@/types/deckProfile'
import {
  getExamplesConfig,
  getPronunciationsConfig,
  resolveFieldKind,
} from '@/domain/expandTemplateFields'
import { normalizePronunciationSource } from '@/domain/pronunciations'

type FieldConfigSheetProps = {
  field: TemplateFieldDef
  onChange: (config: TemplateFieldDef['config']) => void
  onClose: () => void
}

const panelClass =
  'w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-surface-900'
const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[14px] outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-800/60'
const labelClass = 'mb-1.5 block text-[13px] font-medium text-slate-600 dark:text-slate-400'

const EXAMPLE_COUNT_SELECT_OPTIONS = EXAMPLE_COUNT_OPTIONS.map((n) => ({
  value: String(n),
  label: String(n),
}))

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className={labelClass}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative h-7 w-12 shrink-0 rounded-full transition',
          checked ? 'bg-accent' : 'bg-slate-200 dark:bg-slate-700',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition',
            checked ? 'left-[22px]' : 'left-0.5',
          ].join(' ')}
        />
      </button>
    </label>
  )
}

function RepeatableConfigForm({
  config,
  onChange,
}: {
  config: ExamplesFieldConfig
  onChange: (c: ExamplesFieldConfig) => void
}) {
  return (
    <div className="space-y-4">
      <SelectField
        id="examples-field-count"
        label="Count"
        options={EXAMPLE_COUNT_SELECT_OPTIONS}
        value={String(config.count)}
        onChange={(e) => {
          const count = Number.parseInt(e.target.value, 10) as ExamplesFieldConfig['count']
          onChange({ ...config, count })
        }}
      />
      <ToggleRow
        label="Include Translation"
        checked={config.includeTranslation}
        onChange={(includeTranslation) => onChange({ ...config, includeTranslation })}
      />
      {config.includeTranslation ? (
        <p className="text-[12px] text-slate-400">
          Translations use the deck&apos;s target language automatically.
        </p>
      ) : null}
    </div>
  )
}

function PronunciationsSourcesForm({
  config,
  onChange,
}: {
  config: PronunciationsFieldConfig
  onChange: (c: PronunciationsFieldConfig) => void
}) {
  const [draft, setDraft] = useState('')

  const addSource = () => {
    const next = normalizePronunciationSource(draft)
    if (!next) return
    if (config.sources.includes(next)) {
      setDraft('')
      return
    }
    onChange({ sources: [...config.sources, next] })
    setDraft('')
  }

  const removeSource = (source: string) => {
    onChange({ sources: config.sources.filter((s) => s !== source) })
  }

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-slate-500">
        Choose which pronunciation sources to request during generation (e.g. us, br).
      </p>
      <div className="flex flex-wrap gap-2">
        {config.sources.map((source) => (
          <span
            key={source}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-[13px] font-semibold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {source}
            <button
              type="button"
              onClick={() => removeSource(source)}
              className="ml-0.5 text-slate-400 hover:text-red-500"
              aria-label={`Remove ${source}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. us"
          className={inputClass}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addSource()
            }
          }}
        />
        <button
          type="button"
          onClick={addSource}
          disabled={!draft.trim()}
          className="h-11 shrink-0 rounded-xl bg-accent px-4 text-[13px] font-semibold text-white disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  )
}

export function FieldConfigSheet({ field, onChange, onClose }: FieldConfigSheetProps) {
  const kind = resolveFieldKind(field)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const closeFromBackdrop = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50"
        aria-label="Close configuration"
        onClick={closeFromBackdrop}
      />
      <div
        className={`${panelClass} relative z-10`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="field-config-title"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 id="field-config-title" className="text-[16px] font-bold text-slate-900 dark:text-white">
            Configure {field.label}
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {kind === 'examples' ? (
          <RepeatableConfigForm
            config={getExamplesConfig(field)}
            onChange={(c) => onChange(c)}
          />
        ) : null}

        {kind === 'pronunciations' ? (
          <PronunciationsSourcesForm
            config={getPronunciationsConfig(field)}
            onChange={(c) => onChange(c)}
          />
        ) : null}

        {kind !== 'examples' && kind !== 'pronunciations' ? (
          <p className="text-[13px] text-slate-500">No configuration for this field.</p>
        ) : null}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="mt-5 h-11 w-full rounded-2xl bg-accent text-[14px] font-semibold text-white"
        >
          Done
        </button>
      </div>
    </div>,
    document.body,
  )
}
