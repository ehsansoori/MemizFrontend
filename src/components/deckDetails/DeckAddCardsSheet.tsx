import type { ReactNode } from 'react'
import { BottomSheet } from '@/components/decks/BottomSheet'

export type DeckAddCardsSheetProps = {
  open: boolean
  busy?: boolean
  onClose: () => void
  onAddCards: () => void
  onGenerateAi: () => void
  onImport: () => void
}

function ActionRow({
  icon,
  label,
  description,
  onClick,
  disabled,
}: {
  icon: ReactNode
  label: string
  description?: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-[60px] w-full items-center gap-4 px-5 py-3 text-left transition-colors active:bg-slate-100 disabled:opacity-40 dark:active:bg-slate-800/70"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-muted text-accent"
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-slate-900 dark:text-white">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-[13px] text-slate-500 dark:text-slate-400">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  )
}

const svgProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function DeckAddCardsSheet({
  open,
  busy,
  onClose,
  onAddCards,
  onGenerateAi,
  onImport,
}: DeckAddCardsSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      busy={busy}
      title="Add cards"
      heading={
        <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Add cards</h2>
      }
    >
      <div role="menu" className="pb-2">
        <ActionRow
          icon={
            <svg {...svgProps}>
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
          label="Make Card"
          description="Open the card workspace for this deck"
          onClick={onAddCards}
          disabled={busy}
        />
        <ActionRow
          icon={
            <svg {...svgProps}>
              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
              <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1 1 3Z" />
            </svg>
          }
          label="Generate with AI"
          description="Create flashcards from your input"
          onClick={onGenerateAi}
          disabled={busy}
        />
        <ActionRow
          icon={
            <svg {...svgProps}>
              <path d="M12 3v12" />
              <path d="m8 11 4 4 4-4" />
              <path d="M4 21h16" />
            </svg>
          }
          label="Import Cards"
          description="Bring cards in from a file"
          onClick={onImport}
          disabled={busy}
        />
      </div>
    </BottomSheet>
  )
}
