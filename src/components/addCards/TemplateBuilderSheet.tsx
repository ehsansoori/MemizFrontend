import { useEffect, useMemo, useRef, useState } from 'react'
import { BottomSheet } from '@/components/decks/BottomSheet'
import { FieldConfigSheet } from '@/components/addCards/FieldConfigSheet'
import { TemplateLayoutEditor } from '@/components/addCards/TemplateLayoutEditor'
import {
  cloneTemplateFields,
  snapshotTemplateBuilder,
  templateBuilderSnapshotsEqual,
  type TemplateBuilderSnapshot,
} from '@/domain/templateBuilderSnapshot'
import {
  BUILDER_PRESETS,
  createDefaultBuilderFields,
  appendFieldToSide,
  availablePresetsForSide,
  canAddPresetToSide,
  createPresetField,
  type BuilderPresetId,
} from '@/domain/templateBuilderPresets'
import { validateTemplateFields } from '@/domain/templateValidation'
import type { TemplateFieldDef, TemplateFieldSide, CardTemplate } from '@/types/deckProfile'
import { useToast } from '@/providers/toastContext'

type TemplateBuilderSheetProps = {
  open: boolean
  busy?: boolean
  mode?: 'create' | 'edit'
  initialTemplate?: CardTemplate | null
  lockTemplateName?: boolean
  showResetToDefault?: boolean
  onClose: () => void
  onSave: (name: string, fields: TemplateFieldDef[], templateId?: string) => void
  onResetToDefault?: () => void
}

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[14px] outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-800/60'

const outlineButtonClass =
  'h-12 flex-1 rounded-2xl border border-slate-200 text-[15px] font-semibold text-slate-700 transition active:scale-[0.98] disabled:opacity-40 dark:border-slate-700 dark:text-slate-200'

const primaryButtonClass =
  'h-12 flex-1 rounded-2xl bg-accent text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40'

function createInitialSnapshot(
  mode: 'create' | 'edit',
  initialTemplate?: CardTemplate | null,
): TemplateBuilderSnapshot {
  if (mode === 'edit' && initialTemplate) {
    return snapshotTemplateBuilder(initialTemplate.name, initialTemplate.fields)
  }
  return snapshotTemplateBuilder('', createDefaultBuilderFields())
}

