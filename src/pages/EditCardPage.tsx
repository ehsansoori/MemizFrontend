import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AddCardSettingsSheet } from '@/components/addCards/AddCardSettingsSheet'
import { EditableTemplateCard } from '@/components/addCards/EditableTemplateCard'
import { TemplateBuilderSheet } from '@/components/addCards/TemplateBuilderSheet'
import { ActiveDeckSelector } from '@/components/layout/ActiveDeckSelector'
import {
  draftToCardData,
  draftToFrontBack,
  generatedCardToDraft,
  savedCardToDraft,
  type CardDraft,
} from '@/domain/cardDraft'
import {
  createDefaultLanguageSettings,
  languageSettingsToGenerationOptions,
  resolveLanguageSettings,
} from '@/domain/deckSettings'
import { deckTypeSupportsLanguageSettings } from '@/domain/deckTypes'
import { resolveCardTemplate, resolveDeckDefaultTemplateId } from '@/domain/resolveDeckTemplate'
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
import type { GenerateCardsFormDto } from '@/types/cards'
import type { LanguageDeckSettings } from '@/types/deckProfile'

export function EditCardPageInner() {
  const { deckId, cardId } = useParams<{ deckId: string; cardId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromMode = searchParams.get('from')
  const { setLayouts } = useLayoutDispatch()
  const { showToast } = useToast()
  const generateMutation = useGenerateCardsMutation()

  const decks = useLibraryStore((s) => s.decks)
  const allCards = useLibraryStore((s) => s.cards)
  const hydrated = useLibraryStore((s) => s.hydrated)
  const reload = useLibraryStore((s) => s.reload)
  const updateDeckSettings = useLibraryStore((s) => s.updateDeckSettings)

  const deck = useMemo(
    () => (deckId ? decks.find((d) => d.id === deckId) : undefined),
    [decks, deckId],
  )

  const card = useMemo(() => {
    if (!cardId) return undefined
    const found = allCards.find((c) => c.id === cardId)
    if (!found || (deckId && found.deckId !== deckId)) return undefined
    return found
  }, [allCards, cardId, deckId])

  const backUrl = useMemo(() => {
    if (fromMode === 'study' && cardId && deckId) {
      return `/decks/${deckId}/study?card=${cardId}`
    }
    if (deckId) return `/decks/${deckId}/browse`
    return '/decks'
  }, [fromMode, cardId, deckId])

  const deckDefaultTemplateId = useMemo(
    () => resolveDeckDefaultTemplateId(deck),
    [deck],
  )

  const initialTemplateId = card?.templateId ?? deckDefaultTemplateId
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId)
  const [templatesRefreshKey, setTemplatesRefreshKey] = useState(0)
  const [draftLoaded, setDraftLoaded] = useState(false)

  const cardTemplate = useMemo(
    () => resolveCardTemplate(selectedTemplateId),
    [selectedTemplateId, templatesRefreshKey],
  )

  const showAiSettings = deckTypeSupportsLanguageSettings(deck?.deckTypeId)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [templateBuilderOpen, setTemplateBuilderOpen] = useState(false)
  const [templateBuilderMode, setTemplateBuilderMode] = useState<'create' | 'edit'>('create')
  const [languageSettings, setLanguageSettings] = useState<LanguageDeckSettings>(
    createDefaultLanguageSettings(),
  )

  const [draft, setDraft] = useState<CardDraft>({
    data: { word: '', examples: [] },
    definitions: [],
    customSlots: {},
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [saveBusy, setSaveBusy] = useState(false)

  const isGenerating = generateMutation.isPending
  const busy = isGenerating || saveBusy

  useEffect(() => {
    const lang = resolveLanguageSettings(deck)
    if (lang) setLanguageSettings(lang)
  }, [deck])

  useEffect(() => {
    if (!card) return
    const templateId = card.templateId ?? deckDefaultTemplateId
    const template = resolveCardTemplate(templateId)
    setSelectedTemplateId(templateId)
    setDraft(savedCardToDraft(card, template))
    setFormError(null)
    setDraftLoaded(true)
  }, [card, deckDefaultTemplateId])

  useEffect(() => {
    setLayouts(cardTemplate.frontLayout, cardTemplate.backLayout)
  }, [cardTemplate, setLayouts])

  const applyTemplate = useCallback(
    (templateId: string) => {
      setSelectedTemplateId(templateId)
      if (card) {
        setDraft(savedCardToDraft(card, resolveCardTemplate(templateId)))
      }
      setFormError(null)
    },
    [card],
  )

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
        onSuccess: ({ cards: generated }) => {
          const next = generated[0]
          if (!next) return
          if (next.invalid) {
            setFormError(
              `Could not generate "${next.invalid.originalWord}". Check spelling or try another word.`,
            )
            return
          }
          setDraft(generatedCardToDraft(next.data, cardTemplate))
          showToast('Card updated — review and edit as needed.', 'success')
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
    generateMutation,
    buildGenerateForm,
    cardTemplate,
    selectedTemplateId,
    showToast,
  ])

  const saveCard = async () => {
    if (!card || !deckId) return
    const { front, back } = draftToFrontBack(cardTemplate, draft)
    if (!front || !back) {
      showToast('Fill in required fields.', 'error')
      return
    }
    setSaveBusy(true)
    try {
      const data = draftToCardData(cardTemplate, draft)
      await storage.cards.put({
        ...card,
        templateId: selectedTemplateId,
        front,
        back,
        data,
        updatedAt: new Date().toISOString(),
      })
      await reload()
      showToast('Card saved.', 'success')
      navigate(backUrl)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not save card.', 'error')
    } finally {
      setSaveBusy(false)
    }
  }

  const saveSettings = () => {
    if (showAiSettings && deckId) {
      void updateDeckSettings(deckId, { language: languageSettings }).then(() => {
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

  const handleTemplateSaved = (
    name: string,
    fields: Parameters<typeof customTemplateRepository.save>[1],
    templateId?: string,
  ) => {
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

  if (hydrated && (!deck || !card)) {
    return <Navigate to={deckId ? `/decks/${deckId}/browse` : '/decks'} replace />
  }

  if (!deck || !card || !draftLoaded) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <p className="text-center text-[14px] text-slate-500">Loading card…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 pb-8 pt-4 sm:px-6">
      <header className="mb-4 space-y-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to={backUrl}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition active:scale-95 dark:border-slate-700 dark:text-slate-300"
            aria-label="Back"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
            </svg>
          </Link>
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
          <h1 className="min-w-0 text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
            Edit Card
          </h1>
        </div>
        <ActiveDeckSelector variant="field" fixedDeckId={deckId} />
      </header>

      <section className="mb-6 space-y-4">
        <EditableTemplateCard
          template={cardTemplate}
          draft={draft}
          onChange={setDraft}
          disabled={busy}
          wordAiGenerate={{
            onGenerate: generateFromWord,
            busy: isGenerating,
            disabled: busy,
          }}
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

export function EditCardPage() {
  return <EditCardPageInner />
}
