import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { DeckAddCardsSheet } from '@/components/deckDetails/DeckAddCardsSheet'
import { DeckCardActionsSheet } from '@/components/deckDetails/DeckCardActionsSheet'
import { DeckCardEditSheet } from '@/components/deckDetails/DeckCardEditSheet'
import { DeckCardPreviewSheet } from '@/components/deckDetails/DeckCardPreviewSheet'
import { CARD_STATUS_LABELS, CARD_STATUS_STYLES } from '@/domain/cardStudyDisplay'
import { getDeckType } from '@/domain/deckTypes'
import { resolveDeckDefaultTemplate } from '@/domain/resolveDeckTemplate'
import { filterAndRankCardsBySearch } from '@/domain/cardSearch'
import { countByQueue } from '@/domain/reviewQueue'
import { useToast } from '@/providers/toastContext'
import { storage } from '@/storage/adapter'
import { useLibraryStore } from '@/store/library/libraryStore'
import type { SavedCard } from '@/types/cards'

type StatusFilter = 'all' | 'new' | 'learning' | 'mastered'

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'learning', label: 'Learning' },
  { id: 'mastered', label: 'Mastered' },
]

function filterByStatus(cards: SavedCard[], filter: StatusFilter): SavedCard[] {
  if (filter === 'all') return cards
  return cards.filter((c) => c.study.status === filter)
}

