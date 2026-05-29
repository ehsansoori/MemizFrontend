import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Deck } from '@/types/cards'
import {
  findInboxDeck,
  isInboxDeck,
  isReservedInboxName,
} from '@/domain/inboxDeck'
import { DeckCommitDeckRow } from '@/components/decks/DeckCommitDeckRow'
import { DeckDeleteDialog } from '@/components/decks/DeckDeleteDialog'
import { useToast } from '@/providers/toastContext'
import { useLibraryStore } from '@/store/library/libraryStore'
import type { DeleteDeckMode } from '@/store/library/deckManagement'
import type { CommitToDeckInput } from '@/store/library/types'

const RECENT_LIMIT = 4

function byLastUsed(a: Deck, b: Deck): number {
  const ta = a.lastUsedAt ?? a.updatedAt
  const tb = b.lastUsedAt ?? b.updatedAt
  return tb.localeCompare(ta)
}

function byName(a: Deck, b: Deck): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

type DeckCommitModalProps = {
  cardIds: string[] | null
  decks: Deck[]
  /** Pre-select active deck (falls back to Inbox). */
  defaultDeckId?: string | null
  onCommit: (input: CommitToDeckInput) => Promise<void>
  onClose: () => void
}

export function DeckCommitModal({
  cardIds,
  decks,
  defaultDeckId,
  onCommit,
  onClose,
}: DeckCommitModalProps) {
  const [saving, setSaving] = useState(false)
  const [deckBusy, setDeckBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [pendingNewDeckName, setPendingNewDeckName] = useState<string | null>(null)
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{
    deck: Deck
    cardCount: number
  } | null>(null)

  const { showToast } = useToast()
  const libraryCards = useLibraryStore((s) => s.cards)
  const renameDeck = useLibraryStore((s) => s.renameDeck)
  const deleteDeck = useLibraryStore((s) => s.deleteDeck)

  const cardCountByDeckId = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of libraryCards) {
      m.set(c.deckId, (m.get(c.deckId) ?? 0) + 1)
    }
    return m
  }, [libraryCards])

  const qTrim = query.trim()
  const qLower = qTrim.toLowerCase()
  const searching = qTrim.length > 0

  const inboxDeck = useMemo(() => findInboxDeck(decks), [decks])

  useEffect(() => {
    if (!cardIds?.length) return
    setQuery('')
    setPendingNewDeckName(null)
    setEditingDeckId(null)
    setDeleteTarget(null)
    const preferred =
      defaultDeckId && decks.some((d) => d.id === defaultDeckId)
        ? defaultDeckId
        : inboxDeck?.id ?? null
    setSelectedDeckId(preferred)
  }, [cardIds, defaultDeckId, decks, inboxDeck?.id])

  const hasExactDeckMatch = useMemo(
    () => decks.some((d) => d.name.toLowerCase() === qLower),
    [decks, qLower],
  )
  const blockCreateInboxDuplicate =
    inboxDeck != null && isReservedInboxName(qTrim)
  const showCreateRow =
    searching && !hasExactDeckMatch && !blockCreateInboxDuplicate

  const userDecks = useMemo(() => decks.filter((d) => !isInboxDeck(d)), [decks])
  const sortedUserByRecent = useMemo(
    () => [...userDecks].sort(byLastUsed),
    [userDecks],
  )

  const { recentDecks, otherDecks } = useMemo(() => {
    const recent = sortedUserByRecent.slice(0, RECENT_LIMIT)
    const recentIds = new Set(recent.map((d) => d.id))
    const others = sortedUserByRecent
      .filter((d) => !recentIds.has(d.id))
      .sort(byName)
    return { recentDecks: recent, otherDecks: others }
  }, [sortedUserByRecent])

  const filteredDecks = useMemo(() => {
    if (!searching) return []
    return decks
      .filter((d) => d.name.toLowerCase().includes(qLower))
      .sort((a, b) => {
        const aInbox = isInboxDeck(a) ? 0 : 1
        const bInbox = isInboxDeck(b) ? 0 : 1
        if (aInbox !== bInbox) return aInbox - bInbox
        return byLastUsed(a, b)
      })
  }, [decks, qLower, searching])

  const deckSelected = pendingNewDeckName == null && selectedDeckId != null
  const createSelected =
    pendingNewDeckName != null && pendingNewDeckName.toLowerCase() === qLower

  const rowBase =
    'flex w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-[border-color,background-color,box-shadow] duration-150'
  const rowSelected =
    'border-[color-mix(in_oklab,var(--color-accent)_60%,transparent)] bg-[color-mix(in_oklab,var(--color-accent)_18%,var(--color-surface-50))] shadow-[inset_3px_0_0_0_var(--color-accent)] dark:border-[color-mix(in_oklab,var(--color-accent)_55%,oklch(0.38_0.04_264))] dark:bg-[color-mix(in_oklab,var(--color-accent)_22%,oklch(0.2_0.03_264))] dark:shadow-[inset_3px_0_0_0_var(--color-accent)]'
  const rowIdle =
    'border-transparent bg-slate-50/50 hover:border-slate-200/70 hover:bg-slate-100/70 dark:bg-slate-800/25 dark:hover:border-slate-600/45 dark:hover:bg-slate-800/50'
  const rowInboxIdle =
    'border-slate-200/50 bg-slate-100/35 hover:border-slate-300/60 hover:bg-slate-100/55 dark:border-slate-600/40 dark:bg-slate-800/40 dark:hover:border-slate-500/50 dark:hover:bg-slate-800/55'
  const rowInboxSelected =
    'border-[color-mix(in_oklab,var(--color-accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-accent)_12%,var(--color-surface-100))] shadow-[inset_3px_0_0_0_var(--color-accent)] dark:border-[color-mix(in_oklab,var(--color-accent)_40%,oklch(0.38_0.04_264))] dark:bg-[color-mix(in_oklab,var(--color-accent)_18%,oklch(0.22_0.03_264))] dark:shadow-[inset_3px_0_0_0_var(--color-accent)]'

  const rowToneFor = useCallback(
    (d: Deck) => {
      const system = isInboxDeck(d)
      const selected = deckSelected && selectedDeckId === d.id
      if (system) return selected ? rowInboxSelected : rowInboxIdle
      return selected ? rowSelected : rowIdle
    },
    [deckSelected, selectedDeckId],
  )

  if (!cardIds || cardIds.length === 0) {
    return null
  }

  const count = cardIds.length
  const newNameCommit = pendingNewDeckName?.trim() ?? ''
  const effectiveDeckId = selectedDeckId ?? inboxDeck?.id ?? null
  const canSubmit =
    newNameCommit.length > 0 ||
    (effectiveDeckId != null && decks.some((d) => d.id === effectiveDeckId))

  const pickDeck = (id: string) => {
    if (editingDeckId) return
    setSelectedDeckId(id)
    setQuery('')
    setPendingNewDeckName(null)
  }

  const pickNewFromQuery = () => {
    setPendingNewDeckName(qTrim)
    setSelectedDeckId(null)
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setSelectedDeckId(null)
    setPendingNewDeckName(null)
    setEditingDeckId(null)
  }

  const handleCommit = async () => {
    if (!canSubmit || !cardIds || saving || deckBusy) return
    setSaving(true)
    try {
      if (newNameCommit) {
        await onCommit({ cardIds, newDeckName: newNameCommit })
      } else if (effectiveDeckId) {
        await onCommit({ cardIds, deckId: effectiveDeckId })
      }
      onClose()
    } catch {
      /* toast handled in provider */
    } finally {
      setSaving(false)
    }
  }

  const deckCardCount = (deckId: string) => cardCountByDeckId.get(deckId) ?? 0

  const startEdit = (d: Deck) => {
    setEditingDeckId(d.id)
    setEditingName(d.name)
  }

  const cancelEdit = () => {
    setEditingDeckId(null)
    setEditingName('')
  }

  const saveEdit = async () => {
    if (!editingDeckId) return
    setDeckBusy(true)
    try {
      await renameDeck(editingDeckId, editingName)
      showToast('Deck renamed.', 'success')
      cancelEdit()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not rename deck.', 'error')
    } finally {
      setDeckBusy(false)
    }
  }

  const confirmDelete = async (mode: DeleteDeckMode) => {
    if (!deleteTarget) return
    const { deck } = deleteTarget
    setDeckBusy(true)
    try {
      await deleteDeck(deck.id, mode)
      if (selectedDeckId === deck.id) {
        setSelectedDeckId(inboxDeck?.id ?? null)
      }
      if (editingDeckId === deck.id) cancelEdit()
      showToast(
        mode === 'moveToInbox'
          ? `Deck deleted. Cards moved to ${inboxDeck?.name ?? 'Inbox'}.`
          : 'Deck and its cards deleted.',
        'success',
      )
      setDeleteTarget(null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not delete deck.', 'error')
    } finally {
      setDeckBusy(false)
    }
  }

  const renderDeckRow = (d: Deck) => (
    <DeckCommitDeckRow
      key={d.id}
      deck={d}
      cardCount={deckCardCount(d.id)}
      selected={deckSelected && selectedDeckId === d.id}
      isEditing={editingDeckId === d.id}
      editValue={editingDeckId === d.id ? editingName : d.name}
      rowTone={rowToneFor(d)}
      onSelect={() => pickDeck(d.id)}
      onStartEdit={() => startEdit(d)}
      onEditChange={setEditingName}
      onSaveEdit={() => void saveEdit()}
      onCancelEdit={cancelEdit}
      onRequestDelete={() =>
        setDeleteTarget({ deck: d, cardCount: deckCardCount(d.id) })
      }
    />
  )

  const renderCreateRow = () => (
    <li>
      <button
        type="button"
        aria-pressed={createSelected}
        onClick={pickNewFromQuery}
        className={[
          rowBase,
          createSelected
            ? rowSelected
            : 'border-dashed border-slate-300/70 bg-transparent hover:border-slate-400/80 hover:bg-slate-50/50 dark:border-slate-600/45 dark:hover:border-slate-500/55 dark:hover:bg-slate-800/35',
        ].join(' ')}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-300/90 text-[13px] font-semibold leading-none text-slate-500 dark:border-slate-600 dark:text-slate-400">
          +
        </span>
        <span className="min-w-0 flex-1 text-[13px] text-slate-600 dark:text-slate-300">
          Create{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            &quot;{qTrim}&quot;
          </span>
        </span>
      </button>
    </li>
  )

  const showEmptyLibrary = !searching && decks.length === 0
  const modalBusy = saving || deckBusy

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-5">
      <button
        type="button"
        className="deck-commit-backdrop-animate absolute inset-0 bg-slate-950/35 backdrop-blur-[3px] dark:bg-black/45"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-commit-title"
        className="deck-commit-panel-animate relative z-[101] flex max-h-[min(80vh,19.5rem)] w-full max-w-[21rem] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)] ring-1 ring-slate-900/[0.04] dark:border-slate-700/70 dark:bg-slate-900 dark:shadow-[var(--shadow-card-dark)] dark:ring-white/[0.04]"
      >
        {deleteTarget ? (
          <DeckDeleteDialog
            deck={deleteTarget.deck}
            cardCount={deleteTarget.cardCount}
            inboxName={inboxDeck?.name ?? 'Inbox'}
            busy={deckBusy}
            onClose={() => !deckBusy && setDeleteTarget(null)}
            onConfirm={(mode) => void confirmDelete(mode)}
          />
        ) : null}

        <header className="shrink-0 border-b border-slate-100/90 px-4 pb-3 pt-3.5 dark:border-slate-800/90">
          <h2
            id="deck-commit-title"
            className="font-display text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50"
          >
            Save to deck
          </h2>
          <p className="mt-0.5 text-[12px] leading-snug text-slate-500 dark:text-slate-400/90">
            {count === 1
              ? 'Choose a deck, or type a new name.'
              : `Choose a deck for ${count} cards, or type a new name.`}
          </p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col px-4 pb-2.5 pt-3.5">
          <label className="block shrink-0">
            <span className="sr-only">Search decks</span>
            <input
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search or create a deck…"
              autoFocus={!editingDeckId && !deleteTarget}
              disabled={modalBusy}
              className="w-full rounded-lg border border-slate-200/90 bg-slate-50/90 px-3 py-2 text-[13px] text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400/90 focus:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-surface-300))] focus:bg-white focus:shadow-[0_0_0_2px_var(--color-accent-muted)] disabled:opacity-50 dark:border-slate-700/80 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[color-mix(in_oklab,var(--color-accent)_40%,oklch(0.35_0.03_264))] dark:focus:bg-slate-950/80"
            />
          </label>

          <div className="scrollbar-deck-commit mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {showEmptyLibrary ? (
              <div className="px-1 py-6 text-center">
                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
                  No decks yet
                </p>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-500">
                  Create your first deck
                </p>
              </div>
            ) : null}

            {searching ? (
              <div className="space-y-2">
                {filteredDecks.length > 0 ? (
                  <>
                    {renderSectionLabel('Matching decks')}
                    <ul className="space-y-1" role="listbox">
                      {filteredDecks.map((d) => renderDeckRow(d))}
                    </ul>
                  </>
                ) : null}
                {showCreateRow ? <ul className="space-y-1">{renderCreateRow()}</ul> : null}
              </div>
            ) : null}

            {!searching && decks.length > 0 ? (
              <div className="space-y-3">
                {inboxDeck ? (
                  <div>
                    {renderSectionLabel('Default')}
                    <ul className="space-y-1" role="listbox">
                      {renderDeckRow(inboxDeck)}
                    </ul>
                  </div>
                ) : null}
                {recentDecks.length > 0 ? (
                  <div>
                    {renderSectionLabel('Recent')}
                    <ul className="space-y-1" role="listbox">
                      {recentDecks.map((d) => renderDeckRow(d))}
                    </ul>
                  </div>
                ) : null}
                {otherDecks.length > 0 ? (
                  <div>
                    {renderSectionLabel('All decks')}
                    <ul className="space-y-1" role="listbox">
                      {otherDecks.map((d) => renderDeckRow(d))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100/90 bg-slate-50/30 px-4 py-2.5 dark:border-slate-800/90 dark:bg-slate-950/30">
          <button
            type="button"
            onClick={onClose}
            disabled={modalBusy}
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-200/40 hover:text-slate-800 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit || modalBusy}
            onClick={() => void handleCommit()}
            className="rounded-lg bg-[var(--color-accent)] px-3.5 py-1.5 text-[13px] font-semibold text-white transition-[background-color,opacity] duration-150 hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-25"
          >
            Save
          </button>
        </footer>
      </div>
    </div>
  )

  function renderSectionLabel(label: string) {
    return (
      <p className="px-0.5 pb-2 pt-1 text-[10px] font-semibold tracking-[0.08em] text-slate-400 uppercase dark:text-slate-500">
        {label}
      </p>
    )
  }
}
