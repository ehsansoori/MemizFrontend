import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BulkRegenerateProgressOverlay } from '@/components/decks/BulkRegenerateProgressOverlay'
import { BulkRegenerateWarningDialog } from '@/components/decks/BulkRegenerateWarningDialog'
import { DeckTemplateChangeChoiceDialog } from '@/components/decks/DeckTemplateChangeChoiceDialog'
import {
  applyTemplateToAllCards,
  type BulkRegenerateProgress,
} from '@/domain/bulkTemplateMigration'
import { freezeDeckCardSnapshots } from '@/domain/cardTemplateSnapshotMigration'
import { resolveDeckDefaultTemplateId } from '@/domain/resolveDeckTemplate'
import { getApiErrorMessage } from '@/services/api/getApiErrorMessage'
import { useToast } from '@/providers/toastContext'
import { useLibraryStore } from '@/store/library/libraryStore'
import type { Deck, SavedCard } from '@/types/cards'
import type { LanguageDeckSettings } from '@/types/deckProfile'

export type DeckTemplateChangeRequest = {
  newTemplateId: string
  languageSettings?: LanguageDeckSettings
  onComplete?: () => void
  /** Called when bulk regeneration starts so parent sheets can close. */
  onProcessingStart?: () => void
  /** Same template ID, definition edited — show apply dialog before persisting. */
  mode?: 'change' | 'update'
  /** Persists template edits after the user confirms (update mode only). */
  applyTemplateSave?: () => void | Promise<void>
  /** Called after "Only New Cards" / "Only This Card" succeeds (before onComplete). */
  onOnlyNewCardsComplete?: () => void | Promise<void>
  /** Override choice dialog copy (defaults from mode). */
  dialogVariant?: 'change' | 'update' | 'make_card' | 'edit_card'
}

type FlowPhase =
  | 'idle'
  | 'choice'
  | 'overwrite_warning'
  | 'processing'
  | 'completed'
  | 'failed'

