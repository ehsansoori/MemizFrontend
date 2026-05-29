import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeckActionsMenu } from '@/components/decks/DeckActionsMenu'
import { DeckDeleteDialog } from '@/components/decks/DeckDeleteDialog'
import { countByQueue } from '@/domain/reviewQueue'
import { findInboxDeck } from '@/domain/inboxDeck'
import { useToast } from '@/providers/toastContext'
import { useLibraryStore } from '@/store/library/libraryStore'
import type { DeleteDeckMode } from '@/store/library/deckManagement'
import type { Deck } from '@/types/cards'

function byName(a: Deck, b: Deck): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

function CountCell({ value, emphasis }: { value: number; emphasis?: boolean }) {
  if (value === 0 && !emphasis) {
    return <span className="w-6 text-center text-[13px] text-slate-300 dark:text-slate-600">0</span>
  }
  return (
    <span
      className={[
        'w-6 text-center text-[13px] tabular-nums',
        emphasis
          ? 'font-bold text-accent'
          : 'text-slate-500 dark:text-slate-400',
      ].join(' ')}
    >
      {value}
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
  const [newDeckName, setNewDeckName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{
    deck: Deck
    cardCount: number
  } | null>(null)
  const [busy, setBusy] = useState(false)

  const queueCountsByDeck = useMemo(() => {
    const m = new Map<string, ReturnType<typeof countByQueue>>()
    for (const deck of decks) {
      const deckCards = cards.filter((c) => c.deckId === deck.id)
      m.set(deck.id, countByQueue(deckCards))
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

  const startReview = async (deckId: string) => {
    await setActiveDeckId(deckId)
    navigate('/review')
  }

  const handleCreate = async () => {
    const name = newDeckName.trim()
    if (!name) return
    setBusy(true)
    try {
      await createDeck(name)
      showToast(`Created deck: ${name}`, 'success')
      setNewDeckName('')
      setCreating(false)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not create deck.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const saveRename = async (deckId: string) => {
    setBusy(true)
    try {
      await renameDeck(deckId, editingName)
      showToast('Deck renamed.', 'success')
      setEditingId(null)
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

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-4 sm:px-8">
      <div className="mb-2 border-b border-slate-200/80 pb-2 dark:border-slate-700">
        <label className="sr-only">Filter decks</label>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter decks…"
          className="w-full max-w-xs border-0 bg-transparent px-0 text-[13px] text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-slate-200"
        />
      </div>

      {creating ? (
        <div className="flex items-center gap-3 border-b border-slate-200/60 bg-slate-50/80 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/50">
          <input
            type="text"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            placeholder="Deck name"
            autoFocus
            className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-slate-900 outline-none dark:text-slate-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCreate()
              if (e.key === 'Escape') {
                setCreating(false)
                setNewDeckName('')
              }
            }}
          />
          <button
            type="button"
            disabled={busy}
            className="text-[13px] text-accent hover:underline disabled:opacity-50"
            onClick={() => void handleCreate()}
          >
            Create
          </button>
          <button
            type="button"
            className="text-[13px] text-slate-500 hover:underline"
            onClick={() => {
              setCreating(false)
              setNewDeckName('')
            }}
          >
            Cancel
          </button>
        </div>
      ) : null}

      <ul>
        {filteredDecks.length === 0 ? (
          <li className="px-3 py-8 text-center text-[13px] text-slate-500">
            No decks match your search.
          </li>
        ) : (
          filteredDecks.map((deck, index) => {
            const counts = queueCountsByDeck.get(deck.id) ?? {
              new: 0,
              review: 0,
            }
            const total = cards.filter((c) => c.deckId === deck.id).length
            const isEditing = editingId === deck.id
            const stripe = index % 2 === 0 ? 'bg-slate-50/90' : 'bg-white'

            return (
              <li
                key={deck.id}
                className={[
                  'flex items-center gap-3 px-3 py-2',
                  stripe,
                  'dark:bg-slate-900/30',
                  index % 2 === 0 ? 'dark:bg-slate-900/60' : 'dark:bg-slate-950',
                ].join(' ')}
              >
                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-accent outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void saveRename(deck.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    className="min-w-0 flex-1 truncate text-left text-[13px] text-accent hover:underline disabled:opacity-50"
                    onClick={() => void startReview(deck.id)}
                  >
                    {deck.name}
                  </button>
                )}

                <div className="flex shrink-0 items-center gap-1" aria-label="Card counts">
                  <CountCell value={counts.new} />
                  <CountCell value={counts.review} />
                  <CountCell value={total} emphasis />
                </div>

                {isEditing ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      className="text-[13px] text-accent hover:underline"
                      onClick={() => void saveRename(deck.id)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-[13px] text-slate-500 hover:underline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <DeckActionsMenu
                    busy={busy}
                    deleteDisabled={!canDeleteDeck}
                    onReview={() => void startReview(deck.id)}
                    onRename={() => {
                      setEditingId(deck.id)
                      setEditingName(deck.name)
                    }}
                    onDelete={() =>
                      setDeleteTarget({ deck, cardCount: total })
                    }
                  />
                )}
              </li>
            )
          })
        )}
      </ul>

      {!creating ? (
        <p className="mt-3 px-3">
          <button
            type="button"
            className="text-[13px] text-accent hover:underline"
            onClick={() => setCreating(true)}
          >
            + Create deck
          </button>
        </p>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/30"
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
