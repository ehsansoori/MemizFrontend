import type { SessionStats } from '@/store/generatedSession/reviewTypes'

type SessionStatsBarProps = {
  stats: SessionStats
}

/** Optional compact draft count (library uses separate surfaces). */
export function SessionStatsBar({ stats }: SessionStatsBarProps) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-500">
          Draft cards
        </span>
        <span className="font-display mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
          {stats.draftCardCount}
        </span>
      </div>
    </div>
  )
}
