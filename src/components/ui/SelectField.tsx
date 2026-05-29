import type { ReactNode, SelectHTMLAttributes } from 'react'

type Option = { value: string; label: string }

type SelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children'
> & {
  id: string
  label: string
  options: readonly Option[]
  hint?: ReactNode
}

export function SelectField({
  id,
  label,
  options,
  hint,
  className = '',
  ...rest
}: SelectFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pr-10 pl-3 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none dark:border-slate-700 dark:bg-surface-900 dark:text-slate-100"
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
          aria-hidden
        >
          ▾
        </span>
      </div>
      {hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}