export function TemplateBuilderSheet({
  open,
  busy,
  mode = 'create',
  initialTemplate,
  lockTemplateName = false,
  showResetToDefault = false,
  onClose,
  onSave,
  onResetToDefault,
}: TemplateBuilderSheetProps) {
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [fields, setFields] = useState<TemplateFieldDef[]>(createDefaultBuilderFields)
  const [savedSnapshot, setSavedSnapshot] = useState<TemplateBuilderSnapshot>(() =>
    createInitialSnapshot(mode, initialTemplate),
  )
  const [configFieldId, setConfigFieldId] = useState<string | null>(null)
  const [addPreset, setAddPreset] = useState<BuilderPresetId>('input')
  const [activeSide, setActiveSide] = useState<TemplateFieldSide>('front')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [dismissLock, setDismissLock] = useState(false)
  const dismissLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      const snapshot = createInitialSnapshot(mode, initialTemplate)
      setSavedSnapshot(snapshot)
      setName(snapshot.name)
      setFields(cloneTemplateFields(snapshot.fields))
      setActiveSide('front')
      setConfigFieldId(null)
      setAddPreset('input')
      setValidationErrors([])
    } else {
      setConfigFieldId(null)
    }
  }, [open, mode, initialTemplate])

  useEffect(() => {
    if (!canAddPresetToSide(fields, activeSide, addPreset)) {
      const next = availablePresetsForSide(fields, activeSide)[0]
      if (next) setAddPreset(next)
    }
  }, [fields, activeSide, addPreset])

  useEffect(() => {
    return () => {
      if (dismissLockTimer.current) clearTimeout(dismissLockTimer.current)
    }
  }, [])

  const effectiveName =
    lockTemplateName && initialTemplate ? initialTemplate.name.trim() : name.trim()

  const isDirty = useMemo(() => {
    if (!open) return false
    const current = snapshotTemplateBuilder(effectiveName, fields)
    return !templateBuilderSnapshotsEqual(current, savedSnapshot)
  }, [open, effectiveName, fields, savedSnapshot])

  const configField = configFieldId ? fields.find((f) => f.id === configFieldId) ?? null : null

  const closeConfig = () => {
    setConfigFieldId(null)
    setDismissLock(true)
    if (dismissLockTimer.current) clearTimeout(dismissLockTimer.current)
    dismissLockTimer.current = setTimeout(() => setDismissLock(false), 350)
  }

  const addField = () => {
    if (!canAddPresetToSide(fields, activeSide, addPreset)) return
    const field = createPresetField(addPreset, activeSide)
    if (!field) return
    setFields((list) => appendFieldToSide(list, field, activeSide))
    if (addPreset === 'examples' || addPreset === 'pronunciations') {
      setConfigFieldId(field.id)
    }
  }

  const canAddCurrentPreset = canAddPresetToSide(fields, activeSide, addPreset)
  const nestedPanelOpen = configFieldId !== null
  const title = mode === 'edit' ? 'Edit Template' : 'Create Template'

  const canSave =
    isDirty &&
    fields.length > 0 &&
    effectiveName.length > 0 &&
    !busy &&
    !nestedPanelOpen

  const discardChanges = () => {
    setName(savedSnapshot.name)
    setFields(cloneTemplateFields(savedSnapshot.fields))
    setValidationErrors([])
    setConfigFieldId(null)
    setActiveSide('front')
  }

  const submit = () => {
    if (!isDirty) return

    const trimmed = effectiveName
    const validation = validateTemplateFields(fields)
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      showToast(validation.errors[0] ?? 'Fix template errors before saving.', 'error')
      return
    }
    if (!trimmed) return

    setValidationErrors([])
    onSave(trimmed, fields, mode === 'edit' ? initialTemplate?.id : undefined)
    setSavedSnapshot(snapshotTemplateBuilder(trimmed, fields))
  }

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
            value={lockTemplateName && initialTemplate ? initialTemplate.name : name}
            onChange={(e) => setName(e.target.value)}
            readOnly={lockTemplateName}
            placeholder="Template name"
            className={[inputClass, lockTemplateName ? 'opacity-70' : ''].join(' ')}
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
                {BUILDER_PRESETS.map((p) => {
                  const used = !canAddPresetToSide(fields, activeSide, p.id)
                  return (
                    <option key={p.id} value={p.id} disabled={used}>
                      {p.label}
                      {used ? ' (already used)' : ''}
                    </option>
                  )
                })}
              </select>
              <button
                type="button"
                onClick={addField}
                disabled={nestedPanelOpen || !canAddCurrentPreset}
                className="h-11 shrink-0 rounded-xl bg-accent px-4 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                + Add
              </button>
            </div>
          </div>

          {validationErrors.length > 0 ? (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900/40 dark:bg-red-950/20"
              role="alert"
            >
              {validationErrors.map((error) => (
                <p key={error} className="text-[13px] leading-relaxed text-red-700 dark:text-red-300">
                  {error}
                </p>
              ))}
            </div>
          ) : null}

          {showResetToDefault && onResetToDefault ? (
            <button
              type="button"
              disabled={busy || nestedPanelOpen}
              onClick={() => {
                if (
                  !window.confirm(
                    'Reset this template to the original built-in layout? Your custom changes will be lost.',
                  )
                ) {
                  return
                }
                onResetToDefault()
              }}
              className="h-11 w-full rounded-2xl border border-slate-200 text-[14px] font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Reset to Default
            </button>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={!isDirty || busy || nestedPanelOpen}
              onClick={discardChanges}
              className={outlineButtonClass}
            >
              Discard Changes
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={submit}
              className={primaryButtonClass}
            >
              Save Template
            </button>
          </div>
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
