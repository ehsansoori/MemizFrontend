import { useEffect, useMemo, useRef, useState } from 'react'
import { canEditInDefaultTemplateDropdown, isCustomTemplate, isTemplateEditable } from '@/domain/cardTemplates'
import { listTemplatesForPicker } from '@/domain/resolveDeckTemplate'
import type { CardTemplate, DeckTypeId } from '@/types/deckProfile'

type CardTemplateSelectProps = {
  value: string
  onChange: (templateId: string) => void
  disabled?: boolean
  label?: string
  hint?: string
  refreshKey?: number
  deckTypeId?: DeckTypeId
  /** When true, edit/delete appear only on custom templates (Default Template dropdown). */
  customTemplateActionsOnly?: boolean
  onCreateTemplate?: () => void
  onEditTemplate?: (templateId: string) => void
  onDeleteTemplate?: (templateId: string) => void
}

const triggerClass =
  'flex h-12 w-full items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left text-[15px] text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100'

function EditIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function CardTemplateSelect({
  value,
  onChange,
  disabled,
  label = 'Template',
  hint,
  refreshKey = 0,
  deckTypeId: _deckTypeId,
  customTemplateActionsOnly = false,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
}: CardTemplateSelectProps) {
  const templates = useMemo(() => listTemplatesForPicker(), [refreshKey])
  const selected = templates.find((t) => t.id === value)
  const useMenu =
    onCreateTemplate != null || onEditTemplate != null || onDeleteTemplate != null

  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const canEdit = (template: (typeof templates)[number]) => {
    if (customTemplateActionsOnly) return canEditInDefaultTemplateDropdown(template)
    return isTemplateEditable(template)
  }

  const canDelete = (template: CardTemplate) => isCustomTemplate(template)

  if (!useMenu) {
    return (
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={triggerClass}
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {hint ? (
          <p className="mt-1 text-[12px] text-slate-400 dark:text-slate-500">{hint}</p>
        ) : null}
      </label>
    )
  }

  return (
    <div ref={rootRef} className="relative block">
      <span className="mb-1.5 block text-[13px] font-medium text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
      >
        <span className="truncate">{selected?.name ?? 'Select template'}</span>
        <svg
          className={['h-4 w-4 shrink-0 text-slate-400 transition', open ? 'rotate-180' : ''].join(
            ' ',
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={label}
          className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-surface-900"
        >
          {templates.map((t) => {
            const isSelected = t.id === value
            const showEdit = canEdit(t) && onEditTemplate
            const showDelete = canDelete(t) && onDeleteTemplate
            return (
              <div
                key={t.id}
                className={[
                  'flex items-center gap-0.5 pr-1',
                  isSelected ? 'bg-accent/5' : '',
                ].join(' ')}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(t.id)
                    setOpen(false)
                  }}
                  className="min-w-0 flex-1 truncate px-4 py-2.5 text-left text-[14px] text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800/60"
                >
                  {t.name}
                </button>
                {showEdit ? (
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`Edit ${t.name}`}
                    title={`Edit ${t.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpen(false)
                      onEditTemplate(t.id)
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-accent dark:hover:bg-slate-800"
                  >
                    <EditIcon />
                  </button>
                ) : null}
                {showDelete ? (
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`Delete ${t.name}`}
                    title={`Delete ${t.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpen(false)
                      onDeleteTemplate(t.id)
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    <DeleteIcon />
                  </button>
                ) : null}
              </div>
            )
          })}
          {onCreateTemplate ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onCreateTemplate()
              }}
              className="w-full border-t border-slate-100 px-4 py-2.5 text-left text-[14px] font-semibold text-accent dark:border-slate-800"
            >
              + Create Template
            </button>
          ) : null}
        </div>
      ) : null}

      {hint ? (
        <p className="mt-1 text-[12px] text-slate-400 dark:text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}
