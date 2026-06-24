type CardTemplatePickerLineProps = {
  templateName: string
  onChangeClick: () => void
  disabled?: boolean
}

export function CardTemplatePickerLine({
  templateName,
  onChangeClick,
  disabled,
}: CardTemplatePickerLineProps) {
  return (
    <p className="text-center text-[13px] text-slate-500 dark:text-slate-400">
      Template:{' '}
      <span className="font-medium text-slate-700 dark:text-slate-300">{templateName}</span>
      <span aria-hidden className="mx-1.5">
        ·
      </span>
      <button
        type="button"
        onClick={onChangeClick}
        disabled={disabled}
        className="font-medium text-accent transition hover:underline disabled:opacity-40"
      >
        Change
      </button>
    </p>
  )
}
