import { useMemo } from 'react'
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AudioControls } from '@/components/addCards/AudioControls'
import { ImageControls } from '@/components/addCards/ImageControls'
import {
  createManualField,
  manualFieldLabel,
  type ManualField,
  type ManualFieldType,
} from '@/components/addCards/types'

type ManualFieldsListProps = {
  fields: ManualField[]
  onChange: (fields: ManualField[]) => void
  onAddField: () => void
  disabled?: boolean
}

function SortableManualFieldRow({
  field,
  onUpdate,
  onRemove,
  disabled,
}: {
  field: ManualField
  onUpdate: (patch: Partial<ManualField>) => void
  onRemove: () => void
  disabled?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const label = manualFieldLabel(field)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-surface-900',
        isDragging ? 'z-10 shadow-lg ring-2 ring-accent/30' : '',
      ].join(' ')}
    >
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-xl text-slate-400 active:cursor-grabbing"
          aria-label={`Reorder ${label}`}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="9" cy="7" r="1.4" />
            <circle cx="15" cy="7" r="1.4" />
            <circle cx="9" cy="12" r="1.4" />
            <circle cx="15" cy="12" r="1.4" />
            <circle cx="9" cy="17" r="1.4" />
            <circle cx="15" cy="17" r="1.4" />
          </svg>
        </button>
        <p className="min-w-0 flex-1 text-[14px] font-semibold text-slate-800 dark:text-slate-100">
          {label}
        </p>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${label}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition active:bg-red-50 active:text-red-500 disabled:opacity-40 dark:active:bg-red-950/40"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {field.type === 'custom' ? (
        <input
          type="text"
          value={field.customLabel ?? ''}
          onChange={(e) => onUpdate({ customLabel: e.target.value })}
          placeholder="Field label"
          disabled={disabled}
          className="mb-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[14px] outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-800/60"
        />
      ) : null}

      {field.type === 'image' ? (
        <ImageControls
          previewUrl={field.imagePreviewUrl}
          onPreviewChange={(url, fileName) =>
            onUpdate({
              imagePreviewUrl: url,
              value: fileName ?? '',
            })
          }
        />
      ) : field.type === 'audio' ? (
        <AudioControls label="Audio clip" />
      ) : (
        <textarea
          value={field.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder={`Enter ${label.toLowerCase()}`}
          rows={field.type === 'notes' ? 3 : 2}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-800/60"
        />
      )}

      {field.type === 'example' ? (
        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <AudioControls label="Example audio" compact />
        </div>
      ) : null}
    </div>
  )
}

export function ManualFieldsList({ fields, onChange, onAddField, disabled }: ManualFieldsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const ids = useMemo(() => fields.map((f) => f.id), [fields])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = fields.findIndex((f) => f.id === active.id)
    const newIndex = fields.findIndex((f) => f.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onChange(arrayMove(fields, oldIndex, newIndex))
  }

  const updateField = (id: string, patch: Partial<ManualField>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Extra fields
        </h3>
        <button
          type="button"
          onClick={onAddField}
          disabled={disabled}
          className="min-h-[40px] rounded-full bg-accent-muted px-4 text-[13px] font-semibold text-accent transition active:scale-95 disabled:opacity-40"
        >
          Add Field
        </button>
      </div>

      {fields.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {fields.map((field) => (
                <SortableManualFieldRow
                  key={field.id}
                  field={field}
                  disabled={disabled}
                  onUpdate={(patch) => updateField(field.id, patch)}
                  onRemove={() => removeField(field.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-[13px] text-slate-400 dark:border-slate-600">
          Add pronunciation, examples, images, and more.
        </p>
      )}
    </div>
  )
}

export function addFieldOfType(fields: ManualField[], type: ManualFieldType): ManualField[] {
  return [...fields, createManualField(type)]
}
