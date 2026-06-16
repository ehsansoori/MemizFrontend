import { useCallback, useEffect, useMemo, useState } from 'react'
import { AddCardSettingsSheet } from '@/components/addCards/AddCardSettingsSheet'
import { EditableTemplateCard } from '@/components/addCards/EditableTemplateCard'
import { TemplateBuilderSheet } from '@/components/addCards/TemplateBuilderSheet'
import {
  draftToCardData,
  draftToFrontBack,
  emptyCardDraft,
  generatedCardToDraft,
  type CardDraft,
} from '@/domain/cardDraft'
import {
  createDefaultLanguageSettings,
  languageSettingsToGenerationOptions,
  resolveLanguageSettings,
} from '@/domain/deckSettings'
import { deckTypeSupportsLanguageSettings } from '@/domain/deckTypes'
import {
  resolveCardTemplate,
  resolveDeckDefaultTemplateId,
} from '@/domain/resolveDeckTemplate'
import { createDefaultStudyProgress } from '@/domain/studyDefaults'
import {
  isGenerateMutationAbort,
  useGenerateCardsMutation,
} from '@/hooks/cards/useGenerateCardsMutation'
import { useToast } from '@/providers/toastContext'
import { getApiErrorMessage } from '@/services/api/getApiErrorMessage'
import { customTemplateRepository } from '@/storage/customTemplateRepository'
import { storage } from '@/storage/adapter'
import { useLayoutDispatch } from '@/store/generatedSession/reviewHooks'
import { useLibraryStore } from '@/store/library/libraryStore'
import type { GenerateCardsFormDto, SavedCard } from '@/types/cards'
import type { LanguageDeckSettings } from '@/types/deckProfile'

