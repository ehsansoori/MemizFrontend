import { useEffect, useRef, useState } from 'react'
import { BottomSheet } from '@/components/decks/BottomSheet'
import { FieldConfigSheet } from '@/components/addCards/FieldConfigSheet'
import { TemplateLayoutEditor } from '@/components/addCards/TemplateLayoutEditor'
import {
  BUILDER_PRESETS,
  createDefaultBuilderFields,
  appendFieldToSide,
  createPresetField,
  type BuilderPresetId,
} from '@/domain/templateBuilderPresets'
import type { TemplateFieldDef, TemplateFieldSide, CardTemplate } from '@/types/deckProfile'

type TemplateBuilderSheetProps = {
  open: boolean
  busy?: boolean
  mode?: 'create' | 'edit'
  initialTemplate?: CardTemplate | null
  onClose: () => void
  onSave: (name: string, fields: TemplateFieldDef[], templateId?: string) => void
}

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[14px] outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-800/60'

export function TemplateBuilderSheet({
  open,
  busy,
  mode = 'create',
  initialTemplate,
  onClose,
  onSave,
}: TemplateBuilderSheetProps) {
  const [name, setName] = useState('')
  const [fields, setFields] = useState<TemplateFieldDef[]>(createDefaultBuilderFields)
  const [configFieldId, setConfigFieldId] = useState<string | null>(null)
  const [addPreset, setAddPreset] = useState<BuilderPresetId>('word')
  const [activeSide, setActiveSide] = useState<TemplateFieldSide>('front')
  const [dismissLock, setDismissLock] = useState(false)
  const dismissLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialTemplate) {
        setName(initialTemplate.name)
        setFields(initialTemplate.fields.map((f) => ({ ...f })))
      } else {
        setName('')
        setFields(createDefaultBuilderFields())
      }
      setActiveSide('front')
      setConfigFieldId(null)
      setAddPreset('word')
    } else {
      setConfigFieldId(null)
    }
  }, [open, mode, initialTemplate])

  useEffect(() => {
    return () => {
      if (dismissLockTimer.current) clearTimeout(dismissLockTimer.current)
    }
  }, [])

  const configField = configFieldId ? fields.find((f) => f.id === configFieldId) ?? null : null

  const closeConfig = () => {
    setConfigFieldId(null)
    setDismissLock(true)
    if (dismissLockTimer.current) clearTimeout(dismissLockTimer.current)
    dismissLockTimer.current = setTimeout(() => setDismissLock(false), 350)
  }

  const addField = () => {
    const field = createPresetField(addPreset, activeSide)
    if (!field) return
    setFields((list) => appendFieldToSide(list, field, activeSide))
    if (addPreset === 'custom' || addPreset === 'definition' || addPreset === 'examples') {
      setConfigFieldId(field.id)
    }
  }

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed || fields.length === 0) return
    onSave(trimmed, fields, mode === 'edit' ? initialTemplate?.id : undefined)
    setName('')
    setFields(createDefaultBuilderFields())
    setConfigFieldId(null)
    setActiveSide('front')
  }

  const nestedPanelOpen = configFieldId !== null
  const title = mode === 'edit' ? 'Edit Template' : 'Create Template'

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        busy={busy}
        disableDismiss={nestedPanelOpen || dismissLock}
        title={title.toLowerCase()}
        heading={
          <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">{title}</h2>
        }
      >
        <div className="max-h-[80dvh] space-y-4 overflow-y-auto px-5 pb-5 scrollbar-minimal">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
            className={inputClass}
          />

          <TemplateLayoutEditor
            fields={fields}
            activeSide={activeSide}
            onActiveSideChange={setActiveSide}
            onChange={setFields}
            onConfigure={setConfigFieldId}
            disabled={busy || nestedPanelOpen}
          />

          <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                Add Field
              </p>
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                Adding to{' '}
                <span className="font-semibold text-accent">
                  {activeSide === 'front' ? 'Front' : 'Back'}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={addPreset}
                onChange={(e) => setAddPreset(e.target.value as BuilderPresetId)}
                disabled={nestedPanelOpen}
                className={`${inputClass} min-w-0 flex-1 disabled:opacity-50`}
              >
                {BUILDER_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addField}
                disabled={nestedPanelOpen}
                className="h-11 shrink-0 rounded-xl bg-accent px-4 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                + Add
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={busy || !name.trim() || fields.length === 0}
            onClick={submit}
            className="h-12 w-full rounded-2xl bg-accent text-[15px] font-semibold text-white disabled:opacity-40"
          >
            Save Template
          </button>
        </div>
      </BottomSheet>

      {configField ? (
        <FieldConfigSheet
          field={configField}
          onChange={(config) => {
            setFields((list) =>
              list.map((f) => {
                if (f.id !== configFieldId) return f
                const next = { ...f, config }
                if (config && 'name' in config && typeof config.name === 'string') {
                  next.label = config.name
                }
                return next
              }),
            )
          }}
          onClose={closeConfig}
        />
      ) : null}
    </>
  )
}
