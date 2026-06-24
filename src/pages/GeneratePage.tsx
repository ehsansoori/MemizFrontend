import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AiGenerationSettingsSheet } from '@/components/addCards/AiGenerationSettingsSheet'
import { AiSettingsLink } from '@/components/addCards/AiSettingsLink'
import { CardEditorActions } from '@/components/addCards/CardEditorActions'
import { CardPreviewDivider } from '@/components/addCards/CardPreviewDivider'
import { CardTemplatePickerLine } from '@/components/addCards/CardTemplatePickerLine'
import { CardWordInputBar } from '@/components/addCards/CardWordInputBar'
import { DiscardGeneratedDialog } from '@/components/addCards/DiscardGeneratedDialog'
import { TemplateBuilderSheet } from '@/components/addCards/TemplateBuilderSheet'
import { TemplateSelectionSheet } from '@/components/addCards/TemplateSelectionSheet'
import { ActiveDeckSelector } from '@/components/layout/ActiveDeckSelector'
import { FlashcardPreviewEditor } from '@/components/cardDisplay/FlashcardPreviewEditor'
import { InvalidInputSuggestions } from '@/components/addCards/InvalidInputSuggestions'
import { isLanguageDefaultTemplate } from '@/domain/cardTemplates'
import {
  draftToCardData,
  draftToFrontBack,
  discardGeneratedDraft,
  emptyCardDraft,
  generatedCardToDraft,
  type CardDraft,
} from '@/domain/cardDraft'
import { confirmDiscardGenerated } from '@/domain/confirmDiscard'
import { stampGenerationMetadata } from '@/domain/cardGenerationMetadata'
import { stampCardTemplateSnapshot } from '@/domain/cardTemplateSnapshot'
import {
  createDefaultLanguageSettings,
  languageSettingsToGenerationOptions,
  resolveLanguageSettings,
} from '@/domain/deckSettings'
import { invalidInputFromGeneratedCard, type InvalidInputState } from '@/domain/generateInvalidInput'
import { deckHasOtherCardsUsingTemplate } from '@/domain/deckTemplateUsage'
import {
  resolveCardTemplate,
  resolveDeckDefaultTemplateId,
} from '@/domain/resolveDeckTemplate'
import { createDefaultStudyProgress } from '@/domain/studyDefaults'
import { resetTemplateToDefault, saveTemplateFromBuilder } from '@/domain/templatePersistence'
import { useDeckTemplateChangeFlow } from '@/hooks/decks/useDeckTemplateChangeFlow'
import {
  isGenerateMutationAbort,
  useGenerateCardsMutation,
} from '@/hooks/cards/useGenerateCardsMutation'
import { useUnsavedGeneratedGuard } from '@/hooks/useUnsavedGeneratedGuard'
import { useToast } from '@/providers/toastContext'
import { getApiErrorMessage } from '@/services/api/getApiErrorMessage'
import { customTemplateRepository } from '@/storage/customTemplateRepository'
import { storage } from '@/storage/adapter'
import { useLayoutDispatch } from '@/store/generatedSession/reviewHooks'
import { useLibraryStore } from '@/store/library/libraryStore'
import type { DifficultyOption, GenerateCardsFormDto, SavedCard, ToneOption } from '@/types/cards'

