type CardActionsMenuButtonProps = {
  disabled?: boolean
  onClick: () => void
  className?: string
}

export function CardActionsMenuButton({
  disabled,
  onClick,
  className,
}: CardActionsMenuButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label="Card actions"
      onClick={onClick}
      className={[
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-95 disabled:opacity-40 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <circle cx="12" cy="5" r="1.75" />
        <circle cx="12" cy="12" r="1.75" />
        <circle cx="12" cy="19" r="1.75" />
      </svg>
    </button>
  )
}