export function GeneratePageInner() {
  const { setLayouts } = useLayoutDispatch()
  const { showToast } = useToast()
  const generateMutation = useGenerateCardsMutation()

  const activeDeckId = useLibraryStore((s) => s.activeDeckId)
  const decks = useLibraryStore((s) => s.decks)
  const reload = useLibraryStore((s) => s.reload)
  const updateDeckSettings = useLibraryStore((s) => s.updateDeckSettings)

  const activeDeck = useMemo(
    () => decks.find((d) => d.id === activeDeckId),
    [decks, activeDeckId],
  )
  const activeDeckName = activeDeck?.name ?? 'active deck'
  const deckDefaultTemplateId = useMemo(
    () => resolveDeckDefaultTemplateId(activeDeck),
    [activeDeck],
  )
  const [selectedTemplateId, setSelectedTemplateId] = useState(deckDefaultTemplateId)
  const [templatesRefreshKey, setTemplatesRefreshKey] = useState(0)
  const cardTemplate = useMemo(
    () => resolveCardTemplate(selectedTemplateId),
    [selectedTemplateId, templatesRefreshKey],
  )
  const showAiSettings = deckTypeSupportsLanguageSettings(activeDeck?.deckTypeId)
  const aiAvailable = showAiSettings

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [templateBuilderOpen, setTemplateBuilderOpen] = useState(false)
  const [templateBuilderMode, setTemplateBuilderMode] = useState<'create' | 'edit'>('create')
  const [languageSettings, setLanguageSettings] = useState<LanguageDeckSettings>(
    createDefaultLanguageSettings(),
  )

  const [draft, setDraft] = useState<CardDraft>(() => emptyCardDraft(cardTemplate))
  const [formError, setFormError] = useState<string | null>(null)
  const [saveBusy, setSaveBusy] = useState(false)

  const isGenerating = generateMutation.isPending
  const busy = isGenerating || saveBusy

  useEffect(() => {
    const lang = resolveLanguageSettings(activeDeck)
    if (lang) setLanguageSettings(lang)
  }, [activeDeck])

  useEffect(() => {
    setSelectedTemplateId(deckDefaultTemplateId)
    setDraft(emptyCardDraft(resolveCardTemplate(deckDefaultTemplateId)))
    setFormError(null)
  }, [deckDefaultTemplateId])

  useEffect(() => {
    setLayouts(cardTemplate.frontLayout, cardTemplate.backLayout)
  }, [cardTemplate, setLayouts])

  const applyTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId)
    setDraft(emptyCardDraft(resolveCardTemplate(templateId)))
    setFormError(null)
  }, [])

  const wordInput = draft.data.word.trim()

  const buildGenerateForm = useCallback((): GenerateCardsFormDto => {
    return {
      input: wordInput,
      sourceLanguage: languageSettings.sourceLanguage,
      targetLanguage: languageSettings.targetLanguage,
      options: languageSettingsToGenerationOptions(languageSettings, cardTemplate),
    }
  }, [wordInput, languageSettings, cardTemplate])

  const generateFromWord = useCallback(() => {
    if (!wordInput) {
      showToast('Enter a word or phrase first.', 'error')
      return
    }
    if (!aiAvailable) {
      showToast('AI generation is available for Language Learning decks.', 'error')
      return
    }

    setFormError(null)
    generateMutation.mutate(
      {
        form: buildGenerateForm(),
        layout: {
          frontLayout: cardTemplate.frontLayout,
          backLayout: cardTemplate.backLayout,
        },
        templateId: selectedTemplateId,
      },
      {
        onSuccess: ({ cards }) => {
          const card = cards[0]
          if (!card) return
          if (card.invalid) {
            setFormError(
              `Could not generate "${card.invalid.originalWord}". Check spelling or try another word.`,
            )
            return
          }
          setDraft(generatedCardToDraft(card.data, cardTemplate))
          showToast('Card filled — review and edit as needed.', 'success')
        },
        onError: (err) => {
          if (isGenerateMutationAbort(err)) return
          const message = getApiErrorMessage(err)
          setFormError(message)
          showToast(message, 'error')
        },
      },
    )
  }, [
    wordInput,
    aiAvailable,
    generateMutation,
    buildGenerateForm,
    cardTemplate,
    selectedTemplateId,
    showToast,
  ])

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
      const card: SavedCard = {
        id: crypto.randomUUID(),
        originalGeneratedCardId: crypto.randomUUID(),
        deckId: activeDeckId,
        templateId: selectedTemplateId,
        front,
        back,
        data,
        savedAt: t,
        updatedAt: t,
        study: createDefaultStudyProgress(),
      }
      await storage.cards.put(card)
      await reload()
      showToast(`Card saved to ${activeDeckName}.`, 'success')
      setDraft(emptyCardDraft(cardTemplate))
      setFormError(null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not save card.', 'error')
    } finally {
      setSaveBusy(false)
    }
  }

  const saveSettings = () => {
    if (showAiSettings && activeDeckId) {
      void updateDeckSettings(activeDeckId, { language: languageSettings }).then(() => {
        showToast('Settings saved.', 'success')
        setSettingsOpen(false)
      })
      return
    }
    setSettingsOpen(false)
  }

  const openCreateTemplate = () => {
    setSettingsOpen(false)
    setTemplateBuilderMode('create')
    setTemplateBuilderOpen(true)
  }

  const openEditTemplate = (templateId: string) => {
    applyTemplate(templateId)
    setSettingsOpen(false)
    setTemplateBuilderMode('edit')
    setTemplateBuilderOpen(true)
  }

  const handleTemplateSaved = (name: string, fields: Parameters<typeof customTemplateRepository.save>[1], templateId?: string) => {
    if (templateBuilderMode === 'edit' && templateId) {
      const updated = customTemplateRepository.update(templateId, name, fields)
      setTemplatesRefreshKey((k) => k + 1)
      applyTemplate(updated.id)
      showToast(`Template “${name}” updated.`, 'success')
    } else {
      const created = customTemplateRepository.save(name, fields)
      setTemplatesRefreshKey((k) => k + 1)
      applyTemplate(created.id)
      showToast(`Template “${name}” created.`, 'success')
    }
    setTemplateBuilderOpen(false)
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-8 pt-4 sm:px-6">
      <header className="mb-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            disabled={busy}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition active:scale-95 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            aria-label="Open settings"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
              />
            </svg>
          </button>
          <h1 className="min-w-0 truncate text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
            Make Card
          </h1>
        </div>
      </header>

      <section className="mb-6 space-y-4">
        <EditableTemplateCard
          template={cardTemplate}
          draft={draft}
          onChange={setDraft}
          disabled={busy}
          wordAiGenerate={
            aiAvailable
              ? {
                  onGenerate: generateFromWord,
                  busy: isGenerating,
                  disabled: busy,
                }
              : undefined
          }
        />

        {formError ? (
          <p className="text-[13px] text-red-600" role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void saveCard()}
          disabled={busy}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-accent text-[16px] font-bold text-white disabled:opacity-40"
        >
          {saveBusy ? 'Saving…' : 'Save Card'}
        </button>
      </section>

      <AddCardSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        busy={busy}
        selectedTemplateId={selectedTemplateId}
        deckDefaultTemplateId={deckDefaultTemplateId}
        templatesRefreshKey={templatesRefreshKey}
        showAiSettings={showAiSettings}
        languageSettings={languageSettings}
        onTemplateChange={applyTemplate}
        onCreateTemplate={openCreateTemplate}
        onEditTemplate={openEditTemplate}
        onLanguageSettingsChange={setLanguageSettings}
        onSave={saveSettings}
      />

      <TemplateBuilderSheet
        open={templateBuilderOpen}
        busy={busy}
        mode={templateBuilderMode}
        initialTemplate={templateBuilderMode === 'edit' ? cardTemplate : null}
        onClose={() => setTemplateBuilderOpen(false)}
        onSave={handleTemplateSaved}
      />
    </main>
  )
}
