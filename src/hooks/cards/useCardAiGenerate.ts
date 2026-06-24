import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { languageSettingsToGenerationOptions } from '@/domain/deckSettings'
import { confirmDiscardGenerated } from '@/domain/confirmDiscard'
import { generatedCardToDraft, type CardDraft } from '@/domain/cardDraft'
import { invalidInputFromGeneratedCard, type InvalidInputState } from '@/domain/generateInvalidInput'
import {
  isGenerateMutationAbort,
  useGenerateCardsMutation,
} from '@/hooks/cards/useGenerateCardsMutation'
import { useToast } from '@/providers/toastContext'
import { getApiErrorMessage } from '@/services/api/getApiErrorMessage'
import type { DifficultyOption, GenerateCardsFormDto, ToneOption } from '@/types/cards'
import type { CardTemplate, LanguageDeckSettings } from '@/types/deckProfile'

type UseCardAiGenerateOptions = {
  cardTemplate: CardTemplate
  templateId: string
  languageSettings: LanguageDeckSettings
  draft: CardDraft
  setDraft: Dispatch<SetStateAction<CardDraft>>
  /** Show replace-content confirmation before calling the API (Edit Card). */
  confirmBeforeReplace?: boolean
  /** Confirm discarding unsaved generated preview (Make Card regenerate). */
  confirmDiscardUnsaved?: boolean
  onGenerated?: () => void
  generatedToastMessage?: string
}

export function useCardAiGenerate({
  cardTemplate,
  templateId,
  languageSettings,
  draft,
  setDraft,
  confirmBeforeReplace = false,
  confirmDiscardUnsaved = false,
  onGenerated,
  generatedToastMessage = 'Card ready — tap any field to edit.',
}: UseCardAiGenerateOptions) {
  const { showToast } = useToast()
  const generateMutation = useGenerateCardsMutation()

  const [invalidInput, setInvalidInput] = useState<InvalidInputState | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [aiSheetOpen, setAiSheetOpen] = useState(false)
  const [aiDifficultyOverride, setAiDifficultyOverride] = useState<DifficultyOption | null>(null)
  const [aiToneOverride, setAiToneOverride] = useState<ToneOption | null>(null)
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false)
  const [pendingInputOverride, setPendingInputOverride] = useState<string | undefined>()

  const effectiveDifficulty = aiDifficultyOverride ?? languageSettings.difficulty
  const effectiveTone = aiToneOverride ?? languageSettings.tone
  const isGenerating = generateMutation.isPending

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

  const executeGenerate = useCallback(
    (inputOverride?: string) => {
      const input = (inputOverride ?? draft.data.input).trim()
      if (!input) {
        showToast('Enter a word or phrase first.', 'error')
        return
      }

      setFormError(null)
      setInvalidInput(null)
      generateMutation.mutate(
        {
          form: buildGenerateForm(input),
          layout: {
            frontLayout: cardTemplate.frontLayout,
            backLayout: cardTemplate.backLayout,
          },
          templateId,
        },
        {
          onSuccess: ({ cards }) => {
            const card = cards[0]
            if (!card) return
            const invalid = invalidInputFromGeneratedCard(card)
            if (invalid) {
              setInvalidInput(invalid)
              setDraft((prev) => ({
                ...prev,
                data: { ...prev.data, input: invalid.originalWord },
              }))
              return
            }
            setInvalidInput(null)
            setDraft(generatedCardToDraft(card.data, cardTemplate))
            onGenerated?.()
            showToast(generatedToastMessage, 'success')
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
      setDraft,
      generateMutation,
      buildGenerateForm,
      cardTemplate,
      templateId,
      showToast,
      onGenerated,
      generatedToastMessage,
    ],
  )

  const runGenerate = useCallback(
    (inputOverride?: string, options?: { skipConfirm?: boolean }) => {
      const input = (inputOverride ?? draft.data.input).trim()
      if (!input) {
        showToast('Enter a word or phrase first.', 'error')
        return
      }

      if (confirmDiscardUnsaved && !confirmDiscardGenerated()) return

      if (confirmBeforeReplace && !options?.skipConfirm) {
        setPendingInputOverride(inputOverride)
        setRegenerateDialogOpen(true)
        return
      }

      executeGenerate(inputOverride)
    },
    [draft.data.input, confirmBeforeReplace, confirmDiscardUnsaved, executeGenerate, showToast],
  )

  const confirmRegenerate = useCallback(() => {
    setRegenerateDialogOpen(false)
    executeGenerate(pendingInputOverride)
    setPendingInputOverride(undefined)
  }, [executeGenerate, pendingInputOverride])

  const dismissRegenerateDialog = useCallback(() => {
    if (isGenerating) return
    setRegenerateDialogOpen(false)
    setPendingInputOverride(undefined)
  }, [isGenerating])

  const handleAiDifficultyChange = useCallback(
    (value: DifficultyOption) => {
      setAiDifficultyOverride(value === languageSettings.difficulty ? null : value)
    },
    [languageSettings.difficulty],
  )

  const handleAiToneChange = useCallback(
    (value: ToneOption) => {
      setAiToneOverride(value === languageSettings.tone ? null : value)
    },
    [languageSettings.tone],
  )

  const aiSettings = useMemo(
    () => ({
      effectiveDifficulty,
      effectiveTone,
      aiSheetOpen,
      setAiSheetOpen,
      handleAiDifficultyChange,
      handleAiToneChange,
    }),
    [
      effectiveDifficulty,
      effectiveTone,
      aiSheetOpen,
      handleAiDifficultyChange,
      handleAiToneChange,
    ],
  )

  return {
    isGenerating,
    invalidInput,
    setInvalidInput,
    formError,
    setFormError,
    runGenerate,
    regenerateDialogOpen,
    confirmRegenerate,
    dismissRegenerateDialog,
    aiSettings,
  }
}
