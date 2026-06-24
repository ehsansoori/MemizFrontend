import {
  draftToCardData,
  draftToFrontBack,
  generatedCardToDraft,
} from '@/domain/cardDraft'
import { stampGenerationMetadata } from '@/domain/cardGenerationMetadata'
import {
  createDefaultLanguageSettings,
  languageSettingsToGenerationOptions,
  resolveLanguageSettings,
} from '@/domain/deckSettings'
import { cardInput } from '@/domain/languageCardData'
import { stampCardTemplateSnapshot } from '@/domain/cardTemplateSnapshot'
import { resolveCardTemplate } from '@/domain/resolveDeckTemplate'
import { generateCards } from '@/services/api/cardsApi'
import { buildApiGenerateRequest } from '@/services/cards/buildApiRequest'
import {
  isInvalidApiCardResponse,
  mapApiCardsToGeneratedCards,
} from '@/services/cards/cardMapper'
import { getApiErrorMessage } from '@/services/api/getApiErrorMessage'
import { storage } from '@/storage/adapter'
import type { Deck, GenerateCardsFormDto, SavedCard } from '@/types/cards'
import type { CardTemplate } from '@/types/deckProfile'

export const BULK_REGENERATE_BATCH_SIZE = 5

export type BulkRegenerateProgress = {
  phase: 'running' | 'done'
  processed: number
  total: number
  succeeded: number
  failed: number
}

export type BulkRegenerateResult = {
  succeeded: number
  failed: number
}

function buildGenerateForm(deck: Deck, template: CardTemplate): GenerateCardsFormDto {
  const languageSettings = resolveLanguageSettings(deck) ?? createDefaultLanguageSettings()
  const baseOptions = languageSettingsToGenerationOptions(languageSettings, template)
  return {
    input: '',
    sourceLanguage: languageSettings.sourceLanguage,
    targetLanguage: languageSettings.targetLanguage,
    options: baseOptions,
  }
}

function applyGeneratedBackToSavedCard(
  card: SavedCard,
  generatedData: ReturnType<typeof mapApiCardsToGeneratedCards>[number]['data'],
  template: CardTemplate,
): SavedCard {
  const frontInput = cardInput(card.data)
  const draft = generatedCardToDraft({ ...generatedData, input: frontInput }, template)
  const { front, back } = draftToFrontBack(template, draft)
  const data = draftToCardData(template, draft)
  const t = new Date().toISOString()
  return stampCardTemplateSnapshot(
    stampGenerationMetadata(
      {
        ...card,
        front,
        back,
        data,
        updatedAt: t,
      },
      t,
    ),
    template,
  )
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

/**
 * Regenerate all cards in a deck with AI using a new template.
 * Keeps each card's front input; replaces generated back content.
 */
export async function applyTemplateToAllCards(params: {
  deck: Deck
  templateId: string
  cards: SavedCard[]
  signal?: AbortSignal
  onProgress: (progress: BulkRegenerateProgress) => void
}): Promise<BulkRegenerateResult> {
  const { deck, templateId, cards, signal, onProgress } = params
  const trimmedTemplateId = templateId.trim()
  if (!trimmedTemplateId) {
    throw new Error('Template is required for bulk regeneration.')
  }

  const template = resolveCardTemplate(trimmedTemplateId)
  const form = buildGenerateForm(deck, template)
  const layout = {
    frontLayout: template.frontLayout,
    backLayout: template.backLayout,
  }

  const eligible = cards.filter((card) => cardInput(card.data).trim())
  const total = eligible.length
  let processed = 0
  let succeeded = 0
  let failed = 0

  const report = (phase: BulkRegenerateProgress['phase']) => {
    onProgress({ phase, processed, total, succeeded, failed })
  }

  report('running')

  for (let offset = 0; offset < eligible.length; offset += BULK_REGENERATE_BATCH_SIZE) {
    if (signal?.aborted) break

    const batch = eligible.slice(offset, offset + BULK_REGENERATE_BATCH_SIZE)
    const inputs = batch.map((card) => cardInput(card.data).trim()).filter(Boolean)
    if (inputs.length === 0) {
      processed += batch.length
      report('running')
      continue
    }

    const preserve = batch.map((card) => ({
      id: card.id,
      sourceInput: cardInput(card.data).trim(),
    }))

    try {
      const rows = await generateCards({
        request: buildApiGenerateRequest(form, { inputs }),
        signal,
      })

      if (!Array.isArray(rows)) {
        throw new Error('Unexpected response from card generation API.')
      }

      const generated = mapApiCardsToGeneratedCards(rows, form, layout, trimmedTemplateId, preserve)
      const updated: SavedCard[] = []

      for (let i = 0; i < batch.length; i++) {
        const card = batch[i]
        const row = rows[i]
        const gen = generated[i]

        if (!card || !row || !gen || isInvalidApiCardResponse(row) || gen.invalid) {
          failed += 1
          continue
        }

        updated.push(applyGeneratedBackToSavedCard(card, gen.data, template))
        succeeded += 1
      }

      if (updated.length > 0) {
        await storage.cards.putMany(updated)
      }
    } catch (e) {
      if (signal?.aborted) break
      failed += batch.length
      console.warn(
        'Bulk regenerate batch failed:',
        getApiErrorMessage(e, 'Card generation request failed.'),
      )
    }

    processed += batch.length
    report('running')
    await yieldToUi()
  }

  report('done')
  return { succeeded, failed }
}
