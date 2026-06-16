import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type {
  CustomFieldConfig,
  DefinitionFieldConfig,
  ExamplesFieldConfig,
  TemplateFieldDef,
} from '@/types/deckProfile'
import {
  getCustomConfig,
  getDefinitionConfig,
  getExamplesConfig,
  resolveFieldKind,
} from '@/domain/expandTemplateFields'

type FieldConfigSheetProps = {
  field: TemplateFieldDef
  onChange: (config: TemplateFieldDef['config']) => void
  onClose: () => void
}

const panelClass =
  'w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-surface-900'
const selectClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[14px] outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-800/60'
const inputClass = selectClass
const labelClass = 'mb-1.5 block text-[13px] font-medium text-slate-600 dark:text-slate-400'

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

function clampCount(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

function LimitedCountInput({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (count: number) => void
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={1}
      value={value}
      onChange={(e) => {
        const parsed = Number.parseInt(e.target.value, 10)
        if (e.target.value === '') return
        onChange(clampCount(parsed, min, max))
      }}
      onBlur={(e) => {
        const parsed = Number.parseInt(e.target.value, 10)
        onChange(clampCount(parsed, min, max))
      }}
      className={inputClass}
      aria-label={`Count (${min}–${max})`}
    />
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
      <label className="block">
        <span className={labelClass}>Count</span>
        <LimitedCountInput
          value={config.count}
          min={1}
          max={5}
          onChange={(count) =>
            onChange({ ...config, count: count as ExamplesFieldConfig['count'] })
          }
        />
      </label>
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

function ModeSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className={selectClass}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
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

  const patchCustom = (patch: Partial<CustomFieldConfig>) => {
    const cfg = getCustomConfig(field)
    onChange({ ...cfg, ...patch })
  }

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

        {kind === 'definition' ? (
          <RepeatableConfigForm
            config={getDefinitionConfig(field)}
            onChange={(c) => onChange(c satisfies DefinitionFieldConfig)}
          />
        ) : null}

        {kind === 'custom' ? (
          <div className="space-y-4">
            <label className="block">
              <span className={labelClass}>Field Name</span>
              <input
                type="text"
                value={getCustomConfig(field).name}
                onChange={(e) => patchCustom({ name: e.target.value })}
                className={inputClass}
              />
            </label>
            <ModeSelect
              label="Field Type"
              value={getCustomConfig(field).fieldType}
              options={[
                { value: 'text', label: 'Text' },
                { value: 'editableText', label: 'Editable Text' },
                { value: 'image', label: 'Image' },
                { value: 'audio', label: 'Audio' },
                { value: 'video', label: 'Video' },
              ]}
              onChange={(fieldType) => patchCustom({ fieldType })}
            />
            {getCustomConfig(field).fieldType === 'audio' ? (
              <ModeSelect
                label="Audio"
                value={getCustomConfig(field).audioSource ?? 'upload'}
                options={[
                  { value: 'upload', label: 'Upload File' },
                  { value: 'record', label: 'Record Audio' },
                ]}
                onChange={(audioSource) => patchCustom({ audioSource })}
              />
            ) : null}
            {getCustomConfig(field).fieldType === 'video' ? (
              <ModeSelect
                label="Video"
                value={getCustomConfig(field).videoSource ?? 'upload'}
                options={[
                  { value: 'upload', label: 'Upload File' },
                  { value: 'record', label: 'Record Video' },
                ]}
                onChange={(videoSource) => patchCustom({ videoSource })}
              />
            ) : null}
            <label className="block">
              <span className={labelClass}>Count</span>
              <LimitedCountInput
                value={getCustomConfig(field).count}
                min={1}
                max={10}
                onChange={(count) => patchCustom({ count })}
              />
            </label>
          </div>
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
