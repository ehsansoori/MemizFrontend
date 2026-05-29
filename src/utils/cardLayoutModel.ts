import { ALL_CARD_FIELD_KEYS } from '@/store/generatedSession/constants'
import type { CardFieldKey, CardFieldLayout, GeneratedCardData } from '@/types/cards'

function newBlockId(): string {
  return crypto.randomUUID()
}

export function createLayoutBlock(
  fieldType: CardFieldKey,
  order: number,
): CardFieldLayout {
  return { id: newBlockId(), fieldType, order }
}

export function sortByOrder(layout: CardFieldLayout[]): CardFieldLayout[] {
  return [...layout].sort((a, b) => a.order - b.order)
}

/** Re-assign `order` from current array position (physical order is canonical). */
export function normalizeLayoutOrder(layout: CardFieldLayout[]): CardFieldLayout[] {
  return layout.map((item, index) => ({ ...item, order: index }))
}

export function createDefaultFrontLayout(): CardFieldLayout[] {
  return [createLayoutBlock('word', 0)]
}

export function createDefaultBackLayout(): CardFieldLayout[] {
  const keys = ALL_CARD_FIELD_KEYS.filter((k) => k !== 'word')
  return keys.map((fieldType, order) => createLayoutBlock(fieldType, order))
}

/** Deep clone with fresh block ids (stamp template onto a concrete card). */
export function cloneLayoutForCard(layout: CardFieldLayout[]): CardFieldLayout[] {
  return sortByOrder(layout).map((b, i) => ({
    id: newBlockId(),
    fieldType: b.fieldType,
    order: i,
  }))
}

/** A field may only appear on one side; front wins on conflict. */
export function partitionLayouts(
  front: CardFieldLayout[],
  back: CardFieldLayout[],
): { front: CardFieldLayout[]; back: CardFieldLayout[] } {
  const frontNorm = normalizeLayoutOrder(front)
  const frontTypes = new Set(frontNorm.map((b) => b.fieldType))
  const backOnly = normalizeLayoutOrder(back).filter((b) => !frontTypes.has(b.fieldType))
  return { front: frontNorm, back: backOnly }
}

export function fieldTypesOnSide(layout: CardFieldLayout[]): Set<CardFieldKey> {
  return new Set(layout.map((b) => b.fieldType))
}

export function removeFieldType(
  layout: CardFieldLayout[],
  fieldType: CardFieldKey,
): CardFieldLayout[] {
  return normalizeLayoutOrder(layout.filter((b) => b.fieldType !== fieldType))
}

export function assignFieldToSide(
  front: CardFieldLayout[],
  back: CardFieldLayout[],
  fieldType: CardFieldKey,
  side: 'front' | 'back',
): { front: CardFieldLayout[]; back: CardFieldLayout[] } {
  const f0 = removeFieldType(front, fieldType)
  const b0 = removeFieldType(back, fieldType)
  const block = createLayoutBlock(fieldType, 999)
  if (side === 'front') {
    return partitionLayouts(normalizeLayoutOrder([...f0, block]), b0)
  }
  return partitionLayouts(f0, normalizeLayoutOrder([...b0, block]))
}

export function removeBlock(layout: CardFieldLayout[], blockId: string): CardFieldLayout[] {
  return normalizeLayoutOrder(layout.filter((b) => b.id !== blockId))
}

/** Reorder after drag-and-drop using stable block ids. */
export function reorderLayoutByBlockIds(
  layout: CardFieldLayout[],
  activeId: string,
  overId: string,
): CardFieldLayout[] {
  const sorted = sortByOrder(layout)
  const oldIndex = sorted.findIndex((b) => b.id === activeId)
  const newIndex = sorted.findIndex((b) => b.id === overId)
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
    return normalizeLayoutOrder(sorted)
  }
  const next = [...sorted]
  const [removed] = next.splice(oldIndex, 1)
  if (!removed) return normalizeLayoutOrder(sorted)
  next.splice(newIndex, 0, removed)
  return normalizeLayoutOrder(next)
}

/** Droppable ids for “append to end of this face” in cross-face DnD. */
export const DROP_FRONT_TAIL_ID = 'memiz-drop-front-tail'
export const DROP_BACK_TAIL_ID = 'memiz-drop-back-tail'

