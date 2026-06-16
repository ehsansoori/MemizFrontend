import { useMemo, useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  formatFieldConfigSummary,
  isConfigurableField,
} from '@/domain/expandTemplateFields'
import {
  BACK_DROP_ID,
  FRONT_DROP_ID,
  fieldsForSide,
  moveFieldToSide,
  reorderFieldsOnSide,
} from '@/domain/templateBuilderPresets'
import type { TemplateFieldDef, TemplateFieldSide } from '@/types/deckProfile'

type TemplateLayoutEditorProps = {
  fields: TemplateFieldDef[]
  activeSide: TemplateFieldSide
  onActiveSideChange: (side: TemplateFieldSide) => void
  onChange: (fields: TemplateFieldDef[]) => void
  onConfigure: (fieldId: string) => void
  disabled?: boolean
}

function SortableFieldRow({
  field,
  onRemove,
  onConfigure,
  disabled,
}: {
  field: TemplateFieldDef
  onRemove: () => void
  onConfigure: () => void
  disabled?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  })
  const summary = formatFieldConfigSummary(field)
  const configurable = isConfigurableField(field)

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={[
        'flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/80',
        isDragging ? 'z-10 shadow-lg ring-2 ring-accent/25' : '',
      ].join(' ')}
    >
      <button
        type="button"
        disabled={disabled}
        className="flex h-9 w-8 shrink-0 cursor-grab items-center justify-center text-slate-400 active:cursor-grabbing"
        aria-label={`Drag ${field.label}`}
        {...attributes}
        {...listeners}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="9" cy="7" r="1.3" />
          <circle cx="15" cy="7" r="1.3" />
          <circle cx="9" cy="12" r="1.3" />
          <circle cx="15" cy="12" r="1.3" />
          <circle cx="9" cy="17" r="1.3" />
          <circle cx="15" cy="17" r="1.3" />
        </svg>
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-slate-800 dark:text-slate-100">
          {field.label}
        </p>
        {summary ? (
          <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">{summary}</p>
        ) : null}
      </div>
      {configurable ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onConfigure}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[15px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={`Configure ${field.label}`}
        >
          ⚙
        </button>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
        aria-label={`Remove ${field.label}`}
      >
        ✕
      </button>
    </div>
  )
}

function SideColumn({
  title,
  fields,
  dropId,
  isActive,
  onSelect,
  onRemove,
  onConfigure,
  disabled,
}: {
  title: string
  fields: TemplateFieldDef[]
  dropId: string
  isActive: boolean
  onSelect: () => void
  onRemove: (id: string) => void
  onConfigure: (id: string) => void
  disabled?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId })
  const ids = useMemo(() => fields.map((f) => f.id), [fields])

  return (
    <section
      className={[
        'flex min-h-[140px] flex-1 flex-col rounded-2xl border p-3 transition',
        isActive
          ? 'border-accent bg-accent/5 ring-2 ring-accent/25 dark:bg-accent/10'
          : 'border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40',
        isOver && !isActive ? 'ring-1 ring-accent/20' : '',
      ].join(' ')}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className="mb-2 flex w-full items-center justify-between gap-2 text-left"
        aria-pressed={isActive}
      >
        <span className="text-[12px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          {title}
        </span>
        {isActive ? (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">
            Active
          </span>
        ) : (
          <span className="text-[10px] font-medium text-slate-400">Tap to select</span>
        )}
      </button>
      <div
        ref={setNodeRef}
        onClick={onSelect}
        className={[
          'flex min-h-[96px] flex-1 flex-col gap-2 rounded-xl transition-colors',
          isOver ? 'bg-accent/5' : '',
        ].join(' ')}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {fields.length === 0 ? (
            <p className="flex flex-1 items-center justify-center px-2 py-6 text-center text-[12px] text-slate-400">
              {isActive ? 'New fields will be added here' : 'Drop fields here'}
            </p>
          ) : (
            fields.map((field) => (
              <SortableFieldRow
                key={field.id}
                field={field}
                disabled={disabled}
                onRemove={() => onRemove(field.id)}
                onConfigure={() => onConfigure(field.id)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </section>
  )
}

export function TemplateLayoutEditor({
  fields,
  activeSide,
  onActiveSideChange,
  onChange,
  onConfigure,
  disabled,
}: TemplateLayoutEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const frontFields = fieldsForSide(fields, 'front')
  const backFields = fieldsForSide(fields, 'back')
  const activeField = activeId ? fields.find((f) => f.id === activeId) : null

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeFieldId = String(active.id)
    const overId = String(over.id)
    const field = fields.find((f) => f.id === activeFieldId)
    if (!field) return

    const targetSide: TemplateFieldSide =
      overId === FRONT_DROP_ID || frontFields.some((f) => f.id === overId)
        ? 'front'
        : 'back'

    onActiveSideChange(targetSide)

    if (field.side === targetSide && overId !== FRONT_DROP_ID && overId !== BACK_DROP_ID) {
      onChange(reorderFieldsOnSide(fields, targetSide, activeFieldId, overId))
      return
    }

    onChange(moveFieldToSide(fields, activeFieldId, targetSide, overId))
  }

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SideColumn
          title="Front Side"
          fields={frontFields}
          dropId={FRONT_DROP_ID}
          isActive={activeSide === 'front'}
          onSelect={() => onActiveSideChange('front')}
          disabled={disabled}
          onRemove={removeField}
          onConfigure={onConfigure}
        />
        <SideColumn
          title="Back Side"
          fields={backFields}
          dropId={BACK_DROP_ID}
          isActive={activeSide === 'back'}
          onSelect={() => onActiveSideChange('back')}
          disabled={disabled}
          onRemove={removeField}
          onConfigure={onConfigure}
        />
      </div>

      <DragOverlay>
        {activeField ? (
          <div className="rounded-xl border border-accent/30 bg-white px-3 py-2 shadow-lg dark:bg-slate-900">
            <p className="text-[14px] font-semibold text-slate-800 dark:text-white">
              {activeField.label}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
