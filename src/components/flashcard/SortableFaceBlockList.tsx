import { useMemo, useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
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
import type { CardFieldLayout, GeneratedCardData } from '@/types/cards'
import { InlineEditableCardField } from '@/components/flashcard/InlineEditableCardField'
import { renderCardFieldContent } from '@/components/flashcard/renderCardFieldContent'
import { fieldLabel } from '@/utils/renderCardFace'
import {
  applyLayoutDragEnd,
  DROP_BACK_TAIL_ID,
  DROP_FRONT_TAIL_ID,
  partitionLayouts,
  removeBlock,
  sortByOrder,
} from '@/utils/cardLayoutModel'

function TailDropZone({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      aria-hidden
      className={`mt-0.5 min-h-5 rounded-lg transition-colors ${
        isOver ? 'bg-violet-100/45 dark:bg-violet-950/30' : ''
      }`}
    />
  )
}

function SortableFieldRow({
  block,
  data,
  onRemove,
  onPatchCardData,
}: {
  block: CardFieldLayout
  data: GeneratedCardData
  onRemove: () => void
  onPatchCardData?: (patch: Partial<GeneratedCardData>) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/field relative rounded-xl border border-transparent px-2 py-2.5 transition-[border-color,box-shadow,background-color] hover:border-slate-200/90 hover:bg-slate-50/80 dark:hover:border-slate-700/80 dark:hover:bg-white/[0.04] ${
        isDragging
          ? 'z-10 border-violet-200/80 bg-violet-50/40 shadow-md ring-1 ring-violet-200/50 dark:border-violet-900/50 dark:bg-violet-950/30 dark:ring-violet-900/40'
          : ''
      }`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <button
          type="button"
          className="mt-1 flex h-8 w-7 shrink-0 cursor-grab touch-manipulation items-center justify-center rounded-md border border-slate-200/80 bg-white text-slate-400 opacity-100 shadow-sm active:cursor-grabbing dark:border-slate-700 dark:bg-slate-900 sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover/field:opacity-100 sm:group-focus-within/field:opacity-100"
          aria-label={`Drag to reorder or move ${fieldLabel(block.fieldType)}`}
          {...attributes}
          {...listeners}
        >
          <span className="select-none text-sm leading-none tracking-tighter text-slate-400 dark:text-slate-500">
            ⋮⋮
          </span>
        </button>
        <div className="min-w-0 flex-1 pr-1">
          <InlineEditableCardField
            fieldType={block.fieldType}
            data={data}
            readOnly={!onPatchCardData}
            onCommit={(patch) => onPatchCardData?.(patch)}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-1 shrink-0 rounded-md p-1.5 text-slate-400 opacity-100 transition-colors hover:bg-red-50/90 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/35 dark:hover:text-red-400 sm:opacity-0 sm:duration-150 sm:group-hover/field:opacity-100 sm:group-focus-within/field:opacity-100"
          aria-label={`Remove ${fieldLabel(block.fieldType)} from layout`}
        >
          <span className="sr-only">Remove</span>
          <span className="block text-lg leading-none" aria-hidden>
            ×
          </span>
        </button>
      </div>
    </div>
  )
}

function DragGhost({ block, data }: { block: CardFieldLayout; data: GeneratedCardData }) {
  return (
    <div className="rounded-xl border border-violet-300/60 bg-white/95 px-4 py-3 shadow-xl ring-2 ring-violet-400/30 dark:border-violet-700 dark:bg-slate-900/95">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
        {fieldLabel(block.fieldType)}
      </p>
      <div className="mt-1 line-clamp-2 text-sm text-slate-700 dark:text-slate-200">
        {renderCardFieldContent(data, block.fieldType) ?? (
          <span className="italic text-slate-400">Empty</span>
        )}
      </div>
    </div>
  )
}

type FaceBlocksSectionProps = {
  label: string
  muted?: boolean
  layout: CardFieldLayout[]
  side: 'front' | 'back'
  frontLayout: CardFieldLayout[]
  backLayout: CardFieldLayout[]
  data: GeneratedCardData
  onLayoutsChange: (front: CardFieldLayout[], back: CardFieldLayout[]) => void
  onPatchCardData?: (patch: Partial<GeneratedCardData>) => void
  tailDropId: string
}

function FaceBlocksSection({
  label,
  muted,
  layout,
  side,
  frontLayout,
  backLayout,
  data,
  onLayoutsChange,
  onPatchCardData,
  tailDropId,
}: FaceBlocksSectionProps) {
  const sorted = useMemo(() => sortByOrder(layout), [layout])
  const itemIds = useMemo(() => sorted.map((b) => b.id), [sorted])

  const handleRemove = (blockId: string) => {
    if (side === 'front') {
      const nf = removeBlock(frontLayout, blockId)
      const p = partitionLayouts(nf, backLayout)
      onLayoutsChange(p.front, p.back)
    } else {
      const nb = removeBlock(backLayout, blockId)
      const p = partitionLayouts(frontLayout, nb)
      onLayoutsChange(p.front, p.back)
    }
  }

  return (
    <div
      className={
        muted
          ? 'border-t border-slate-100 pt-8 dark:border-slate-800/90'
          : 'pt-2'
      }
    >
      <p className="mb-5 text-[11px] font-semibold tracking-[0.25em] text-slate-400 uppercase dark:text-slate-500">
        {label}
      </p>

      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-0.5">
          {sorted.map((block) => (
            <SortableFieldRow
              key={block.id}
              block={block}
              data={data}
              onPatchCardData={onPatchCardData}
              onRemove={() => handleRemove(block.id)}
            />
          ))}
        </div>
      </SortableContext>
      <TailDropZone id={tailDropId} />
    </div>
  )
}

type SortableFaceBlockListProps = {
  frontLayout: CardFieldLayout[]
  backLayout: CardFieldLayout[]
  data: GeneratedCardData
  onLayoutsChange: (front: CardFieldLayout[], back: CardFieldLayout[]) => void
  onPatchCardData?: (patch: Partial<GeneratedCardData>) => void
}

export function SortableFaceBlockList({
  frontLayout,
  backLayout,
  data,
  onLayoutsChange,
  onPatchCardData,
}: SortableFaceBlockListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const frontSorted = useMemo(() => sortByOrder(frontLayout), [frontLayout])
  const backSorted = useMemo(() => sortByOrder(backLayout), [backLayout])

  const activeBlock =
    activeId != null
      ? (frontSorted.find((b) => b.id === activeId) ??
          backSorted.find((b) => b.id === activeId) ??
          null)
      : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const applied = applyLayoutDragEnd(
      frontLayout,
      backLayout,
      String(active.id),
      String(over.id),
    )
    if (applied) {
      onLayoutsChange(applied.front, applied.back)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <FaceBlocksSection
        label="Front"
        layout={frontLayout}
        side="front"
        frontLayout={frontLayout}
        backLayout={backLayout}
        data={data}
        onLayoutsChange={onLayoutsChange}
        onPatchCardData={onPatchCardData}
        tailDropId={DROP_FRONT_TAIL_ID}
      />
      <FaceBlocksSection
        label="Back"
        muted
        layout={backLayout}
        side="back"
        frontLayout={frontLayout}
        backLayout={backLayout}
        data={data}
        onLayoutsChange={onLayoutsChange}
        onPatchCardData={onPatchCardData}
        tailDropId={DROP_BACK_TAIL_ID}
      />
      <DragOverlay>{activeBlock ? <DragGhost block={activeBlock} data={data} /> : null}</DragOverlay>
    </DndContext>
  )
}
