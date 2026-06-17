import type { SavedCard } from '@/types/cards'
import { cardFaceDisplayText } from '@/utils/renderCardFace'

export function savedCardFrontText(card: SavedCard): string {
  return cardFaceDisplayText(card.front) || card.data.word
}

/** Primary word label for compact list views (browse). */
export function savedCardWord(card: SavedCard): string {
  return card.data.word.trim() || savedCardFrontText(card).split('\n')[0]?.trim() || 'Untitled'
}

const MEANING_LABEL_RE = /meaning|translation|definition/i
const PHONETIC_LABEL_RE = /pronunciation|phonetic/i
const POS_LABEL_RE = /part of speech|^pos$/i

export type StudyCardDisplay = {
  word: string
  meaning: string
  englishMeaning?: string
  phonetic?: string
  partOfSpeech?: string
  examples: { text: string; translation?: string }[]
}

function formatStudyPhonetic(phonetic: string): string {
  const trimmed = phonetic.trim()
  if (!trimmed) return ''
  const inner = trimmed.replace(/^\/+|\/+$/g, '').trim()
  return `/ ${inner} /`
}

function sectionBodyFirstLine(body: string): string {
  return body.split('\n')[0]?.trim() || body.trim()
}

/** Structured content for the Study flashcard view. */
export function getStudyCardDisplay(card: SavedCard): StudyCardDisplay {
  const word = savedCardWord(card)
  let meaning = card.data.targetMeaning?.trim() ?? ''
  let englishMeaning = card.data.englishMeaning?.trim()
  let phonetic = card.data.phonetic?.trim()
  let partOfSpeech = card.data.partOfSpeech?.trim()

  const sections = parseCardFaceSections(card.back)
  for (const section of sections) {
    const label = section.label ?? ''
    const line = sectionBodyFirstLine(section.body)
    if (!meaning && MEANING_LABEL_RE.test(label)) meaning = line
    if (!phonetic && PHONETIC_LABEL_RE.test(label)) phonetic = line
    if (!partOfSpeech && POS_LABEL_RE.test(label)) partOfSpeech = line
  }

  if (!meaning) {
    meaning = savedCardMeaning(card)
    if (meaning === englishMeaning) englishMeaning = undefined
  }

  if (englishMeaning && englishMeaning === meaning) {
    englishMeaning = undefined
  }

  return {
    word,
    meaning,
    englishMeaning,
    phonetic: phonetic ? formatStudyPhonetic(phonetic) : undefined,
    partOfSpeech,
    examples: card.data.examples,
  }
}

export function studyCardMetadataLine(display: StudyCardDisplay): string {
  return [display.phonetic, display.partOfSpeech].filter(Boolean).join(' • ')
}

/** Short meaning line for browse rows — excludes pronunciation, POS, examples. */
export function savedCardMeaning(card: SavedCard): string {
  const target = card.data.targetMeaning?.trim()
  if (target) return target
  const english = card.data.englishMeaning?.trim()
  if (english) return english

  const sections = parseCardFaceSections(card.back)
  for (const section of sections) {
    const label = section.label ?? ''
    if (MEANING_LABEL_RE.test(label)) {
      return section.body.split('\n')[0]?.trim() || section.body
    }
  }

  const unlabeled = sections.find((s) => !s.label)
  if (unlabeled) {
    return unlabeled.body.split('\n')[0]?.trim() || unlabeled.body
  }

  return ''
}

export function savedCardMeaningPreview(card: SavedCard, maxLength = 64): string {
  const text = savedCardMeaning(card)
  if (!text) return 'No meaning yet'
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

export function savedCardBackText(card: SavedCard): string {
  return (
    cardFaceDisplayText(card.back) ||
    card.data.targetMeaning ||
    card.data.englishMeaning ||
    'No meaning yet'
  )
}

export function savedCardBackPreview(card: SavedCard, maxLength = 72): string {
  const text = savedCardBackText(card)
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

export type CardFaceSection = {
  label?: string
  body: string
}

/** Split a persisted face string into labeled sections for study display. */
export function parseCardFaceSections(raw: string): CardFaceSection[] {
  const trimmed = raw.trim()
  if (!trimmed) return []

  return trimmed
    .split(/\n\n+/)
    .map((block) => {
      const lines = block.split('\n')
      if (lines.length > 1) {
        const label = lines[0]?.trim() ?? ''
        const body = lines.slice(1).join('\n').trim()
        if (body) return { label, body }
      }
      const body = block.trim()
      return body ? { body } : null
    })
    .filter((section): section is CardFaceSection => section !== null)
}

export function savedCardBackSections(card: SavedCard): CardFaceSection[] {
  const fromFace = parseCardFaceSections(card.back)
  if (fromFace.length > 0) return fromFace
  const text = savedCardBackText(card)
  return text ? [{ body: text }] : []
}
