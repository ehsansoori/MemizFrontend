import { useToast } from '@/providers/toastContext'

type AudioControlsProps = {
  label?: string
  compact?: boolean
}

export function AudioControls({ label, compact }: AudioControlsProps) {
  const { showToast } = useToast()

  const placeholder = () => {
    showToast('Audio generation will be available soon.', 'default')
  }

  const btnClass = compact
    ? 'flex h-9 min-w-[2.5rem] items-center justify-center rounded-xl bg-slate-100 px-2.5 text-slate-600 transition active:scale-95 dark:bg-slate-800 dark:text-slate-300'
    : 'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-[13px] font-semibold text-slate-700 transition active:scale-95 dark:bg-slate-800 dark:text-slate-200'

  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
      ) : null}
      <div className="flex gap-2">
        <button type="button" onClick={placeholder} className={btnClass} aria-label="Generate audio">
          {compact ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M12 3v12" />
              <path d="m8 11 4 4 4-4" />
              <path d="M4 21h16" />
            </svg>
          ) : (
            'Generate Audio'
          )}
        </button>
        <button
          type="button"
          onClick={placeholder}
          className={btnClass}
          aria-label="Play audio"
        >
          {compact ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            'Play Audio'
          )}
        </button>
      </div>
    </div>
  )
}
