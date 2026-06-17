import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TemplateBuilderSheet } from '@/components/addCards/TemplateBuilderSheet'
import { DeckActionsSheet } from '@/components/decks/DeckActionsSheet'
import { DeckCreateSheet } from '@/components/decks/DeckCreateSheet'
import { DeckDeleteDialog } from '@/components/decks/DeckDeleteDialog'
import { DeckNameSheet } from '@/components/decks/DeckNameSheet'
import { customTemplateRepository } from '@/storage/customTemplateRepository'
import { countByQueue } from '@/domain/reviewQueue'
import { findInboxDeck } from '@/domain/inboxDeck'
import { useToast } from '@/providers/toastContext'
import { useLibraryStore } from '@/store/library/libraryStore'
import type { DeleteDeckMode } from '@/store/library/deckManagement'
import type { Deck } from '@/types/cards'
import type { CreateDeckParams } from '@/types/deckProfile'

function byName(a: Deck, b: Deck): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

type DeckStats = { total: number; new: number; review: number; progress: number }

function StatChip({
  count,
  label,
  tone,
}: {
  count: number
  label: string
  tone: 'new' | 'review'
}) {
  const dot = tone === 'new' ? 'bg-sky-500' : 'bg-amber-500'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      <span className="tabular-nums">{count}</span>
      <span className="text-slate-400 dark:text-slate-500">{label}</span>
    </span>
  )
}