function buildFacesFromData(card: SavedCard): { front: string; back: string } {
  const { data } = card
  const frontParts = [data.word]
  if (data.phonetic?.trim()) frontParts.push(data.phonetic.trim())
  const backParts: string[] = []
  if (data.targetMeaning?.trim()) {
    backParts.push(`Target meaning\n${data.targetMeaning.trim()}`)
  }
  if (data.englishMeaning?.trim()) {
    backParts.push(`English meaning\n${data.englishMeaning.trim()}`)
  }
  return {
    front: frontParts.join('\n'),
    back: backParts.join('\n\n') || card.back,
  }
}

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
  const reload = useLibraryStore((s) => s.reload)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [actionsCard, setActionsCard] = useState<SavedCard | null>(null)
  const [previewCard, setPreviewCard] = useState<SavedCard | null>(null)
  const [editCard, setEditCard] = useState<SavedCard | null>(null)
  const [busy, setBusy] = useState(false)

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

  const filteredCards = useMemo(() => {
    const byStatus = filterByStatus(deckCards, statusFilter)
    const searched = filterAndRankCardsBySearch(byStatus, query, 'all')
    if (query.trim()) return searched
    return [...searched].sort((a, b) =>
      a.data.word.localeCompare(b.data.word, undefined, { sensitivity: 'base' }),
    )
  }, [deckCards, statusFilter, query])

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: deckCards.length,
      new: 0,
      learning: 0,
      mastered: 0,
    }
    for (const card of deckCards) {
      const status = card.study.status
      if (status === 'new') counts.new += 1
      if (status === 'learning') counts.learning += 1
      if (status === 'mastered') counts.mastered += 1
    }
    return counts
  }, [deckCards])

  if (hydrated && !deck) {
    return <Navigate to="/decks" replace />
  }

  const startStudy = async () => {
    if (!deckId) return
    await setActiveDeckId(deckId)
    navigate('/review')
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

  const handleDeleteCard = async (card: SavedCard) => {
    if (!window.confirm(`Delete “${card.data.word}”?`)) return
    setBusy(true)
    try {
      await storage.cards.softDelete(card.id)
      await reload()
      showToast('Card deleted.', 'success')
      setActionsCard(null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not delete card.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleSaveCard = async (
    card: SavedCard,
    values: { word: string; targetMeaning: string; englishMeaning: string },
  ) => {
    setBusy(true)
    try {
      const data = {
        ...card.data,
        word: values.word,
        targetMeaning: values.targetMeaning || undefined,
        englishMeaning: values.englishMeaning || undefined,
      }
      const faces = buildFacesFromData({ ...card, data })
      await storage.cards.put({
        ...card,
        data,
        front: faces.front,
        back: faces.back,
        updatedAt: new Date().toISOString(),
      })
      await reload()
      showToast('Card updated.', 'success')
      setEditCard(null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not update card.', 'error')
    } finally {
      setBusy(false)
    }
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

      <section className="mb-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-700/70 dark:bg-surface-900 dark:shadow-card-dark">
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

        <button
          type="button"
          disabled={busy || total === 0}
          onClick={() => void startStudy()}
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-[16px] font-bold text-white shadow-lg shadow-accent/25 transition active:scale-[0.98] disabled:opacity-50"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="m8 5 11 7-11 7V5Z" />
          </svg>
          Study Now
        </button>
      </section>

      <div className="relative mb-4">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards"
          aria-label="Search cards"
          className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/25 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800"
        />
      </div>

      <div
        className="mb-4 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Card status filters"
      >
        {STATUS_FILTERS.map((tab) => {
          const active = statusFilter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatusFilter(tab.id)}
              className={[
                'inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition',
                active
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
              ].join(' ')}
            >
              {tab.label}
              <span
                className={[
                  'tabular-nums',
                  active ? 'text-white/80' : 'text-slate-400 dark:text-slate-500',
                ].join(' ')}
              >
                {statusCounts[tab.id]}
              </span>
            </button>
          )
        })}
      </div>

      {filteredCards.length === 0 ? (
        <div className="mt-12 flex flex-col items-center px-6 text-center">
          <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-200">
            {deckCards.length === 0 ? 'No cards in this deck' : 'No cards match'}
          </p>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            {deckCards.length === 0
              ? 'Tap + to add your first card.'
              : 'Try another search or filter.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredCards.map((card, index) => (
            <li
              key={card.id}
              className="deck-card-animate relative"
              style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
            >
              <button
                type="button"
                disabled={busy}
                aria-label={`Preview ${card.data.word}`}
                onClick={() => setPreviewCard(card)}
                className="absolute inset-0 z-0 rounded-2xl border border-slate-200/80 bg-white transition active:scale-[0.99] disabled:opacity-60 dark:border-slate-700/70 dark:bg-surface-900"
              />

              <div className="pointer-events-none relative z-10 flex items-center gap-3 p-4 pr-12">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold text-slate-900 dark:text-white">
                    {card.data.word}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-slate-500 dark:text-slate-400">
                    {card.data.englishMeaning || card.data.targetMeaning || 'No meaning yet'}
                  </p>
                </div>
                <span
                  className={[
                    'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                    CARD_STATUS_STYLES[card.study.status],
                  ].join(' ')}
                >
                  {CARD_STATUS_LABELS[card.study.status]}
                </span>
              </div>

              <button
                type="button"
                disabled={busy}
                aria-label={`Actions for ${card.data.word}`}
                aria-haspopup="menu"
                onClick={() => setActionsCard(card)}
                className="absolute right-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition active:bg-slate-100 disabled:opacity-50 dark:text-slate-500 dark:active:bg-slate-800"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <circle cx="12" cy="5" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="12" cy="19" r="1.6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={busy}
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
        busy={busy}
        onClose={() => setAddSheetOpen(false)}
        onAddCards={() => void openAddCards()}
        onGenerateAi={() => void openAddCards()}
        onImport={handleImport}
      />

      <DeckCardActionsSheet
        open={actionsCard !== null}
        cardLabel={actionsCard?.data.word ?? ''}
        busy={busy}
        onClose={() => setActionsCard(null)}
        onPreview={() => {
          const card = actionsCard
          setActionsCard(null)
          if (card) setPreviewCard(card)
        }}
        onEdit={() => {
          const card = actionsCard
          setActionsCard(null)
          if (card) setEditCard(card)
        }}
        onDelete={() => {
          const card = actionsCard
          if (card) void handleDeleteCard(card)
        }}
      />

      <DeckCardPreviewSheet
        open={previewCard !== null}
        card={previewCard}
        onClose={() => setPreviewCard(null)}
      />

      <DeckCardEditSheet
        open={editCard !== null}
        card={editCard}
        busy={busy}
        onClose={() => setEditCard(null)}
        onSubmit={(card, values) => void handleSaveCard(card, values)}
      />
    </main>
  )
}
