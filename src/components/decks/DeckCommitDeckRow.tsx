import { useEffect, useRef } from 'react'
import type { Deck } from '@/types/cards'
import { isInboxDeck } from '@/domain/inboxDeck'

function IconInbox({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 12h-6l-2 3H10l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

function IconEdit({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}

const iconBtn =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors duration-150 hover:bg-slate-700/50 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-40'

export type DeckCommitDeckRowProps = {
  deck: Deck
  cardCount: number
  selected: boolean
  isEditing: boolean
  editValue: string
  onSelect: () => void
  onStartEdit: () => void
  onEditChange: (value: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onRequestDelete: () => void
  rowTone: string
}

export function DeckCommitDeckRow({
  deck,
  cardCount,
  selected,
  isEditing,
  editValue,
  onSelect,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onRequestDelete,
  rowTone,
}: DeckCommitDeckRowProps) {
  const system = isInboxDeck(deck)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  return (
    <li>
      <div
        role="option"
        aria-selected={selected}
        className={[
          'flex items-center gap-1 rounded-lg border px-2 py-1.5 transition-[border-color,background-color,box-shadow] duration-150',
          rowTone,
        ].join(' ')}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') {
                e.preventDefault()
                onSaveEdit()
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                onCancelEdit()
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="min-w-0 flex-1 rounded-md border border-slate-600/80 bg-slate-950/80 px-2 py-1 text-[13px] text-slate-100 outline-none ring-0 focus:border-[color-mix(in_oklab,var(--color-accent)_40%,transparent)] focus:shadow-[0_0_0_2px_var(--color-accent-muted)]"
            aria-label={`Rename ${deck.name}`}
          />
        ) : (
          <button
            type="button"
            onClick={onSelect}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-0.5 pl-0.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-accent)]"
          >
            {system ? (
              <IconInbox className="shrink-0 text-slate-400 dark:text-slate-500" />
            ) : null}
            <span
              className={[
                'min-w-0 flex-1 truncate text-[13px]',
                selected
                  ? 'font-semibold text-slate-900 dark:text-slate-50'
                  : system
                    ? 'font-medium text-slate-600 dark:text-slate-300'
                    : 'font-medium text-slate-800 dark:text-slate-100',
              ].join(' ')}
            >
              {deck.name}
            </span>
          </button>
        )}

        <span
          className={[
            'shrink-0 tabular-nums text-[12px]',
            selected
              ? 'font-medium text-slate-500 dark:text-slate-400'
              : 'text-slate-400 dark:text-slate-500',
          ].join(' ')}
          aria-label={`${cardCount} cards`}
        >
          ({cardCount})
        </span>

        <div className="flex shrink-0 items-center gap-0.5 pl-0.5">
          <button
            type="button"
            className={iconBtn}
            aria-label={`Rename ${deck.name}`}
            disabled={isEditing}
            onClick={(e) => {
              e.stopPropagation()
              onStartEdit()
            }}
          >
            <IconEdit />
          </button>
          {!system ? (
            <button
              type="button"
              className={`${iconBtn} hover:text-red-400`}
              aria-label={`Delete ${deck.name}`}
              disabled={isEditing}
              onClick={(e) => {
                e.stopPropagation()
                onRequestDelete()
              }}
            >
              <IconTrash />
            </button>
          ) : null}
        </div>
      </div>
    </li>
  )
}
