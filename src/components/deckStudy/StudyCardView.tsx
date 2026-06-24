import { useEffect, useRef } from 'react'
import { SavedCardTemplateBlocksView, SAVED_CARD_READ_VARIANT } from '@/components/cardDisplay/SavedCardTemplateBlocksView'
import { CardActionsMenuButton } from '@/components/cards/CardActionsMenuButton'
import type { SavedCard } from '@/types/cards'

type StudyCardViewProps = {
  card: SavedCard
  menuDisabled?: boolean
  onMenu: () => void
}

export function StudyCardView({ card, menuDisabled, onMenu }: StudyCardViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = 0
  }, [card.id])

  return (
    <article className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <div className="absolute right-0 top-0 z-10">
        <CardActionsMenuButton disabled={menuDisabled} onClick={onMenu} />
      </div>

      <div
        ref={scrollRef}
        data-study-scroll
        className="study-scroll-panel scrollbar-minimal min-h-0 flex-1 overflow-y-auto pb-4 pr-10 pt-1 sm:pt-2"
      >
        <SavedCardTemplateBlocksView card={card} side="all" variant={SAVED_CARD_READ_VARIANT} />
      </div>
    </article>
  )
}
