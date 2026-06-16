type DraftSessionStatsProps = {
  draftTotal: number
  saved: number
  remaining: number
}

export function DraftSessionStats({ draftTotal, saved, remaining }: DraftSessionStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-3 dark:bg-slate-800/80">
      <Stat label="Draft Cards" value={draftTotal} />
      <Stat label="Saved" value={saved} accent="emerald" />
      <Stat label="Remaining" value={remaining} accent="amber" />
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: 'emerald' | 'amber'
}) {
  const valueClass =
    accent === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : accent === 'amber'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-slate-900 dark:text-white'

  return (
    <div className="text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className={`mt-0.5 text-[18px] font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  )
}