export function useDeckTemplateChangeFlow(deck: Deck | undefined, deckCards: SavedCard[]) {
  const { showToast } = useToast()
  const updateDeckDefaultTemplate = useLibraryStore((s) => s.updateDeckDefaultTemplate)
  const updateDeckSettings = useLibraryStore((s) => s.updateDeckSettings)
  const reload = useLibraryStore((s) => s.reload)

  const [phase, setPhase] = useState<FlowPhase>('idle')
  const [pending, setPending] = useState<DeckTemplateChangeRequest | null>(null)
  const [progress, setProgress] = useState<BulkRegenerateProgress | null>(null)
  const [summary, setSummary] = useState<{ succeeded: number; failed: number } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [onlyNewBusy, setOnlyNewBusy] = useState(false)

  const mountedRef = useRef(true)
  const abortRef = useRef<AbortController | null>(null)
  const runSnapshotRef = useRef<{
    deck: Deck
    pending: DeckTemplateChangeRequest
    cards: SavedCard[]
    eligibleCount: number
  } | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  const safeSetPhase = useCallback((next: FlowPhase) => {
    if (mountedRef.current) setPhase(next)
  }, [])

  const safeSetProgress = useCallback((next: BulkRegenerateProgress) => {
    if (mountedRef.current) setProgress(next)
  }, [])

  const safeSetSummary = useCallback((next: { succeeded: number; failed: number } | null) => {
    if (mountedRef.current) setSummary(next)
  }, [])

  const safeSetError = useCallback((next: string | null) => {
    if (mountedRef.current) setErrorMessage(next)
  }, [])

  const currentTemplateId = useMemo(
    () => (deck ? resolveDeckDefaultTemplateId(deck) : ''),
    [deck],
  )

  const eligibleCardCount = useMemo(
    () => deckCards.filter((c) => (c.data.input ?? c.data.word ?? '').trim()).length,
    [deckCards],
  )

  const resetFlow = useCallback(() => {
    setPhase('idle')
    setPending(null)
    setProgress(null)
    setSummary(null)
    setErrorMessage(null)
    runSnapshotRef.current = null
  }, [])

  const applyLanguageSettings = useCallback(
    async (targetDeck: Deck, languageSettings?: LanguageDeckSettings) => {
      if (!languageSettings) return
      await updateDeckSettings(targetDeck.id, { language: languageSettings })
    },
    [updateDeckSettings],
  )

  const finishOnlyNewCards = useCallback(async () => {
    if (!deck || !pending || onlyNewBusy) return
    setOnlyNewBusy(true)
    try {
      const snapshotTemplateId =
        pending.mode === 'update'
          ? pending.newTemplateId
          : resolveDeckDefaultTemplateId(deck)
      await freezeDeckCardSnapshots(deck.id, snapshotTemplateId)
      if (pending.applyTemplateSave) {
        await pending.applyTemplateSave()
      }
      await applyLanguageSettings(deck, pending.languageSettings)
      if (pending.mode !== 'update') {
        await updateDeckDefaultTemplate(deck.id, pending.newTemplateId)
      }
      await reload()
      showToast(
        pending.mode === 'update'
          ? 'Template updated for new cards.'
          : 'Deck template updated for new cards.',
        'success',
      )
      await pending.onOnlyNewCardsComplete?.()
      pending.onComplete?.()
      resetFlow()
    } catch (e) {
      showToast(
        getApiErrorMessage(e, 'Could not update deck template.'),
        'error',
      )
    } finally {
      if (mountedRef.current) setOnlyNewBusy(false)
    }
  }, [
    deck,
    pending,
    onlyNewBusy,
    applyLanguageSettings,
    updateDeckDefaultTemplate,
    reload,
    showToast,
    resetFlow,
  ])

  const runBulkRegenerate = useCallback(async () => {
    if (!deck || !pending) return

    const templateId = pending.newTemplateId.trim()
    if (!templateId) {
      safeSetError('No template selected.')
      safeSetPhase('failed')
      return
    }

    const snapshot = {
      deck,
      pending,
      cards: deckCards,
      eligibleCount: eligibleCardCount,
    }
    runSnapshotRef.current = snapshot

    safeSetPhase('processing')
    safeSetProgress({
      phase: 'running',
      processed: 0,
      total: snapshot.eligibleCount,
      succeeded: 0,
      failed: 0,
    })
    safeSetSummary(null)
    safeSetError(null)
    snapshot.pending.onProcessingStart?.()

    const controller = new AbortController()
    abortRef.current = controller

    try {
      await freezeDeckCardSnapshots(snapshot.deck.id, templateId)
      if (snapshot.pending.applyTemplateSave) {
        await snapshot.pending.applyTemplateSave()
      }
      await applyLanguageSettings(snapshot.deck, snapshot.pending.languageSettings)
      const result = await applyTemplateToAllCards({
        deck: snapshot.deck,
        templateId,
        cards: snapshot.cards,
        signal: controller.signal,
        onProgress: safeSetProgress,
      })
      if (snapshot.pending.mode !== 'update') {
        await updateDeckDefaultTemplate(snapshot.deck.id, templateId)
      }
      await reload()
      safeSetSummary(result)
      snapshot.pending.onComplete?.()
      safeSetPhase('completed')
    } catch (e) {
      const message = getApiErrorMessage(e, 'Bulk regeneration failed.')
      safeSetError(message)
      safeSetPhase('failed')
      showToast(message, 'error')
    } finally {
      abortRef.current = null
    }
  }, [
    deck,
    pending,
    deckCards,
    eligibleCardCount,
    applyLanguageSettings,
    updateDeckDefaultTemplate,
    reload,
    showToast,
    safeSetPhase,
    safeSetProgress,
    safeSetSummary,
    safeSetError,
  ])

  const requestTemplateChange = useCallback(
    async (request: DeckTemplateChangeRequest) => {
      if (!deck) return false

      const trimmed = request.newTemplateId.trim()
      if (!trimmed) return false

      const isUpdate = request.mode === 'update'
      const templateChanged = trimmed !== currentTemplateId

      if (!templateChanged && !isUpdate) {
        if (request.languageSettings) {
          setOnlyNewBusy(true)
          try {
            await applyLanguageSettings(deck, request.languageSettings)
            await reload()
            showToast('Deck settings saved.', 'success')
            request.onComplete?.()
          } catch (e) {
            showToast(
              getApiErrorMessage(e, 'Could not save deck settings.'),
              'error',
            )
          } finally {
            if (mountedRef.current) setOnlyNewBusy(false)
          }
        } else {
          request.onComplete?.()
        }
        return true
      }

      setPending(request)
      setPhase('choice')
      return true
    },
    [deck, currentTemplateId, applyLanguageSettings, reload, showToast],
  )

  const cancelAll = useCallback(() => {
    if (phase === 'processing' || onlyNewBusy) return
    resetFlow()
  }, [phase, onlyNewBusy, resetFlow])

  const closeProgress = useCallback(() => {
    resetFlow()
  }, [resetFlow])

  const openOverwriteWarning = useCallback(() => {
    if (phase !== 'choice' || onlyNewBusy) return
    setPhase('overwrite_warning')
  }, [phase, onlyNewBusy])

  const cancelOverwriteWarning = useCallback(() => {
    if (phase !== 'overwrite_warning') return
    setPhase('choice')
  }, [phase])

  const confirmOverwriteWarning = useCallback(() => {
    if (phase !== 'overwrite_warning') return
    void runBulkRegenerate()
  }, [phase, runBulkRegenerate])

  const dialogBusy = onlyNewBusy

  const flowUi = (
    <>
      {phase === 'choice' ? (
        <DeckTemplateChangeChoiceDialog
          open
          busy={dialogBusy}
          variant={
            pending?.dialogVariant ??
            (pending?.mode === 'update' ? 'update' : 'change')
          }
          onApplyToAll={openOverwriteWarning}
          onOnlyNewCards={() => void finishOnlyNewCards()}
          onCancel={cancelAll}
        />
      ) : null}
      {phase === 'overwrite_warning' ? (
        <BulkRegenerateWarningDialog
          open
          busy={false}
          cardCount={eligibleCardCount}
          onCancel={cancelOverwriteWarning}
          onConfirm={confirmOverwriteWarning}
        />
      ) : null}
      {phase === 'processing' || phase === 'completed' || phase === 'failed' ? (
        <BulkRegenerateProgressOverlay
          phase={phase}
          progress={progress}
          summary={summary}
          errorMessage={errorMessage}
          onClose={closeProgress}
        />
      ) : null}
    </>
  )

  const busy =
    onlyNewBusy || phase === 'processing' || phase === 'overwrite_warning'

  return {
    busy,
    requestTemplateChange,
    flowUi,
  }
}