export function DecksPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const decks = useLibraryStore((s) => s.decks)
  const cards = useLibraryStore((s) => s.cards)
  const setActiveDeckId = useLibraryStore((s) => s.setActiveDeckId)
  const createDeck = useLibraryStore((s) => s.createDeck)
  const renameDeck = useLibraryStore((s) => s.renameDeck)
  const deleteDeck = useLibraryStore((s) => s.deleteDeck)

  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [templateBuilderOpen, setTemplateBuilderOpen] = useState(false)
  const [deckCreateTemplateId, setDeckCreateTemplateId] = useState<string | undefined>()
  const [resumeDeckCreate, setResumeDeckCreate] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Deck | null>(null)
  const [actionsTarget, setActionsTarget] = useState<Deck | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    deck: Deck
    cardCount: number
  } | null>(null)
  const [busy, setBusy] = useState(false)

  const statsByDeck = useMemo(() => {
    const m = new Map<string, DeckStats>()
    for (const deck of decks) {
      const deckCards = cards.filter((c) => c.deckId === deck.id)
      const counts = countByQueue(deckCards)
      const total = deckCards.length
      const studied = deckCards.filter((c) => c.study.status !== 'new').length
      const progress = total > 0 ? Math.round((studied / total) * 100) : 0
      m.set(deck.id, { total, new: counts.new, review: counts.review, progress })
    }
    return m
  }, [decks, cards])

  const q = query.trim().toLowerCase()
  const filteredDecks = useMemo(() => {
    const list = [...decks].sort(byName)
    if (!q) return list
    return list.filter((d) => d.name.toLowerCase().includes(q))
  }, [decks, q])

  const inboxDeck = useMemo(() => findInboxDeck(decks), [decks])
  const canDeleteDeck = decks.length > 1

  const openDeck = async (deckId: string) => {
    await setActiveDeckId(deckId)
    navigate(`/decks/${deckId}`)
  }

  const startReview = async (deckId: string) => {
    await setActiveDeckId(deckId)
    navigate(`/decks/${deckId}/quiz`)
  }

  const handleShare = async (deck: Deck) => {
    const url = `${window.location.origin}/decks`
    const text = `Check out my flashcard deck “${deck.name}” on Memiz`
    try {
      if (navigator.share) {
        await navigator.share({ title: deck.name, text, url })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} — ${url}`)
        showToast('Share link copied to clipboard.', 'success')
      } else {
        showToast('Sharing is not supported on this device.', 'error')
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        showToast('Could not share deck.', 'error')
      }
    }
  }

  const handleCreate = async (params: CreateDeckParams) => {
    setBusy(true)
    try {
      await createDeck(params)
      showToast(`Created deck: ${params.name}`, 'success')
      setCreating(false)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not create deck.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleRename = async (deckId: string, name: string) => {
    setBusy(true)
    try {
      await renameDeck(deckId, name)
      showToast('Deck renamed.', 'success')
      setRenameTarget(null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not rename deck.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async (mode: DeleteDeckMode) => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteDeck(deleteTarget.deck.id, mode)
      showToast('Deck deleted.', 'success')
      setDeleteTarget(null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not delete deck.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const hasDecks = decks.length > 0

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 sm:px-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
          My Decks
        </h1>
        <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">
          {decks.length} {decks.length === 1 ? 'deck' : 'decks'}
        </span>
      </div>

      {hasDecks ? (
        <div className="relative mb-5">
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
            placeholder="Search decks"
            aria-label="Search decks"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/25 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800"
          />
        </div>
      ) : null}

      {filteredDecks.length === 0 ? (
        <div className="mt-16 flex flex-col items-center px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect x="3" y="4" width="14" height="16" rx="2" />
              <path d="M7 4V2m10 6 4 1v11l-4-1" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-200">
            {hasDecks ? 'No decks match your search' : 'No decks yet'}
          </p>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            {hasDecks
              ? 'Try a different name.'
              : 'Tap the + button to create your first deck.'}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredDecks.map((deck, index) => {
            const stats = statsByDeck.get(deck.id) ?? {
              total: 0,
              new: 0,
              review: 0,
              progress: 0,
            }

            return (
              <li
                key={deck.id}
                className="deck-card-animate relative"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Open ${deck.name}`}
                  onClick={() => void openDeck(deck.id)}
                  className="absolute inset-0 z-0 rounded-3xl border border-slate-200/80 bg-white shadow-card transition active:scale-[0.985] disabled:opacity-60 dark:border-slate-700/70 dark:bg-surface-900 dark:shadow-card-dark"
                />

                <div className="pointer-events-none relative z-10 flex h-full flex-col gap-5 p-5">
                  <h3 className="line-clamp-2 pr-10 text-[17px] font-bold leading-snug text-slate-900 dark:text-white">
                    {deck.name}
                  </h3>

                  <div className="mt-auto space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between text-[12px] font-medium text-slate-400 dark:text-slate-500">
                        <span>Progress</span>
                        <span className="tabular-nums text-slate-600 dark:text-slate-300">
                          {stats.progress}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                          style={{ width: `${stats.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatChip count={stats.new} label="New" tone="new" />
                      <StatChip count={stats.review} label="Review" tone="review" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Actions for ${deck.name}`}
                  aria-haspopup="menu"
                  onClick={() => setActionsTarget(deck)}
                  className="absolute right-1.5 top-1.5 z-20 flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition active:bg-slate-100 disabled:opacity-50 dark:text-slate-500 dark:active:bg-slate-800"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <circle cx="12" cy="5" r="1.6" />
                    <circle cx="12" cy="12" r="1.6" />
                    <circle cx="12" cy="19" r="1.6" />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <button
        type="button"
        disabled={busy}
        aria-label="Create deck"
        onClick={() => setCreating(true)}
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

      <DeckActionsSheet
        open={actionsTarget !== null}
        deckName={actionsTarget?.name ?? ''}
        deleteDisabled={!canDeleteDeck}
        busy={busy}
        onClose={() => setActionsTarget(null)}
        onOpen={() => {
          const deck = actionsTarget
          setActionsTarget(null)
          if (deck) void openDeck(deck.id)
        }}
        onReview={() => {
          const deck = actionsTarget
          setActionsTarget(null)
          if (deck) void startReview(deck.id)
        }}
        onRename={() => {
          const deck = actionsTarget
          setActionsTarget(null)
          if (deck) setRenameTarget(deck)
        }}
        onShare={() => {
          const deck = actionsTarget
          setActionsTarget(null)
          if (deck) void handleShare(deck)
        }}
        onDelete={() => {
          const deck = actionsTarget
          setActionsTarget(null)
          if (deck) {
            setDeleteTarget({
              deck,
              cardCount: statsByDeck.get(deck.id)?.total ?? 0,
            })
          }
        }}
      />

      <DeckCreateSheet
        open={creating}
        busy={busy}
        initialTemplateId={deckCreateTemplateId}
        onClose={() => {
          setCreating(false)
          setDeckCreateTemplateId(undefined)
        }}
        onSubmit={(params) => void handleCreate(params)}
        onCreateTemplate={() => {
          setCreating(false)
          setResumeDeckCreate(true)
          setTemplateBuilderOpen(true)
        }}
      />

      <TemplateBuilderSheet
        open={templateBuilderOpen}
        busy={busy}
        onClose={() => {
          setTemplateBuilderOpen(false)
          if (resumeDeckCreate) {
            setResumeDeckCreate(false)
            setCreating(true)
          }
        }}
        onSave={(name, fields) => {
          const saved = customTemplateRepository.save(name, fields)
          showToast(`Template “${name}” saved.`, 'success')
          setTemplateBuilderOpen(false)
          setResumeDeckCreate(false)
          setDeckCreateTemplateId(saved.id)
          setCreating(true)
        }}
      />

      <DeckNameSheet
        open={renameTarget !== null}
        mode="rename"
        initialValue={renameTarget?.name ?? ''}
        busy={busy}
        onClose={() => setRenameTarget(null)}
        onSubmit={(name) => {
          if (renameTarget) void handleRename(renameTarget.id, name)
        }}
      />

      {deleteTarget ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            aria-label="Close"
            onClick={() => !busy && setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-sm">
            <DeckDeleteDialog
              deck={deleteTarget.deck}
              cardCount={deleteTarget.cardCount}
              inboxName={inboxDeck?.name ?? 'Inbox'}
              busy={busy}
              onClose={() => !busy && setDeleteTarget(null)}
              onConfirm={(mode) => void confirmDelete(mode)}
            />
          </div>
        </div>
      ) : null}
    </main>
  )
}
