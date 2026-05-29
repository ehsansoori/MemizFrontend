import { useEffect, useState, type ReactNode } from 'react'
import { useLibraryStore } from '@/store/library/libraryStore'

type StorageBootstrapProps = {
  children: ReactNode
}

/**
 * Hydrates IndexedDB in the background. The main UI always renders so the app
 * never stays on a blank screen if storage is slow or blocked.
 */
export function StorageBootstrap({ children }: StorageBootstrapProps) {
  const hydrate = useLibraryStore((s) => s.hydrate)
  const hydrated = useLibraryStore((s) => s.hydrated)
  const hydrating = useLibraryStore((s) => s.hydrating)
  const error = useLibraryStore((s) => s.error)
  const [bootError, setBootError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void hydrate().catch((e: unknown) => {
      if (!cancelled) {
        const message =
          e instanceof Error ? e.message : 'Storage initialization failed.'
        setBootError(message)
      }
    })
    return () => {
      cancelled = true
    }
  }, [hydrate])

  const statusMessage = bootError ?? error
  const showBanner = !!statusMessage || (!hydrated && hydrating)

  return (
    <>
      {showBanner ? (
        <div
          role="status"
          className="border-b border-slate-200 bg-slate-100 px-4 py-2 text-center text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          style={{
            backgroundColor: statusMessage ? '#fef2f2' : '#f1f5f9',
            color: statusMessage ? '#b91c1c' : '#475569',
          }}
        >
          {statusMessage ??
            'Loading your library… You can use the generator while this finishes.'}
        </div>
      ) : null}
      {children}
    </>
  )
}
