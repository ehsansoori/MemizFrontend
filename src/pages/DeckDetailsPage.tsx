import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { DeckAddCardsSheet } from '@/components/deckDetails/DeckAddCardsSheet'
import { getDeckType } from '@/domain/deckTypes'
import { resolveDeckDefaultTemplate } from '@/domain/resolveDeckTemplate'
import { countByQueue } from '@/domain/reviewQueue'
import { useToast } from '@/providers/toastContext'
import { useLibraryStore } from '@/store/library/libraryStore'

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-[20px] font-bold tabular-nums text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  )
}

export function DeckDetailsPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const decks = useLibraryStore((s) => s.decks)
  const allCards = useLibraryStore((s) => s.cards)
  const hydrated = useLibraryStore((s) => s.hydrated)
  const setActiveDeckId = useLibraryStore((s) => s.setActiveDeckId)

  const [addSheetOpen, setAddSheetOpen] = useState(false)

  const deck = useMemo(
    () => (deckId ? decks.find((d) => d.id === deckId) : undefined),
    [decks, deckId],
  )
  const deckTypeLabel = getDeckType(deck?.deckTypeId).label
  const templateName = resolveDeckDefaultTemplate(deck).name

  const deckCards = useMemo(
    () => (deckId ? allCards.filter((c) => c.deckId === deckId) : []),
    [allCards, deckId],
  )

  const queueCounts = useMemo(() => countByQueue(deckCards), [deckCards])
  const total = deckCards.length
  const studied = deckCards.filter((c) => c.study.status !== 'new').length
  const progress = total > 0 ? Math.round((studied / total) * 100) : 0

  if (hydrated && !deck) {
    return <Navigate to="/decks" replace />
  }

  const openBrowse = () => {
    if (!deckId) return
    navigate(`/decks/${deckId}/browse`)
  }

  const openStudy = () => {
    if (!deckId) return
    navigate(`/decks/${deckId}/study`)
  }

  const openQuiz = async () => {
    if (!deckId) return
    await setActiveDeckId(deckId)
    navigate(`/decks/${deckId}/quiz`)
  }

  const openAddCards = async () => {
    if (!deckId) return
    setAddSheetOpen(false)
    await setActiveDeckId(deckId)
    navigate('/add-cards')
  }

  const handleImport = () => {
    setAddSheetOpen(false)
    showToast('Import cards is coming soon.', 'error')
  }

  if (!deck) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <p className="text-center text-[14px] text-slate-500">Loading deck…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 sm:px-6">
      <div className="mb-5">
        <Link
          to="/decks"
          className="mb-3 inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-medium text-accent"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Decks
        </Link>
        <h1 className="text-[24px] font-bold tracking-tight text-slate-900 dark:text-white">
          {deck.name}
        </h1>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          {deckTypeLabel} · Default: {templateName}
        </p>
      </div>

      <section className="mb-6 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-700/70 dark:bg-surface-900 dark:shadow-card-dark">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Progress
            </p>
            <p className="mt-0.5 text-[28px] font-bold tabular-nums text-slate-900 dark:text-white">
              {progress}%
            </p>
          </div>
          <div className="h-14 w-14">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                className="stroke-accent"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${progress} 100`}
                pathLength="100"
              />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Total" value={total} />
          <StatPill label="New" value={queueCounts.new} />
          <StatPill label="Review" value={queueCounts.review} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={total === 0}
            onClick={openBrowse}
            className="flex h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white text-[13px] font-bold text-slate-800 transition active:scale-[0.98] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 sm:text-[14px]"
          >
            <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
            Browse
          </button>
          <button
            type="button"
            disabled={total === 0}
            onClick={openStudy}
            className="flex h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white text-[13px] font-bold text-slate-800 transition active:scale-[0.98] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 sm:text-[14px]"
          >
            <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" d="M4 19.5V4.5M9.5 9.5h5M9.5 14h5M20 19.5V4.5" />
            </svg>
            Study
          </button>
          <button
            type="button"
            disabled={total === 0}
            onClick={() => void openQuiz()}
            className="flex h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-accent text-[13px] font-bold text-white shadow-lg shadow-accent/25 transition active:scale-[0.98] disabled:opacity-50 sm:text-[14px]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="m8 5 11 7-11 7V5Z" />
            </svg>
            Quiz
          </button>
        </div>

        {total === 0 ? (
          <p className="mt-4 text-center text-[13px] text-slate-500 dark:text-slate-400">
            Add cards to browse, study, or quiz.
          </p>
        ) : (
          <p className="mt-4 text-center text-[12px] text-slate-400 dark:text-slate-500">
            Browse to find · Study to learn · Quiz to test recall
          </p>
        )}
      </section>

      <button
        type="button"
        disabled={false}
        aria-label="Add cards"
        onClick={() => setAddSheetOpen(true)}
        className="fab-animate fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-[110] flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 transition hover:bg-accent-hover active:scale-95 disabled:opacity-60"
      >
        <svg
          className="h-7 w-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <DeckAddCardsSheet
        open={addSheetOpen}
        busy={false}
        onClose={() => setAddSheetOpen(false)}
        onAddCards={() => void openAddCards()}
        onImport={handleImport}
      />
    </main>
  )
}
