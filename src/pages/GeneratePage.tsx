import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { CardNavigation } from '@/components/controls/CardNavigation'
import { InlineSessionCard } from '@/components/flashcard/InlineSessionCard'
import { UnknownWordCard } from '@/components/flashcard/UnknownWordCard'
import { Button } from '@/components/ui/Button'
import { CardAreaSkeleton } from '@/components/ui/CardAreaSkeleton'
import { SelectField } from '@/components/ui/SelectField'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { ToggleField } from '@/components/ui/ToggleField'
import {
  DEFAULT_GENERATOR_INPUT,
  DEFAULT_SOURCE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  DIFFICULTY_OPTIONS,
  EXAMPLE_COUNT_OPTIONS,
  LANGUAGE_OPTIONS,
  TONE_OPTIONS,
} from '@/constants/formOptions'
import {
  isGenerateMutationAbort,
  useGenerateCardsMutation,
} from '@/hooks/cards/useGenerateCardsMutation'
import { useToast } from '@/providers/toastContext'
import { withInvalidCardWord } from '@/domain/invalidCard'
import { getApiErrorMessage } from '@/services/api/getApiErrorMessage'
import { parseInputTerms } from '@/services/cards/buildApiRequest'
import {
  useGeneratedSessionStore,
  useLayoutDispatch,
} from '@/store/generatedSession/reviewHooks'
import type {
  CardGenerationOptionsDto,
  GenerateCardsFormDto,
} from '@/types/cards'
import { PREVIEW_SAMPLE_DATA } from '@/utils/cardLayoutModel'

const defaultOptions: CardGenerationOptionsDto = {
  includePhonetic: true,
  includePartOfSpeech: true,
  includeTargetMeaning: true,
  includeEnglishMeaning: true,
  includeExampleTranslations: true,
  tone: 'friendly',
  difficulty: 'intermediate',
  exampleCount: 2,
}

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  if (
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t instanceof HTMLSelectElement
  ) {
    return true
  }
  if (t.isContentEditable) return true
  const role = t.getAttribute('role')
  if (role === 'combobox' || role === 'textbox' || role === 'searchbox') return true
  if (t.closest('[contenteditable="true"]')) return true
  return false
}

