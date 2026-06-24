import { useMutation } from '@tanstack/react-query'
import { useRef } from 'react'
import { generateCards } from '@/services/api/cardsApi'
import { isAbortError } from '@/services/api/getApiErrorMessage'
import { buildApiGenerateRequest } from '@/services/cards/buildApiRequest'
import {
  apiCardToGeneratedCardData,
  mergeExamplesFromApi,
} from '@/services/cards/cardMapper'
import type { GeneratedCard, GenerateCardsFormDto } from '@/types/cards'
import { cardQueryKeys } from '@/hooks/cards/queryKeys'

export type RegenerateMode = 'full' | 'examplesOnly'

export type RegenerateCardsInput = {
  cards: GeneratedCard[]
  mode: RegenerateMode
}

export type RegenerateCardsResult = {
  cards: GeneratedCard[]
}

function formFromCard(card: GeneratedCard): GenerateCardsFormDto {
  const m = card.generationMetadata
  return {
    input: card.sourceInput,
    sourceLanguage: m.sourceLanguage,
    targetLanguage: m.targetLanguage,
    options: {
      tone: m.tone,
      difficulty: m.difficulty,
      pronunciations: m.pronunciations ?? [],
      exampleCount: m.exampleCount,
      includePhonetic: m.includePhonetic,
      includePartOfSpeech: m.includePartOfSpeech,
      includeTargetMeaning: m.includeTargetMeaning,
      includeEnglishMeaning: m.includeEnglishMeaning,
      includeExampleTranslations: m.includeExampleTranslations,
    },
  }
}

export function useRegenerateCardsMutation() {
  const abortRef = useRef<AbortController | null>(null)

  return useMutation({
    mutationKey: [...cardQueryKeys.generate(), 'regenerate'],
    mutationFn: async ({
      cards,
      mode,
    }: RegenerateCardsInput): Promise<RegenerateCardsResult> => {
      if (cards.length === 0) return { cards: [] }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const form = formFromCard(cards[0])
      const apiRequest = buildApiGenerateRequest(form, {
        inputs: cards.map((c) => c.sourceInput),
      })

      const rows = await generateCards({
        request: apiRequest,
        signal: controller.signal,
      })

      const updated = cards.map((card, i) => {
        const row = rows[i]
        if (!row) return card
        const cardForm = formFromCard(card)
        const data =
          mode === 'examplesOnly'
            ? mergeExamplesFromApi(card.data, row, cardForm)
            : apiCardToGeneratedCardData(row, cardForm)
        return {
          ...card,
          data,
          isEdited: false,
          isRegenerating: false,
          updatedAt: new Date().toISOString(),
        }
      })

      return { cards: updated }
    },
    onSettled: () => {
      abortRef.current = null
    },
    retry: false,
  })
}

export function isRegenerateMutationAbort(error: unknown): boolean {
  return isAbortError(error)
}
