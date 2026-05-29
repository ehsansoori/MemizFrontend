import { apiClient } from '@/services/api/apiClient'
import type {
  ApiGenerateCardsRequestDto,
  CardGenerationResultDto,
} from '@/services/api/types/cardsApi.types'

export type GenerateCardsParams = {
  request: ApiGenerateCardsRequestDto
  signal?: AbortSignal
}

/**
 * POST /api/cards/generate
 * Returns one card row per input term.
 */
export async function generateCards({
  request,
  signal,
}: GenerateCardsParams): Promise<CardGenerationResultDto> {
  const { data } = await apiClient.post<CardGenerationResultDto>(
    '/api/Cards/generate',
    request,
    { signal },
  )
  return data
}
