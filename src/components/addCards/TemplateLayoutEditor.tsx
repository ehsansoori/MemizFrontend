import { useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
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
  canMoveFieldToSide,
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

const actionBtnClass =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40'

function MoveSideIcon({ toBack }: { toBack: boolean }) {
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
      {toBack ? (
        <>
          <path d="M5 12h12" />
          <path d="m13 6 6 6-6 6" />
        </>
      ) : (
        <>
          <path d="M19 12H7" />
          <path d="m11 18-6-6 6-6" />
        </>
      )}
    </svg>
  )
}

function SortableFieldRow({
  field,
  onRemove,
  onConfigure,
  onMoveToOtherSide,
  canMoveToOtherSide,
  disabled,
}: {
  field: TemplateFieldDef
  onRemove: () => void
  onConfigure: () => void
  onMoveToOtherSide: () => void
  canMoveToOtherSide: boolean
  disabled?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  })
  const summary = formatFieldConfigSummary(field)
  const configurable = isConfigurableField(field)
  const otherSideLabel = field.side === 'front' ? 'Back' : 'Front'
  const moveToBack = field.side === 'front'

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={[
        'flex min-w-0 items-center gap-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 pl-2 pr-1.5 dark:border-slate-700 dark:bg-slate-900/80 sm:gap-2 sm:pl-2.5 sm:pr-2',
        isDragging ? 'z-10 shadow-lg ring-2 ring-accent/25' : '',
      ].join(' ')}
    >
      <button
        type="button"
        disabled={disabled}
        className="flex h-9 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-slate-400 active:cursor-grabbing"
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

      <div className="min-w-0 flex-1 overflow-hidden py-0.5">
        <p className="truncate text-[14px] font-semibold leading-tight text-slate-800 dark:text-slate-100">
          {field.label}
        </p>
        {summary ? (
          <p className="truncate text-[11px] leading-tight text-slate-400 dark:text-slate-500">
            {summary}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          disabled={disabled || !canMoveToOtherSide}
          onClick={onMoveToOtherSide}
          title={
            canMoveToOtherSide
              ? `Move to ${otherSideLabel}`
              : `${field.label} already exists on ${otherSideLabel}`
          }
          className={`${actionBtnClass} text-accent hover:bg-accent/10`}
          aria-label={`Move ${field.label} to ${otherSideLabel}`}
        >
          <MoveSideIcon toBack={moveToBack} />
        </button>
        {configurable ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onConfigure}
            className={`${actionBtnClass} text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800`}
            aria-label={`Configure ${field.label}`}
          >
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
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        ) : null}
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className={`${actionBtnClass} text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30`}
          aria-label={`Remove ${field.label}`}
        >
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
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function SideColumn({
  title,
  side,
  fields,
  dropId,
  isActive,
  onSelect,
  onRemove,
  onConfigure,
  onMoveToOtherSide,
  canMoveField,
  disabled,
}: {
  title: string
  side: TemplateFieldSide
  fields: TemplateFieldDef[]
  dropId: string
  isActive: boolean
  onSelect: () => void
  onRemove: (id: string) => void
  onConfigure: (id: string) => void
  onMoveToOtherSide: (id: string) => void
  canMoveField: (id: string) => boolean
  disabled?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId })
  const ids = useMemo(() => fields.map((f) => f.id), [fields])
  const emptyHint =
    side === 'front'
      ? 'Tap a field below to add it to Front'
      : 'Tap a field below to add it to Back'

  return (
    <section
      className={[
        'flex min-h-[140px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border p-3 transition',
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
          'flex min-h-[96px] min-w-0 flex-1 flex-col gap-2 overflow-hidden rounded-xl transition-colors',
          isOver ? 'bg-accent/5' : '',
        ].join(' ')}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {fields.length === 0 ? (
            <p className="flex flex-1 items-center justify-center px-3 py-6 text-center text-[12px] leading-relaxed text-slate-400 dark:text-slate-500">
              {emptyHint}
            </p>
          ) : (
            fields.map((field) => (
              <SortableFieldRow
                key={field.id}
                field={field}
                disabled={disabled}
                onRemove={() => onRemove(field.id)}
                onConfigure={() => onConfigure(field.id)}
                onMoveToOtherSide={() => onMoveToOtherSide(field.id)}
                canMoveToOtherSide={canMoveField(field.id)}
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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const frontFields = fieldsForSide(fields, 'front')
  const backFields = fieldsForSide(fields, 'back')
  const activeField = activeId ? fields.find((f) => f.id === activeId) : null

  const collisionDetection = useCallback(
    (args: Parameters<typeof pointerWithin>[0]) => {
      const pointerHits = pointerWithin(args)
      if (pointerHits.length > 0) return pointerHits
      return closestCorners(args)
    },
    [],
  )

  const moveToOtherSide = useCallback(
    (fieldId: string) => {
      const field = fields.find((f) => f.id === fieldId)
      if (!field) return
      const targetSide: TemplateFieldSide = field.side === 'front' ? 'back' : 'front'
      if (!canMoveFieldToSide(fields, fieldId, targetSide)) return
      onChange(moveFieldToSide(fields, fieldId, targetSide))
      onActiveSideChange(targetSide)
    },
    [fields, onActiveSideChange, onChange],
  )

  const canMoveField = useCallback(
    (fieldId: string) => {
      const field = fields.find((f) => f.id === fieldId)
      if (!field) return false
      const targetSide: TemplateFieldSide = field.side === 'front' ? 'back' : 'front'
      return canMoveFieldToSide(fields, fieldId, targetSide)
    },
    [fields],
  )

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

    if (!canMoveFieldToSide(fields, activeFieldId, targetSide)) return

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
      collisionDetection={collisionDetection}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <SideColumn
          title="Front Side"
          side="front"
          fields={frontFields}
          dropId={FRONT_DROP_ID}
          isActive={activeSide === 'front'}
          onSelect={() => onActiveSideChange('front')}
          disabled={disabled}
          onRemove={removeField}
          onConfigure={onConfigure}
          onMoveToOtherSide={moveToOtherSide}
          canMoveField={canMoveField}
        />
        <SideColumn
          title="Back Side"
          side="back"
          fields={backFields}
          dropId={BACK_DROP_ID}
          isActive={activeSide === 'back'}
          onSelect={() => onActiveSideChange('back')}
          disabled={disabled}
          onRemove={removeField}
          onConfigure={onConfigure}
          onMoveToOtherSide={moveToOtherSide}
          canMoveField={canMoveField}
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
