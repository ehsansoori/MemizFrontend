import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AiGenerationSettingsSheet } from '@/components/addCards/AiGenerationSettingsSheet'
import { AiSettingsLink } from '@/components/addCards/AiSettingsLink'
import { CardEditorActions } from '@/components/addCards/CardEditorActions'
import { CardPreviewDivider } from '@/components/addCards/CardPreviewDivider'
import { CardTemplatePickerLine } from '@/components/addCards/CardTemplatePickerLine'
import { CardWordInputBar } from '@/components/addCards/CardWordInputBar'
import { InvalidInputSuggestions } from '@/components/addCards/InvalidInputSuggestions'
import { RegenerateCardDialog } from '@/components/addCards/RegenerateCardDialog'
import { TemplateBuilderSheet } from '@/components/addCards/TemplateBuilderSheet'
import { TemplateSelectionSheet } from '@/components/addCards/TemplateSelectionSheet'
import { ActiveDeckSelector } from '@/components/layout/ActiveDeckSelector'
import { FlashcardPreviewEditor } from '@/components/cardDisplay/FlashcardPreviewEditor'
import {
  draftToCardData,
  draftToFrontBack,
  savedCardToDraft,
  type CardDraft,
} from '@/domain/cardDraft'
import {
  createDefaultLanguageSettings,
  resolveLanguageSettings,
} from '@/domain/deckSettings'
import {
  clearEditCardSourceContext,
  parseEditCardSourceContext,
  resolveEditCardReturnUrl,
} from '@/domain/editCardNavigation'
import { stampGenerationMetadata } from '@/domain/cardGenerationMetadata'
import { stampCardTemplateSnapshot } from '@/domain/cardTemplateSnapshot'
import { isLanguageDefaultTemplate } from '@/domain/cardTemplates'
import { deckHasOtherCardsUsingTemplate } from '@/domain/deckTemplateUsage'
import {
  resolveCardTemplate,
  resolveDeckDefaultTemplateId,
  resolveSavedCardTemplate,
  resolveSavedCardTemplateId,
} from '@/domain/resolveDeckTemplate'
import { resetTemplateToDefault, saveTemplateFromBuilder } from '@/domain/templatePersistence'
import { templateSupportsAiGeneration } from '@/domain/templateGeneration'
import { useCardAiGenerate } from '@/hooks/cards/useCardAiGenerate'
import { useDeckTemplateChangeFlow } from '@/hooks/decks/useDeckTemplateChangeFlow'
import { useToast } from '@/providers/toastContext'
import { customTemplateRepository } from '@/storage/customTemplateRepository'
import { storage } from '@/storage/adapter'
import { useLayoutDispatch } from '@/store/generatedSession/reviewHooks'
import { useLibraryStore } from '@/store/library/libraryStore'
import type { SavedCard } from '@/types/cards'
import type { CardTemplate } from '@/types/deckProfile'

type EditCardEditorProps = {
  card: SavedCard
  returnUrl: string
  sourceDeckId: string | undefined
  onFinish: (cardMoved: boolean) => void
}

