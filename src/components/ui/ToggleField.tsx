import type { ReactNode } from 'react'

type ToggleFieldProps = {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description?: ReactNode
}

export function ToggleField({
  id,
  label,
  checked,
  onChange,
  description,
}: ToggleFieldProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-surface-50 px-4 py-3 dark:border-slate-800 dark:bg-surface-900/60">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-800 dark:text-slate-100"
        >
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-surface-950 ${
          checked ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
