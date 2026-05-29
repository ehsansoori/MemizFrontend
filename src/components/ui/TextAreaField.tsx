import type { ReactNode, TextareaHTMLAttributes } from 'react'

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string
  label: string
  hint?: ReactNode
}

export function TextAreaField({
  id,
  label,
  hint,
  className = '',
  ...rest
}: TextAreaFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <textarea
        id={id}
        rows={4}
        className="min-h-[120px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none dark:border-slate-700 dark:bg-surface-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        {...rest}
      />
      {hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}
