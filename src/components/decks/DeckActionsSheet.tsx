import type { ReactNode } from 'react'
import { BottomSheet } from '@/components/decks/BottomSheet'

export type DeckActionsSheetProps = {
  open: boolean
  deckName: string
  deleteDisabled?: boolean
  busy?: boolean
  onClose: () => void
  onOpen: () => void
  onReview: () => void
  onRename: () => void
  onShare: () => void
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

export function DeckActionsSheet({
  open,
  deckName,
  deleteDisabled,
  busy,
  onClose,
  onOpen,
  onReview,
  onRename,
  onShare,
  onDelete,
}: DeckActionsSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      busy={busy}
      title={`Actions for ${deckName}`}
      heading={
        <p className="truncate text-[13px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {deckName}
        </p>
      }
    >
      <div role="menu" className="pb-1">
        <ActionRow icon={<IconOpen />} label="Open Deck" onClick={onOpen} disabled={busy} />
        <ActionRow icon={<IconReview />} label="Start Review" onClick={onReview} disabled={busy} />
        <ActionRow icon={<IconRename />} label="Rename Deck" onClick={onRename} disabled={busy} />
        <ActionRow icon={<IconShare />} label="Share Deck" onClick={onShare} disabled={busy} />
        <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
        <ActionRow
          icon={<IconDelete />}
          label="Delete Deck"
          onClick={onDelete}
          disabled={busy || deleteDisabled}
          destructive
        />
      </div>
    </BottomSheet>
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

function IconOpen() {
  return (
    <svg {...svgProps}>
      <path d="M4 19V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M13 3v5h5" />
    </svg>
  )
}

function IconReview() {
  return (
    <svg {...svgProps}>
      <path d="m6 4 13 8-13 8V4Z" />
    </svg>
  )
}

function IconRename() {
  return (
    <svg {...svgProps}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  )
}

function IconShare() {
  return (
    <svg {...svgProps}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  )
}

function IconDelete() {
  return (
    <svg {...svgProps}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}
