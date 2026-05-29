import type { ReactNode } from 'react'

export function FieldBlockReadonly({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
        {label}
      </p>
      <div className="text-base leading-relaxed text-slate-900 dark:text-slate-100">
        {children}
      </div>
    </div>
  )
}
