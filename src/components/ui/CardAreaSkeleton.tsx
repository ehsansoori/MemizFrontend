export function CardAreaSkeleton() {
  const bar = 'animate-pulse rounded bg-slate-200/80 dark:bg-slate-700/70'
  const barSoft = 'animate-pulse rounded bg-slate-100 dark:bg-slate-800/80'

  return (
    <section
      className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.2)] ring-1 ring-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-900/75 dark:ring-white/[0.03] sm:p-8"
      aria-busy="true"
      aria-label="Generating cards"
    >
      <div className="mb-6 flex flex-col items-center gap-2">
        <div className={`h-3 w-32 ${bar}`} />
        <div className={`h-2.5 w-48 ${barSoft}`} />
      </div>
      <div className="space-y-6">
        <div className="space-y-2 border-b border-slate-100 pb-6 dark:border-slate-800/80">
          <div className={`h-2.5 w-12 ${bar}`} />
          <div className={`h-10 w-3/4 max-w-xs rounded-lg ${barSoft}`} />
          <div className={`h-4 w-1/2 max-w-[10rem] ${barSoft}`} />
        </div>
        <div className="space-y-2">
          <div className={`h-2.5 w-10 ${bar}`} />
          <div className={`h-4 w-full ${barSoft}`} />
          <div className={`h-4 w-5/6 ${barSoft}`} />
          <div className={`h-4 w-2/3 ${barSoft}`} />
        </div>
      </div>
    </section>
  )
}
