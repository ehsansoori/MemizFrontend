import type { ReactNode } from 'react'

type FlashcardPreviewPanelProps = {
  title: string
  children: ReactNode
}

export function FlashcardPreviewPanel({ title, children }: FlashcardPreviewPanelProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 dark:bg-surface-900 dark:ring-slate-700/60">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2 dark:border-slate-800 dark:bg-slate-800/40">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          {title}
        </p>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  )
}

type FlashcardPreviewSectionProps = {
  title: string
  children: ReactNode
  className?: string
}

export function FlashcardPreviewSection({
  title,
  children,
  className,
}: FlashcardPreviewSectionProps) {
  return (
    <section className={['space-y-1', className].filter(Boolean).join(' ')}>
      <h3 className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{title}</h3>
      <div>{children}</div>
    </section>
  )
}
