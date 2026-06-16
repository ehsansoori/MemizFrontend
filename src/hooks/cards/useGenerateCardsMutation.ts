import { useMutation } from '@tanstack/react-query'
import { useRef } from 'react'
import { generateCards } from '@/services/api/cardsApi'
import { isAbortError } from '@/services/api/getApiErrorMessage'
import { buildApiGenerateRequest } from '@/services/cards/buildApiRequest'
import {
  mapApiCardsToGeneratedCards,
} from '@/services/cards/cardMapper'
import type { CardFieldLayout, GeneratedCard, GenerateCardsFormDto } from '@/types/cards'
import { cardQueryKeys } from '@/hooks/cards/queryKeys'

export type GenerateCardsMutationInput = {
  form: GenerateCardsFormDto
  layout: { frontLayout: CardFieldLayout[]; backLayout: CardFieldLayout[] }
  templateId: string
  preserve?: { id: string; sourceInput: string }[]
}

export type GenerateCardsMutationResult = {
  cards: GeneratedCard[]
}

export function useGenerateCardsMutation() {
  const abortRef = useRef<AbortController | null>(null)

  return useMutation({
    mutationKey: cardQueryKeys.generate(),
    mutationFn: async ({
      form,
      layout,
      templateId,
      preserve,
    }: GenerateCardsMutationInput): Promise<GenerateCardsMutationResult> => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const apiRequest = buildApiGenerateRequest(form)
      if (apiRequest.inputs.length === 0) {
        throw new Error('Enter at least one word or phrase.')
      }

      const rows = await generateCards({
        request: apiRequest,
        signal: controller.signal,
      })

      const cards = mapApiCardsToGeneratedCards(rows, form, layout, templateId, preserve)
      return { cards }
    },
    onSettled: () => {
      abortRef.current = null
    },
    retry: false,
  })
}

export function isGenerateMutationAbort(error: unknown): boolean {
  return isAbortError(error)
}
