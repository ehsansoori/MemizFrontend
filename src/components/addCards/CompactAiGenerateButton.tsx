type CompactAiGenerateButtonProps = {
  onClick: () => void
  busy?: boolean
  disabled?: boolean
  label?: string
}

export function CompactAiGenerateButton({
  onClick,
  busy,
  disabled,
  label = 'AI Generate',
}: CompactAiGenerateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={busy ? 'Generating' : label}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 transition hover:border-accent/50 hover:text-accent active:scale-[0.98] disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-accent/50"
    >
      {busy ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-accent dark:border-slate-600" />
          <span className="sr-only">Generating</span>
        </>
      ) : (
        <>
          <span aria-hidden className="text-[14px] leading-none">
            ✨
          </span>
          <span>{label}</span>
        </>
      )}
    </button>
  )
}
