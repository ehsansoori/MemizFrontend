import { Navigate } from 'react-router-dom'
import { useLibraryStore } from '@/store/library/libraryStore'

/** Legacy /review route — opens quiz for the active deck. */
export function ReviewPage() {
  const activeDeckId = useLibraryStore((s) => s.activeDeckId)
  const hydrated = useLibraryStore((s) => s.hydrated)

  if (!hydrated) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <p className="text-center text-[14px] text-slate-500">Loading…</p>
      </main>
    )
  }

  if (activeDeckId) {
    return <Navigate to={`/decks/${activeDeckId}/quiz`} replace />
  }

  return <Navigate to="/decks" replace />
}
