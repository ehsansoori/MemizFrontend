type AiSettingsLinkProps = {
  onClick: () => void
  disabled?: boolean
}

export function AiSettingsLink({ onClick, disabled }: AiSettingsLinkProps) {
  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="text-[13px] text-slate-500 transition hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-40"
      >
        AI settings
      </button>
    </div>
  )
}