export function findBlockSide(
  front: CardFieldLayout[],
  back: CardFieldLayout[],
  blockId: string,
): 'front' | 'back' | null {
  if (front.some((b) => b.id === blockId)) return 'front'
  if (back.some((b) => b.id === blockId)) return 'back'
  return null
}

/** Insert or move `block` into `layout`, ordered before `beforeId` (append when null). */
export function insertBlockBefore(
  layout: CardFieldLayout[],
  block: CardFieldLayout,
  beforeId: string | null,
): CardFieldLayout[] {
  const base = layout.filter((b) => b.id !== block.id && b.fieldType !== block.fieldType)
  const sorted = sortByOrder(base)
  if (beforeId == null) {
    return normalizeLayoutOrder([...sorted, block])
  }
  const idx = sorted.findIndex((b) => b.id === beforeId)
  if (idx < 0) {
    return normalizeLayoutOrder([...sorted, block])
  }
  const next = [...sorted]
  next.splice(idx, 0, block)
  return normalizeLayoutOrder(next)
}

export function moveBlockToEnd(layout: CardFieldLayout[], blockId: string): CardFieldLayout[] {
  const sorted = sortByOrder(layout)
  const b = sorted.find((x) => x.id === blockId)
  if (!b) return normalizeLayoutOrder(sorted)
  const rest = sorted.filter((x) => x.id !== blockId)
  return normalizeLayoutOrder([...rest, b])
}

/**
 * Apply a drag end for a single shared DnD context over front + back layouts.
 * Returns null when nothing should change.
 */
export function applyLayoutDragEnd(
  front: CardFieldLayout[],
  back: CardFieldLayout[],
  activeId: string,
  overId: string,
): { front: CardFieldLayout[]; back: CardFieldLayout[] } | null {
  if (activeId === overId) return null

  const from = findBlockSide(front, back, activeId)
  if (!from) return null

  const block = (from === 'front' ? front : back).find((b) => b.id === activeId)
  if (!block) return null

  const frontIds = new Set(front.map((b) => b.id))
  const backIds = new Set(back.map((b) => b.id))

  const removeFromSide = (side: 'front' | 'back') => {
    const layout = side === 'front' ? front : back
    return normalizeLayoutOrder(layout.filter((x) => x.id !== activeId))
  }

  if (overId === DROP_BACK_TAIL_ID) {
    if (from === 'front') {
      const nf = removeFromSide('front')
      const nb = insertBlockBefore(back, block, null)
      return partitionLayouts(nf, nb)
    }
    return { front, back: moveBlockToEnd(back, activeId) }
  }

  if (overId === DROP_FRONT_TAIL_ID) {
    if (from === 'back') {
      const nb = removeFromSide('back')
      const nf = insertBlockBefore(front, block, null)
      return partitionLayouts(nf, nb)
    }
    return { front: moveBlockToEnd(front, activeId), back }
  }

  const overInFront = frontIds.has(overId)
  const overInBack = backIds.has(overId)
  if (!overInFront && !overInBack) return null

  if (from === 'front' && overInFront) {
    return {
      front: reorderLayoutByBlockIds(front, activeId, overId),
      back,
    }
  }
  if (from === 'back' && overInBack) {
    return {
      front,
      back: reorderLayoutByBlockIds(back, activeId, overId),
    }
  }
  if (from === 'front' && overInBack) {
    const nf = removeFromSide('front')
    const nb = insertBlockBefore(back, block, overId)
    return partitionLayouts(nf, nb)
  }
  if (from === 'back' && overInFront) {
    const nb = removeFromSide('back')
    const nf = insertBlockBefore(front, block, overId)
    return partitionLayouts(nf, nb)
  }

  return null
}

/** Field types in layout order (for export / read-only faces). */
export function fieldTypesInOrder(layout: CardFieldLayout[]): CardFieldKey[] {
  return sortByOrder(layout).map((b) => b.fieldType)
}

export const PREVIEW_SAMPLE_DATA: GeneratedCardData = {
  word: 'study',
  phonetic: '/stʌdi/',
  partOfSpeech: 'noun · verb',
  targetMeaning: 'مطالعه، درس خواندن',
  englishMeaning: 'study, learning',
  examples: [
    { text: 'I study every day.', translation: 'من هر روز مطالعه می‌کنم.' },
    { text: 'She studies at the library.', translation: 'او در کتابخانه درس می‌خواند.' },
  ],
  notes: 'Layout preview — generate a draft to edit your own cards.',
}