function EditCardEditor({ card, returnUrl, sourceDeckId, onFinish }: EditCardEditorProps) {
  const navigate = useNavigate()
  const { cardId } = useParams<{ cardId: string }>()
  const { setLayouts } = useLayoutDispatch()
  const { showToast } = useToast()

  const decks = useLibraryStore((s) => s.decks)
  const allCards = useLibraryStore((s) => s.cards)
  const activeDeckId = useLibraryStore((s) => s.activeDeckId)
  const reload = useLibraryStore((s) => s.reload)

  const activeDeck = useMemo(
    () => decks.find((d) => d.id === activeDeckId),
    [decks, activeDeckId],
  )
  const activeDeckCards = useMemo(
    () => (activeDeckId ? allCards.filter((c) => c.deckId === activeDeckId) : []),
    [allCards, activeDeckId],
  )
  const { busy: templateChangeBusy, requestTemplateChange, flowUi } =
    useDeckTemplateChangeFlow(activeDeck, activeDeckCards)
  const activeDeckName = activeDeck?.name ?? 'selected deck'
  const deckDefaultTemplateId = useMemo(
    () => resolveDeckDefaultTemplateId(activeDeck),
    [activeDeck],
  )

  const [cardTemplateId, setCardTemplateId] = useState(() => resolveSavedCardTemplateId(card))
  const [cardTemplate, setCardTemplate] = useState<CardTemplate>(() => resolveSavedCardTemplate(card))
  const [templatesRefreshKey, setTemplatesRefreshKey] = useState(0)

  const languageSettings = useMemo(
    () => resolveLanguageSettings(activeDeck) ?? createDefaultLanguageSettings(),
    [activeDeck],
  )

  const showAiFeatures = useMemo(
    () => templateSupportsAiGeneration(cardTemplate),
    [cardTemplate],
  )

  const [draft, setDraft] = useState<CardDraft>(() => savedCardToDraft(card, resolveSavedCardTemplate(card)))
  const [saveBusy, setSaveBusy] = useState(false)
  const [aiRegenerated, setAiRegenerated] = useState(false)
  const [templateSheetOpen, setTemplateSheetOpen] = useState(false)
  const [templateBuilderOpen, setTemplateBuilderOpen] = useState(false)
  const [templateBuilderMode, setTemplateBuilderMode] = useState<'create' | 'edit'>('edit')
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const editingTemplate = useMemo(
    () => (editingTemplateId ? resolveCardTemplate(editingTemplateId) : null),
    [editingTemplateId, templatesRefreshKey],
  )

  const pendingTemplateRegenRef = useRef<string | null>(null)

  const {
    isGenerating,
    invalidInput,
    setInvalidInput,
    formError,
    runGenerate,
    regenerateDialogOpen,
    confirmRegenerate,
    dismissRegenerateDialog,
    aiSettings,
  } = useCardAiGenerate({
    cardTemplate,
    templateId: cardTemplateId,
    languageSettings,
    draft,
    setDraft,
    confirmBeforeReplace: true,
    generatedToastMessage: 'Card updated — review and edit as needed.',
    onGenerated: () => setAiRegenerated(true),
  })

  const busy = isGenerating || saveBusy || templateChangeBusy

  useEffect(() => {
    setLayouts(cardTemplate.frontLayout, cardTemplate.backLayout)
  }, [cardTemplate, setLayouts])

  useEffect(() => {
    const template = resolveSavedCardTemplate(card)
    setCardTemplate(template)
    setCardTemplateId(resolveSavedCardTemplateId(card))
    setDraft(savedCardToDraft(card, template))
    setAiRegenerated(false)
  }, [card])

  useEffect(() => {
    const pendingId = pendingTemplateRegenRef.current
    if (!pendingId || pendingId !== cardTemplateId) return
    pendingTemplateRegenRef.current = null
    runGenerate(undefined, { skipConfirm: true })
  }, [cardTemplateId, runGenerate])

  const handleDraftChange = useCallback(
    (next: CardDraft) => {
      setDraft(next)
      setInvalidInput(null)
    },
    [setInvalidInput],
  )

  const cancelEdit = useCallback(() => {
    if (cardId) clearEditCardSourceContext(cardId)
    navigate(returnUrl)
  }, [cardId, navigate, returnUrl])

  const saveCard = async () => {
    if (!activeDeckId) return
    const { front, back } = draftToFrontBack(cardTemplate, draft)
    if (!front || !back) {
      showToast('Fill in required fields.', 'error')
      return
    }
    setSaveBusy(true)
    try {
      const data = draftToCardData(cardTemplate, draft)
      let saved = stampCardTemplateSnapshot(
        {
          ...card,
          deckId: activeDeckId,
          front,
          back,
          data,
          updatedAt: new Date().toISOString(),
        },
        cardTemplate,
      )
      if (aiRegenerated) {
        saved = stampGenerationMetadata(saved)
      }
      await storage.cards.put(saved)
      await reload()
      const cardMoved = activeDeckId !== sourceDeckId
      showToast(`Card saved to ${activeDeckName}.`, 'success')
      onFinish(cardMoved)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not save card.', 'error')
    } finally {
      setSaveBusy(false)
    }
  }

  const handleTemplateChange = useCallback(
    (templateId: string) => {
      if (templateId === cardTemplateId) {
        setTemplateSheetOpen(false)
        return
      }
      pendingTemplateRegenRef.current = templateId
      setCardTemplateId(templateId)
      setCardTemplate(resolveCardTemplate(templateId))
      setAiRegenerated(true)
      setTemplateSheetOpen(false)
    },
    [cardTemplateId],
  )

  const openEditTemplate = useCallback((templateId: string) => {
    setTemplateSheetOpen(false)
    setTemplateBuilderMode('edit')
    setEditingTemplateId(templateId)
    setTemplateBuilderOpen(true)
  }, [])

  const openCreateTemplate = useCallback(() => {
    setTemplateSheetOpen(false)
    setTemplateBuilderMode('create')
    setEditingTemplateId(null)
    setTemplateBuilderOpen(true)
  }, [])

  const applyUpdatedTemplateToCurrentCard = useCallback((effectiveId: string) => {
    const template = resolveCardTemplate(effectiveId)
    setCardTemplate(template)
    setCardTemplateId(effectiveId)
    setAiRegenerated(true)
    pendingTemplateRegenRef.current = effectiveId
  }, [])

  const requestTemplateModification = useCallback(
    (effectiveId: string, applySave: () => void, onDone: () => void) => {
      if (
        !activeDeckId ||
        !deckHasOtherCardsUsingTemplate(allCards, activeDeckId, effectiveId, card.id)
      ) {
        applySave()
        onDone()
        return
      }
      void requestTemplateChange({
        newTemplateId: effectiveId,
        mode: 'update',
        dialogVariant: 'edit_card',
        applyTemplateSave: applySave,
        onProcessingStart: () => setTemplateBuilderOpen(false),
        onComplete: onDone,
        onOnlyNewCardsComplete: () => applyUpdatedTemplateToCurrentCard(effectiveId),
      })
    },
    [
      activeDeckId,
      allCards,
      card.id,
      requestTemplateChange,
      applyUpdatedTemplateToCurrentCard,
    ],
  )

  const handleTemplateSaved = (
    name: string,
    fields: Parameters<typeof saveTemplateFromBuilder>[1],
    templateId?: string,
  ) => {
    if (templateBuilderMode === 'create') {
      try {
        const saved = saveTemplateFromBuilder(name, fields, templateId)
        setTemplatesRefreshKey((k) => k + 1)
        setTemplateBuilderOpen(false)
        setEditingTemplateId(null)
        setTemplateBuilderMode('edit')
        showToast(`Template “${name}” saved.`, 'success')
        handleTemplateChange(saved.id)
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Could not save template.', 'error')
      }
      return
    }

    const effectiveId = (templateId ?? editingTemplateId ?? '').trim()
    if (!effectiveId) return

    const finishBuilder = () => {
      setTemplateBuilderOpen(false)
      setEditingTemplateId(null)
      showToast(`Template “${name}” saved.`, 'success')
    }

    const applySave = () => {
      saveTemplateFromBuilder(name, fields, effectiveId)
    }

    try {
      requestTemplateModification(effectiveId, applySave, () => {
        setTemplatesRefreshKey((k) => k + 1)
        finishBuilder()
        if (
          !activeDeckId ||
          !deckHasOtherCardsUsingTemplate(allCards, activeDeckId, effectiveId, card.id)
        ) {
          applyUpdatedTemplateToCurrentCard(effectiveId)
        }
      })
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not save template.', 'error')
    }
  }

  const handleResetLanguageDefault = () => {
    if (!editingTemplateId) return
    const effectiveId = editingTemplateId

    const finishBuilder = () => {
      setTemplateBuilderOpen(false)
      setEditingTemplateId(null)
      showToast('Basic Language Template reset.', 'success')
    }

    const applySave = () => {
      resetTemplateToDefault(editingTemplateId)
    }

    requestTemplateModification(effectiveId, applySave, () => {
      setTemplatesRefreshKey((k) => k + 1)
      finishBuilder()
      if (
        !activeDeckId ||
        !deckHasOtherCardsUsingTemplate(allCards, activeDeckId, effectiveId, card.id)
      ) {
        applyUpdatedTemplateToCurrentCard(effectiveId)
      }
    })
  }

  const handleDeleteTemplate = (templateId: string) => {
    const template = resolveCardTemplate(templateId)
    if (template.isBuiltin) return
    if (!window.confirm(`Delete template “${template.name}”?`)) return
    customTemplateRepository.delete(templateId)
    setTemplatesRefreshKey((k) => k + 1)
    if (cardTemplateId === templateId) {
      const nextId = deckDefaultTemplateId
      setCardTemplateId(nextId)
      setCardTemplate(resolveCardTemplate(nextId))
    }
    showToast(`Template “${template.name}” deleted.`, 'success')
  }

  const aiGenerate = showAiFeatures
    ? {
        onClick: () => runGenerate(),
        busy: isGenerating,
        disabled: busy,
      }
    : undefined

  return (
    <main className="mx-auto w-full max-w-lg px-4 pb-8 pt-3 sm:px-6">
      <header className="mb-3">
        <div className="mb-2 flex min-w-0 items-center gap-2">
          <Link
            to={returnUrl}
            onClick={() => {
              if (cardId) clearEditCardSourceContext(cardId)
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition active:scale-95 dark:border-slate-700 dark:text-slate-300"
            aria-label="Back"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="min-w-0 text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
            Edit Card
          </h1>
        </div>
        <ActiveDeckSelector variant="field" />
      </header>

      <section className="space-y-3">
        <CardWordInputBar
          draft={draft}
          onChange={handleDraftChange}
          disabled={busy}
          aiGenerate={aiGenerate}
        />

        {invalidInput ? (
          <InvalidInputSuggestions
            suggestions={invalidInput.suggestions}
            busy={isGenerating}
            onSuggestion={(suggestion) => {
              setDraft((prev) => ({ ...prev, data: { ...prev.data, input: suggestion } }))
              runGenerate(suggestion, { skipConfirm: true })
            }}
          />
        ) : null}

        {showAiFeatures ? (
          <AiSettingsLink
            onClick={() => aiSettings.setAiSheetOpen(true)}
            disabled={busy}
          />
        ) : null}

        <CardTemplatePickerLine
          templateName={cardTemplate.name}
          onChangeClick={() => setTemplateSheetOpen(true)}
          disabled={busy}
        />

        <CardPreviewDivider />

        <FlashcardPreviewEditor
          template={cardTemplate}
          draft={draft}
          onChange={handleDraftChange}
          disabled={busy}
        />

        <CardEditorActions
          showSaveCancel
          onSave={() => void saveCard()}
          onCancel={cancelEdit}
          saveBusy={saveBusy}
          busy={busy}
          cancelLabel="Cancel"
        />

        {formError ? (
          <p className="text-[13px] text-red-600" role="alert">
            {formError}
          </p>
        ) : null}
      </section>

      <RegenerateCardDialog
        open={regenerateDialogOpen}
        busy={isGenerating}
        onCancel={dismissRegenerateDialog}
        onConfirm={confirmRegenerate}
      />

      <TemplateSelectionSheet
        open={templateSheetOpen}
        busy={busy}
        value={cardTemplateId}
        refreshKey={templatesRefreshKey}
        onClose={() => setTemplateSheetOpen(false)}
        onSelect={handleTemplateChange}
        onCreateTemplate={openCreateTemplate}
        onEditTemplate={openEditTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />

      <TemplateBuilderSheet
        open={templateBuilderOpen}
        busy={busy}
        mode={templateBuilderMode}
        initialTemplate={templateBuilderMode === 'edit' ? editingTemplate : null}
        lockTemplateName={
          editingTemplateId != null && isLanguageDefaultTemplate(editingTemplateId)
        }
        showResetToDefault={
          editingTemplateId != null && isLanguageDefaultTemplate(editingTemplateId)
        }
        onResetToDefault={handleResetLanguageDefault}
        onClose={() => {
          setTemplateBuilderOpen(false)
          setEditingTemplateId(null)
          setTemplateBuilderMode('edit')
        }}
        onSave={handleTemplateSaved}
      />

      <AiGenerationSettingsSheet
        open={aiSettings.aiSheetOpen}
        onClose={() => aiSettings.setAiSheetOpen(false)}
        busy={busy}
        difficulty={aiSettings.effectiveDifficulty}
        tone={aiSettings.effectiveTone}
        deckDifficulty={languageSettings.difficulty}
        deckTone={languageSettings.tone}
        onDifficultyChange={aiSettings.handleAiDifficultyChange}
        onToneChange={aiSettings.handleAiToneChange}
      />

      {flowUi}
    </main>
  )
}

export function EditCardPageInner() {
  const { deckId, cardId } = useParams<{ deckId: string; cardId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const allCards = useLibraryStore((s) => s.cards)
  const hydrated = useLibraryStore((s) => s.hydrated)
  const activeDeckId = useLibraryStore((s) => s.activeDeckId)
  const setActiveDeckId = useLibraryStore((s) => s.setActiveDeckId)

  const sourceContext = useMemo(
    () => parseEditCardSourceContext(cardId, searchParams, deckId),
    [cardId, searchParams, deckId],
  )

  const card = useMemo(() => {
    if (!cardId) return undefined
    return allCards.find((c) => c.id === cardId)
  }, [allCards, cardId])

  const returnUrl = useMemo(() => {
    const fallbackDeckId = sourceContext?.sourceDeckId ?? deckId ?? card?.deckId ?? ''
    if (!fallbackDeckId) return '/decks'
    return resolveEditCardReturnUrl(sourceContext, fallbackDeckId)
  }, [sourceContext, deckId, card?.deckId])

  const sourceDeckId = sourceContext?.sourceDeckId ?? deckId ?? card?.deckId

  const finishEditNavigation = useCallback(
    (cardMoved: boolean) => {
      if (!sourceDeckId) {
        navigate('/decks')
        return
      }
      navigate(resolveEditCardReturnUrl(sourceContext, sourceDeckId, { cardMoved }))
      if (cardId) clearEditCardSourceContext(cardId)
    },
    [navigate, sourceContext, sourceDeckId, cardId],
  )

  useEffect(() => {
    if (!card) return
    void setActiveDeckId(card.deckId)
  }, [card?.id, card?.deckId, setActiveDeckId])

  if (hydrated && !card) {
    const fallbackDeckId = sourceDeckId ?? deckId ?? activeDeckId
    return (
      <Navigate
        to={fallbackDeckId ? resolveEditCardReturnUrl(sourceContext, fallbackDeckId) : '/decks'}
        replace
      />
    )
  }

  if (!card) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <p className="text-center text-[14px] text-slate-500">Loading card…</p>
      </main>
    )
  }

  return (
    <EditCardEditor
      key={card.id}
      card={card}
      returnUrl={returnUrl}
      sourceDeckId={sourceDeckId}
      onFinish={finishEditNavigation}
    />
  )
}

export function EditCardPage() {
  return <EditCardPageInner />
}