export function GeneratePageInner() {
  const { setLayouts } = useLayoutDispatch()
  const { showToast } = useToast()
  const generateMutation = useGenerateCardsMutation()

  const activeDeckId = useLibraryStore((s) => s.activeDeckId)
  const decks = useLibraryStore((s) => s.decks)
  const allCards = useLibraryStore((s) => s.cards)
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
  const activeDeckName = activeDeck?.name ?? 'active deck'
  const deckDefaultTemplateId = useMemo(
    () => resolveDeckDefaultTemplateId(activeDeck),
    [activeDeck],
  )

  const [cardTemplateId, setCardTemplateId] = useState(deckDefaultTemplateId)

  useEffect(() => {
    setCardTemplateId(deckDefaultTemplateId)
  }, [deckDefaultTemplateId, activeDeckId])

  const [templatesRefreshKey, setTemplatesRefreshKey] = useState(0)
  const cardTemplate = useMemo(
    () => resolveCardTemplate(cardTemplateId),
    [cardTemplateId, templatesRefreshKey],
  )

  const [templateSheetOpen, setTemplateSheetOpen] = useState(false)
  const [templateBuilderOpen, setTemplateBuilderOpen] = useState(false)
  const [templateBuilderMode, setTemplateBuilderMode] = useState<'create' | 'edit'>('edit')
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const editingTemplate = useMemo(
    () => (editingTemplateId ? resolveCardTemplate(editingTemplateId) : null),
    [editingTemplateId, templatesRefreshKey],
  )
  const languageSettings = useMemo(
    () => resolveLanguageSettings(activeDeck) ?? createDefaultLanguageSettings(),
    [activeDeck],
  )

  const [aiSheetOpen, setAiSheetOpen] = useState(false)
  const [aiDifficultyOverride, setAiDifficultyOverride] = useState<DifficultyOption | null>(null)
  const [aiToneOverride, setAiToneOverride] = useState<ToneOption | null>(null)

  const [draft, setDraft] = useState<CardDraft>(() => emptyCardDraft(cardTemplate))
  const [invalidInput, setInvalidInput] = useState<InvalidInputState | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [saveBusy, setSaveBusy] = useState(false)

  const hasUnsavedGenerated = hasGenerated && !invalidInput
  const hasUnsavedRef = useRef(hasUnsavedGenerated)
  hasUnsavedRef.current = hasUnsavedGenerated

  const { leavePromptOpen, dismissLeave, confirmLeave } = useUnsavedGeneratedGuard({
    enabled: hasUnsavedGenerated,
  })

  const isGenerating = generateMutation.isPending
  const busy = isGenerating || saveBusy || templateChangeBusy

  const effectiveDifficulty = aiDifficultyOverride ?? languageSettings.difficulty
  const effectiveTone = aiToneOverride ?? languageSettings.tone

  useEffect(() => {
    setLayouts(cardTemplate.frontLayout, cardTemplate.backLayout)
  }, [cardTemplate, setLayouts])

  const resetToInputMode = useCallback(
    (preserveInput?: string) => {
      const next = emptyCardDraft(cardTemplate)
      if (preserveInput !== undefined) {
        next.data.input = preserveInput
      }
      setDraft(next)
      setInvalidInput(null)
      setHasGenerated(false)
      setFormError(null)
    },
    [cardTemplate],
  )

  const guardDiscard = useCallback((): boolean => {
    if (!hasUnsavedRef.current) return true
    if (!confirmDiscardGenerated()) return false
    setHasGenerated(false)
    setDraft((current) => discardGeneratedDraft(current, cardTemplate))
    return true
  }, [cardTemplate])

  const cancelGenerated = useCallback(() => {
    setDraft((current) => discardGeneratedDraft(current, cardTemplate))
    setHasGenerated(false)
    setFormError(null)
  }, [cardTemplate])

  useEffect(() => {
    if (hasUnsavedRef.current) return
    resetToInputMode()
    setAiDifficultyOverride(null)
    setAiToneOverride(null)
  }, [cardTemplateId, activeDeckId, templatesRefreshKey, resetToInputMode])

  const buildGenerateForm = useCallback(
    (inputOverride?: string): GenerateCardsFormDto => {
      const input = (inputOverride ?? draft.data.input).trim()
      const baseOptions = languageSettingsToGenerationOptions(languageSettings, cardTemplate)
      return {
        input,
        sourceLanguage: languageSettings.sourceLanguage,
        targetLanguage: languageSettings.targetLanguage,
        options: {
          ...baseOptions,
          difficulty: effectiveDifficulty,
          tone: effectiveTone,
        },
      }
    },
    [draft.data.input, languageSettings, cardTemplate, effectiveDifficulty, effectiveTone],
  )

  const handleDraftChange = useCallback(
    (next: CardDraft) => {
      setDraft(next)
      setInvalidInput(null)
    },
    [],
  )

  const runGenerate = useCallback(
    (inputOverride?: string) => {
      const input = (inputOverride ?? draft.data.input).trim()
      if (!input) {
        showToast('Enter a word or phrase first.', 'error')
        return
      }

      if (hasUnsavedRef.current && !confirmDiscardGenerated()) return

      setFormError(null)
      setInvalidInput(null)
      generateMutation.mutate(
        {
          form: buildGenerateForm(input),
          layout: {
            frontLayout: cardTemplate.frontLayout,
            backLayout: cardTemplate.backLayout,
          },
          templateId: cardTemplateId,
        },
        {
          onSuccess: ({ cards }) => {
            const card = cards[0]
            if (!card) return
            const invalid = invalidInputFromGeneratedCard(card)
            if (invalid) {
              setInvalidInput(invalid)
              setHasGenerated(false)
              setDraft((prev) => ({
                ...prev,
                data: { ...prev.data, input: invalid.originalWord },
              }))
              return
            }
            setInvalidInput(null)
            setHasGenerated(true)
            setDraft(generatedCardToDraft(card.data, cardTemplate))
            showToast('Card ready — tap any field to edit.', 'success')
          },
          onError: (err) => {
            if (isGenerateMutationAbort(err)) return
            const message = getApiErrorMessage(err)
            setFormError(message)
            showToast(message, 'error')
          },
        },
      )
    },
    [
      draft.data.input,
      generateMutation,
      buildGenerateForm,
      cardTemplate,
      cardTemplateId,
      showToast,
    ],
  )

  const saveCard = async () => {
    const { front, back } = draftToFrontBack(cardTemplate, draft)
    if (!front || !back) {
      showToast('Fill in required fields.', 'error')
      return
    }
    if (!activeDeckId) {
      showToast('Select a deck first.', 'error')
      return
    }
    setSaveBusy(true)
    try {
      const data = draftToCardData(cardTemplate, draft)
      const t = new Date().toISOString()
      const card: SavedCard = stampCardTemplateSnapshot(
        stampGenerationMetadata({
          id: crypto.randomUUID(),
          originalGeneratedCardId: crypto.randomUUID(),
          deckId: activeDeckId,
          front,
          back,
          data,
          savedAt: t,
          updatedAt: t,
          study: createDefaultStudyProgress(),
        }),
        cardTemplate,
      )
      await storage.cards.put(card)
      await reload()
      showToast(`Card saved to ${activeDeckName}.`, 'success')
      resetToInputMode()
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
      if (!guardDiscard()) return
      setCardTemplateId(templateId)
      setTemplateSheetOpen(false)
    },
    [cardTemplateId, guardDiscard],
  )

  const openTemplateSheet = useCallback(() => {
    if (!guardDiscard()) return
    setTemplateSheetOpen(true)
  }, [guardDiscard])

  const handleDeckBeforeChange = useCallback(
    (_nextDeckId: string) => guardDiscard(),
    [guardDiscard],
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

  const requestTemplateModification = useCallback(
    (effectiveId: string, applySave: () => void, onDone: () => void) => {
      if (
        !activeDeckId ||
        !deckHasOtherCardsUsingTemplate(allCards, activeDeckId, effectiveId)
      ) {
        applySave()
        onDone()
        return
      }
      void requestTemplateChange({
        newTemplateId: effectiveId,
        mode: 'update',
        dialogVariant: 'make_card',
        applyTemplateSave: applySave,
        onProcessingStart: () => setTemplateBuilderOpen(false),
        onComplete: onDone,
      })
    },
    [activeDeckId, allCards, requestTemplateChange],
  )

  const handleTemplateSaved = (
    name: string,
    fields: Parameters<typeof saveTemplateFromBuilder>[1],
    templateId?: string,
  ) => {
    if (templateBuilderMode === 'create') {
      if (hasUnsavedRef.current && !confirmDiscardGenerated()) return
      try {
        const saved = saveTemplateFromBuilder(name, fields, templateId)
        setTemplatesRefreshKey((k) => k + 1)
        if (!guardDiscard()) return
        setCardTemplateId(saved.id)
        setTemplateBuilderOpen(false)
        setEditingTemplateId(null)
        setTemplateBuilderMode('edit')
        showToast(`Template “${name}” saved.`, 'success')
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Could not save template.', 'error')
      }
      return
    }

    if (hasUnsavedRef.current && !confirmDiscardGenerated()) return
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
    })
  }

  const handleDeleteTemplate = (templateId: string) => {
    const template = resolveCardTemplate(templateId)
    if (template.isBuiltin) return
    if (!window.confirm(`Delete template “${template.name}”?`)) return
    customTemplateRepository.delete(templateId)
    setTemplatesRefreshKey((k) => k + 1)
    if (cardTemplateId === templateId) {
      setCardTemplateId(deckDefaultTemplateId)
    }
    showToast(`Template “${template.name}” deleted.`, 'success')
  }

  const handleAiDifficultyChange = (value: DifficultyOption) => {
    setAiDifficultyOverride(value === languageSettings.difficulty ? null : value)
  }

  const handleAiToneChange = (value: ToneOption) => {
    setAiToneOverride(value === languageSettings.tone ? null : value)
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 pb-8 pt-3 sm:px-6">
      <header className="mb-3">
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
          Make Card
        </h1>
        <div className="mt-2">
          <ActiveDeckSelector variant="field" onBeforeChange={handleDeckBeforeChange} />
        </div>
      </header>

      <section className="space-y-3">
        <CardWordInputBar
          draft={draft}
          onChange={handleDraftChange}
          disabled={busy}
          aiGenerate={{
            onClick: () => runGenerate(),
            busy: isGenerating,
            disabled: busy,
          }}
        />

        {invalidInput ? (
          <InvalidInputSuggestions
            suggestions={invalidInput.suggestions}
            busy={isGenerating}
            onSuggestion={(suggestion) => {
              setDraft((prev) => ({ ...prev, data: { ...prev.data, input: suggestion } }))
              runGenerate(suggestion)
            }}
          />
        ) : null}

        <AiSettingsLink onClick={() => setAiSheetOpen(true)} disabled={busy} />

        <CardTemplatePickerLine
          templateName={cardTemplate.name}
          onChangeClick={openTemplateSheet}
          disabled={busy}
        />

        {hasGenerated ? (
          <>
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
              onCancel={cancelGenerated}
              saveBusy={saveBusy}
              busy={busy}
            />
          </>
        ) : null}

        {formError ? (
          <p className="text-[13px] text-red-600" role="alert">
            {formError}
          </p>
        ) : null}
      </section>

      <DiscardGeneratedDialog
        open={leavePromptOpen}
        busy={busy}
        onStay={dismissLeave}
        onDiscard={confirmLeave}
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

      <AiGenerationSettingsSheet
        open={aiSheetOpen}
        onClose={() => setAiSheetOpen(false)}
        busy={busy}
        difficulty={effectiveDifficulty}
        tone={effectiveTone}
        deckDifficulty={languageSettings.difficulty}
        deckTone={languageSettings.tone}
        onDifficultyChange={handleAiDifficultyChange}
        onToneChange={handleAiToneChange}
      />

      <TemplateBuilderSheet
        open={templateBuilderOpen}
        busy={busy}
        mode={templateBuilderMode}
        initialTemplate={templateBuilderMode === 'edit' ? editingTemplate : null}
        lockTemplateName={
          templateBuilderMode === 'edit' && isLanguageDefaultTemplate(editingTemplateId ?? '')
        }
        showResetToDefault={
          templateBuilderMode === 'edit' && isLanguageDefaultTemplate(editingTemplateId ?? '')
        }
        onResetToDefault={handleResetLanguageDefault}
        onClose={() => {
          setTemplateBuilderOpen(false)
          setEditingTemplateId(null)
          setTemplateBuilderMode('edit')
        }}
        onSave={handleTemplateSaved}
      />

      {flowUi}
    </main>
  )
}
