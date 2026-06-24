import type { CardPronunciationDto } from '@/types/cards'

/** Default accent sources when the deck source language is English. */
export const DEFAULT_ENGLISH_PRONUNCIATION_SOURCES = ['us', 'br'] as const

export function defaultPronunciationSourcesForLanguage(sourceLanguage?: string): string[] {
  if (!sourceLanguage || sourceLanguage === 'en') {
    return [...DEFAULT_ENGLISH_PRONUNCIATION_SOURCES]
  }
  return []
}

export function normalizePronunciationSource(value: string): string {
  return value.trim().toLowerCase()
}

export function normalizePronunciationSources(sources: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of sources) {
    const normalized = normalizePronunciationSource(raw)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
  }
  return result
}

/** Map API pronunciation rows onto request sources (order preserved). */
export function zipPronunciationsWithSources(
  sources: string[],
  rows: CardPronunciationDto[],
): CardPronunciationDto[] {
  if (rows.length === 0) return []
  return rows
    .map((row, index) => ({
      accent: normalizePronunciationSource(row.accent || sources[index] || ''),
      phonetic: row.phonetic?.trim() ?? '',
    }))
    .filter((row) => row.phonetic)
}

export function formatPronunciationsForDisplay(
  pronunciations: CardPronunciationDto[],
): string {
  return pronunciations
    .filter((p) => p.phonetic.trim())
    .map((p) => (p.accent.trim() ? `${p.accent.trim()} ${p.phonetic.trim()}` : p.phonetic.trim()))
    .join('\n')
}

export function parsePronunciationsFromText(text: string): CardPronunciationDto[] {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  return lines.map((line) => {
    const match = line.match(/^([a-z]{2,3})\s+(.+)$/i)
    if (match) {
      return {
        accent: normalizePronunciationSource(match[1]),
        phonetic: match[2].trim(),
      }
    }
    return { accent: '', phonetic: line }
  })
}
