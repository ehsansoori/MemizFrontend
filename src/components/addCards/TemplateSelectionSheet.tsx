import { useMemo } from 'react'
import { BottomSheet } from '@/components/decks/BottomSheet'
import { canEditInDefaultTemplateDropdown, isCustomTemplate } from '@/domain/cardTemplates'
import { listTemplatesForPicker } from '@/domain/resolveDeckTemplate'
import type { CardTemplate } from '@/types/deckProfile'

type TemplateSelectionSheetProps = {
  open: boolean
  busy?: boolean
  value: string
  refreshKey?: number
  description?: string
  onClose: () => void
  onSelect: (templateId: string) => void
  onCreateTemplate?: () => void
  onEditTemplate?: (templateId: string) => void
  onDeleteTemplate?: (templateId: string) => void
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function TemplateSelectionSheet({
  open,
  busy,
  value,
  refreshKey = 0,
  description = 'Used for this card only. Does not change the deck default.',
  onClose,
  onSelect,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
}: TemplateSelectionSheetProps) {
  const templates = useMemo(() => listTemplatesForPicker(), [refreshKey])

  const pick = (template: CardTemplate) => {
    onSelect(template.id)
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      busy={busy}
      title="Choose template"
      heading={
        <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Choose template</h2>
      }
    >
      <div className="max-h-[70dvh] space-y-1 overflow-y-auto px-5 pb-6 scrollbar-minimal">
        <p className="mb-3 text-[13px] text-slate-500 dark:text-slate-400">{description}</p>
        {templates.map((template) => {
          const selected = template.id === value
          const showEdit = onEditTemplate && canEditInDefaultTemplateDropdown(template)
          const showDelete = onDeleteTemplate && isCustomTemplate(template)

          return (
            <div
              key={template.id}
              className={[
                'flex items-center gap-1 rounded-2xl',
                selected ? 'bg-accent/8 ring-1 ring-accent/20' : '',
              ].join(' ')}
            >
              <button
                type="button"
                disabled={busy}
                aria-pressed={selected}
                onClick={() => pick(template)}
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left"
              >
                {selected ? <CheckIcon /> : <span className="w-5 shrink-0" aria-hidden />}
                <span className="min-w-0 flex-1">
                  <p
                    className={[
                      'text-[15px] font-semibold',
                      selected ? 'text-accent' : 'text-slate-900 dark:text-white',
                    ].join(' ')}
                  >
                    {template.name}
                  </p>
                  {template.description ? (
                    <p className="mt-0.5 line-clamp-2 text-[12px] text-slate-500 dark:text-slate-400">
                      {template.description}
                    </p>
                  ) : null}
                </span>
              </button>
              {showEdit ? (
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Edit ${template.name}`}
                  onClick={() => {
                    onClose()
                    onEditTemplate(template.id)
                  }}
                  className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-accent dark:hover:bg-slate-800"
                >
                  <EditIcon />
                </button>
              ) : null}
              {showDelete ? (
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Delete ${template.name}`}
                  onClick={() => {
                    onClose()
                    onDeleteTemplate(template.id)
                  }}
                  className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                >
                  ✕
                </button>
              ) : null}
            </div>
          )
        })}
        {onCreateTemplate ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              onClose()
              onCreateTemplate()
            }}
            className="mt-2 w-full border-t border-slate-100 py-3.5 text-left text-[14px] font-semibold text-accent dark:border-slate-800"
          >
            + Create Template
          </button>
        ) : null}
      </div>
    </BottomSheet>
  )
}
