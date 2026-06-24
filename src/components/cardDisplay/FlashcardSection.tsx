import type { ReactNode } from 'react'

type FlashcardSectionProps = {
  label: string
  children: ReactNode
  className?: string
}

export function FlashcardSection({ label, children, className }: FlashcardSectionProps) {
  return (
    <section className={['space-y-1', className].filter(Boolean).join(' ')}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      {children}
    </section>
  )
}

export function FlashcardSurface({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={[
        'rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-200/80 dark:bg-surface-900 dark:ring-slate-700/70',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