export function GeneratePageInner() {
  const { state, dispatch, currentCard } = useGeneratedSessionStore()
  const { setLayouts, frontLayout, backLayout } = useLayoutDispatch()
  const { showToast } = useToast()
  const generateMutation = useGenerateCardsMutation()

  const [input, setInput] = useState(DEFAULT_GENERATOR_INPUT)
  const [sourceLanguage, setSourceLanguage] = useState(DEFAULT_SOURCE_LANGUAGE)
  const [targetLanguage, setTargetLanguage] = useState(DEFAULT_TARGET_LANGUAGE)
  const [options, setOptions] = useState<CardGenerationOptionsDto>(defaultOptions)
  const [formError, setFormError] = useState<string | null>(null)
  const [draftSavedBanner, setDraftSavedBanner] = useState(false)
  const [invalidInlineEdit, setInvalidInlineEdit] = useState<{
    cardId: string
    draft: string
  } | null>(null)
  const [regeneratingCardId, setRegeneratingCardId] = useState<string | null>(null)
  const prevDraftCountRef = useRef(0)

  const isGenerating = generateMutation.isPending
  const isSingleCardRegen = regeneratingCardId !== null
  const isSessionGenerating = isGenerating && !isSingleCardRegen
  const total = state.session?.cards.length ?? 0
  const displayData = currentCard?.data ?? PREVIEW_SAMPLE_DATA
  const inDraftSession = !!state.session && total > 0

  useEffect(() => {
    const count = state.session?.cards.length ?? 0
    if (prevDraftCountRef.current > 0 && count === 0 && !state.session) {
      setDraftSavedBanner(true)
    }
    prevDraftCountRef.current = count
  }, [state.session])

  useEffect(() => {
    setInvalidInlineEdit(null)
  }, [currentCard?.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        dispatch({ type: 'NAV_PREV' })
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        dispatch({ type: 'NAV_NEXT' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  const updateOption = useCallback(
    <K extends keyof CardGenerationOptionsDto>(
      key: K,
      value: CardGenerationOptionsDto[K],
    ) => {
      setOptions((o) => ({ ...o, [key]: value }))
    },
    [],
  )

  const buildForm = useCallback((): GenerateCardsFormDto => {
    return {
      input: input.trim(),
      sourceLanguage,
      targetLanguage,
      options,
    }
  }, [input, sourceLanguage, targetLanguage, options])

  const submitGenerate = useCallback(
    (
      form: GenerateCardsFormDto,
      opts?: {
        replaceCardId?: string
        preserveSourceInput?: string
      },
    ) => {
      if (parseInputTerms(form.input).length === 0) {
        setFormError('Enter at least one word or phrase.')
        return
      }

      setFormError(null)
      generateMutation.mutate(
        {
          form,
          layout: { frontLayout: state.frontLayout, backLayout: state.backLayout },
          preserve:
            opts?.replaceCardId && opts.preserveSourceInput
              ? [{ id: opts.replaceCardId, sourceInput: opts.preserveSourceInput }]
              : undefined,
        },
        {
          onSuccess: ({ cards }) => {
            setDraftSavedBanner(false)
            if (opts?.replaceCardId) {
              const next = cards[0]
              if (next) {
                dispatch({
                  type: 'REPLACE_CARD',
                  card: { ...next, isRegenerating: false },
                })
              }
              setInvalidInlineEdit(null)
              setRegeneratingCardId(null)
              return
            }
            if (cards.length > 0) {
              dispatch({
                type: 'SET_SESSION_FROM_CARDS',
                cards,
                sourceType: 'api',
              })
              showToast(
                cards.length === 1
                  ? 'Draft session ready — 1 card generated.'
                  : `Draft session ready — ${cards.length} cards generated.`,
                'success',
              )
            } else {
              dispatch({ type: 'CLEAR_SESSION' })
            }
          },
          onError: (err) => {
            if (opts?.replaceCardId) {
              dispatch({
                type: 'SET_CARD_REGENERATING',
                cardId: opts.replaceCardId,
                value: false,
              })
              setRegeneratingCardId(null)
            }
            if (isGenerateMutationAbort(err)) return
            const message = getApiErrorMessage(err)
            setFormError(message)
            showToast(message, 'error')
          },
        },
      )
    },
    [dispatch, generateMutation, showToast, state.backLayout, state.frontLayout],
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    submitGenerate(buildForm())
  }

  const regenerateCurrentCardOnly = useCallback(
    (word: string) => {
      if (!currentCard?.invalid) return
      const nextInput = word.trim()
      if (!nextInput) return

      setInvalidInlineEdit(null)
      dispatch({
        type: 'REPLACE_CARD',
        card: withInvalidCardWord(currentCard, nextInput, { regenerating: true }),
      })
      setRegeneratingCardId(currentCard.id)

      submitGenerate(
        {
          input: nextInput,
          sourceLanguage,
          targetLanguage,
          options,
        },
        {
          replaceCardId: currentCard.id,
          preserveSourceInput: nextInput,
        },
      )
    },
    [currentCard, dispatch, options, sourceLanguage, submitGenerate, targetLanguage],
  )

  const useWordAnyway = useCallback(() => {
    if (!currentCard?.invalid) return
    const sourceWord = currentCard.invalid.originalWord.trim()
    if (!sourceWord) return
    dispatch({
      type: 'REPLACE_CARD',
      card: {
        ...currentCard,
        sourceInput: sourceWord,
        invalid: undefined,
        data: {
          word: sourceWord,
          examples: [],
        },
        isEdited: true,
        isRegenerating: false,
        updatedAt: new Date().toISOString(),
      },
    })
  }, [currentCard, dispatch])

  const invalidEditMode =
    !!currentCard?.invalid && invalidInlineEdit?.cardId === currentCard.id
  const currentCardBusy =
    !!currentCard &&
    (currentCard.isRegenerating || regeneratingCardId === currentCard.id)

  const showCardSkeleton = isSessionGenerating && !state.session
  const showCard = !showCardSkeleton

  return (
    <main className="mx-auto w-full max-w-[88rem] flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <p className="mx-auto mb-6 max-w-2xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Generate cards, edit fields and layouts in place, then save drafts or individual cards to
        your library.
      </p>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:items-start xl:gap-10 2xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] 2xl:gap-12">
        <aside className="mx-auto w-full max-w-md xl:mx-0 xl:max-w-none">
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
          >
            <TextAreaField
              id="words-input"
              label="Words or phrases"
              placeholder="One per line or comma-separated"
              value={input}
              onChange={(ev) => setInput(ev.target.value)}
              hint="No row limit — large decks stay in draft until you save."
              disabled={isSessionGenerating}
            />
            <Button
              type="submit"
              variant="primary"
              loading={isSessionGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating…' : 'Generate card(s)'}
            </Button>

            <div className="grid gap-4 sm:grid-cols-1">
              <SelectField
                id="source-lang"
                label="Source language"
                options={LANGUAGE_OPTIONS}
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                disabled={isSessionGenerating}
              />
              <SelectField
                id="target-lang"
                label="Target language"
                options={LANGUAGE_OPTIONS.filter((o) => o.value !== 'auto')}
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                disabled={isSessionGenerating}
              />
            </div>

            <SelectField
              id="example-count"
              label="Example count"
              options={EXAMPLE_COUNT_OPTIONS.map((n) => ({
                value: String(n),
                label: String(n),
              }))}
              value={String(options.exampleCount)}
              onChange={(e) => updateOption('exampleCount', Number.parseInt(e.target.value, 10))}
              disabled={isSessionGenerating}
            />

            <fieldset className="space-y-2" disabled={isSessionGenerating}>
              <legend className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Card content
              </legend>
              <ToggleField
                id="opt-phonetic"
                label="Include phonetic"
                checked={options.includePhonetic}
                onChange={(v) => updateOption('includePhonetic', v)}
              />
              <ToggleField
                id="opt-pos"
                label="Include part of speech"
                checked={options.includePartOfSpeech}
                onChange={(v) => updateOption('includePartOfSpeech', v)}
              />
              <ToggleField
                id="opt-target"
                label="Include target meaning"
                checked={options.includeTargetMeaning}
                onChange={(v) => updateOption('includeTargetMeaning', v)}
              />
              <ToggleField
                id="opt-english"
                label="Include English meaning"
                checked={options.includeEnglishMeaning}
                onChange={(v) => updateOption('includeEnglishMeaning', v)}
              />
              <ToggleField
                id="opt-trans"
                label="Include example translations"
                checked={options.includeExampleTranslations}
                onChange={(v) => updateOption('includeExampleTranslations', v)}
              />
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-1">
              <SelectField
                id="tone"
                label="Tone"
                options={TONE_OPTIONS}
                value={options.tone}
                onChange={(e) => updateOption('tone', e.target.value as CardGenerationOptionsDto['tone'])}
                disabled={isSessionGenerating}
              />
              <SelectField
                id="difficulty"
                label="Difficulty"
                options={DIFFICULTY_OPTIONS}
                value={options.difficulty}
                onChange={(e) =>
                  updateOption('difficulty', e.target.value as CardGenerationOptionsDto['difficulty'])
                }
                disabled={isSessionGenerating}
              />
            </div>

            {state.session ? (
              <p className="text-xs text-amber-700 dark:text-amber-400/90">
                Generating again replaces the current draft. Saved library entries stay.
              </p>
            ) : null}

            {formError ? (
              <div
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                <p>{formError}</p>
                <button
                  type="submit"
                  className="mt-2 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100"
                >
                  Try again
                </button>
              </div>
            ) : null}
          </form>

          {state.session ? (
            <Button
              type="button"
              variant="secondary"
              className="mt-4 w-full"
              disabled={isSessionGenerating}
              onClick={() => {
                if (window.confirm('Discard the entire draft session on this screen?')) {
                  dispatch({ type: 'CLEAR_SESSION' })
                }
              }}
            >
              Clear draft session
            </Button>
          ) : null}
        </aside>

        <section className="flex min-h-0 w-full max-w-3xl flex-col items-center gap-3 xl:mx-auto xl:max-w-[46rem]">
          {draftSavedBanner && !state.session ? (
            <div
              className="w-full rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-center text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
              role="status"
            >
              <p className="font-medium">Draft saved to your library.</p>
              <p className="mt-1 text-[13px] text-emerald-800/90 dark:text-emerald-200/80">
                Generate new words below to start another draft session.
              </p>
            </div>
          ) : null}

          {showCardSkeleton ? <CardAreaSkeleton /> : null}

          {showCard ? (
            <>
              {inDraftSession && currentCard?.invalid ? (
                <UnknownWordCard
                  originalWord={currentCard.invalid.originalWord}
                  suggestions={currentCard.invalid.suggestions}
                  editMode={invalidEditMode}
                  draft={invalidInlineEdit?.draft ?? currentCard.invalid.originalWord}
                  busy={currentCardBusy}
                  onDraftChange={(draft) => {
                    if (!currentCard) return
                    setInvalidInlineEdit({ cardId: currentCard.id, draft })
                  }}
                  onStartEdit={() => {
                    if (!currentCard?.invalid) return
                    setInvalidInlineEdit({
                      cardId: currentCard.id,
                      draft: currentCard.invalid.originalWord,
                    })
                  }}
                  onCancelEdit={() => setInvalidInlineEdit(null)}
                  onSaveAndGenerate={() => {
                    const draft = invalidInlineEdit?.draft.trim()
                    if (!draft) return
                    regenerateCurrentCardOnly(draft)
                  }}
                  onSuggestion={(word) => regenerateCurrentCardOnly(word)}
                  onUseWordAnyway={useWordAnyway}
                />
              ) : (
                <InlineSessionCard
                  displayData={displayData}
                  frontLayout={frontLayout}
                  backLayout={backLayout}
                  onLayoutsChange={setLayouts}
                  onPatchCardData={
                    inDraftSession && currentCard
                      ? (patch) =>
                          dispatch({
                            type: 'UPDATE_CARD_DATA',
                            cardId: currentCard.id,
                            data: patch,
                          })
                      : undefined
                  }
                  isRegenerating={
                    !!currentCard?.isRegenerating ||
                    (isSessionGenerating && !!state.session)
                  }
                  previewMode={!inDraftSession}
                />
              )}

              {inDraftSession ? (
                <div className="flex w-full flex-col items-center gap-1">
                  <CardNavigation
                    currentIndex={state.currentIndex}
                    total={total}
                    onPrev={() => dispatch({ type: 'NAV_PREV' })}
                    onNext={() => dispatch({ type: 'NAV_NEXT' })}
                    disabled={total === 0 || isSessionGenerating}
                  />
                  <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                    Arrow keys move between cards (← · →) when not typing
                  </p>
                </div>
              ) : null}

              {!inDraftSession && !isSessionGenerating && !draftSavedBanner ? (
                <p className="text-center text-sm text-slate-500 dark:text-slate-500">
                  Enter words and generate to start a draft session.
                </p>
              ) : null}
            </>
          ) : null}
        </section>
      </div>
    </main>
  )
}
