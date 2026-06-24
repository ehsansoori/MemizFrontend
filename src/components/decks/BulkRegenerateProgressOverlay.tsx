import { useEffect } from 'react'
import type { BulkRegenerateProgress } from '@/domain/bulkTemplateMigration'

type BulkRegenerateProgressOverlayProps = {
  phase: 'processing' | 'completed' | 'failed'
  progress: BulkRegenerateProgress | null
  summary: { succeeded: number; failed: number } | null
  errorMessage?: string | null
  onClose: () => void
}

export function BulkRegenerateProgressOverlay({
  phase,
  progress,
  summary,
  errorMessage,
  onClose,
}: BulkRegenerateProgressOverlayProps) {
  const running = phase === 'processing'
  const total = progress?.total ?? 0
  const processed = progress?.processed ?? 0
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-white p-6 dark:bg-surface-950">
      <div className="w-full max-w-md">
        {running ? (
          <>
            <h2 className="text-center text-[22px] font-bold text-slate-900 dark:text-white">
              Regenerating cards…
            </h2>
            <p className="mt-2 text-center text-[14px] text-slate-500 dark:text-slate-400">
              Updating cards with the new template. Please keep this screen open until finished.
            </p>
            <div className="mt-8 space-y-3">
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-center text-[15px] font-medium tabular-nums text-slate-700 dark:text-slate-200">
                {processed} / {total} cards completed
              </p>
            </div>
          </>
        ) : phase === 'failed' ? (
          <>
            <h2 className="text-center text-[22px] font-bold text-slate-900 dark:text-white">
              Regeneration failed
            </h2>
            <p className="mt-3 text-center text-[15px] leading-relaxed text-red-600 dark:text-red-400">
              {errorMessage ?? 'Something went wrong while updating cards. Please try again.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 h-12 w-full rounded-2xl bg-accent text-[15px] font-semibold text-white"
            >
              Close
            </button>
          </>
        ) : summary ? (
          <>
            <h2 className="text-center text-[22px] font-bold text-slate-900 dark:text-white">
              Update complete
            </h2>
            <div className="mt-4 space-y-1 text-center text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">
              {summary.failed === 0 ? (
                <p className="font-semibold">
                  {summary.succeeded} card{summary.succeeded === 1 ? '' : 's'} updated successfully.
                </p>
              ) : (
                <>
                  <p className="font-semibold">
                    {summary.succeeded} card{summary.succeeded === 1 ? '' : 's'} updated successfully.
                  </p>
                  <p className="text-red-600 dark:text-red-400">
                    {summary.failed} card{summary.failed === 1 ? '' : 's'} failed.
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 h-12 w-full rounded-2xl bg-accent text-[15px] font-semibold text-white"
            >
              Done
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
