import type { ReactNode } from 'react'
import { BottomSheet } from '@/components/decks/BottomSheet'

export type DeckCardActionsSheetProps = {
  open: boolean
  cardLabel: string
  busy?: boolean
  onClose: () => void
  onPreview: () => void
  onEdit: () => void
  onDelete: () => void
}

function ActionRow({
  icon,
  label,
  onClick,
  disabled,
  destructive,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex min-h-[52px] w-full items-center gap-4 px-5 text-left text-[15px] font-medium transition-colors',
        'disabled:opacity-40',
        destructive
          ? 'text-red-600 active:bg-red-50 dark:text-red-400 dark:active:bg-red-950/40'
          : 'text-slate-800 active:bg-slate-100 dark:text-slate-100 dark:active:bg-slate-800/70',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-6 w-6 shrink-0 items-center justify-center',
          destructive ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500',
        ].join(' ')}
        aria-hidden
      >
        {icon}
      </span>
      {label}
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

export function DeckCardActionsSheet({
  open,
  cardLabel,
  busy,
  onClose,
  onPreview,
  onEdit,
  onDelete,
}: DeckCardActionsSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      busy={busy}
      title={`Actions for ${cardLabel}`}
      heading={
        <p className="truncate text-[13px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {cardLabel}
        </p>
      }
    >
      <div role="menu" className="pb-1">
        <ActionRow
          icon={
            <svg {...svgProps}>
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          }
          label="Open preview"
          onClick={onPreview}
          disabled={busy}
        />
        <ActionRow
          icon={
            <svg {...svgProps}>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
            </svg>
          }
          label="Edit"
          onClick={onEdit}
          disabled={busy}
        />
        <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
        <ActionRow
          icon={
            <svg {...svgProps}>
              <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          }
          label="Delete"
          onClick={onDelete}
          disabled={busy}
          destructive
        />
      </div>
    </BottomSheet>
  )
}
