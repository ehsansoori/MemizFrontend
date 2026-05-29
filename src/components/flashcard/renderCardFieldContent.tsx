import type { ReactNode } from 'react'
import type { CardFieldKey, GeneratedCardData } from '@/types/cards'

export function renderCardFieldContent(
  data: GeneratedCardData,
  field: CardFieldKey,
): ReactNode {
  switch (field) {
    case 'word':
      return data.word ? (
        <span className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {data.word}
        </span>
      ) : null
    case 'phonetic':
      return data.phonetic ? (
        <span className="font-mono text-sm text-violet-600 dark:text-violet-300">
          {data.phonetic}
        </span>
      ) : null
    case 'partOfSpeech':
      return data.partOfSpeech ? (
        <span className="inline-block rounded-md bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {data.partOfSpeech}
        </span>
      ) : null
    case 'targetMeaning':
      return data.targetMeaning ?? null
    case 'englishMeaning':
      return data.englishMeaning ?? null
    case 'examples':
      return data.examples.length > 0 ? (
        <ul className="list-none space-y-2 pl-0">
          {data.examples.map((ex, i) => (
            <li
              key={`ex-${i}`}
              className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-sm dark:border-slate-700/80 dark:bg-slate-900/50"
            >
              {ex.text}
            </li>
          ))}
        </ul>
      ) : null
    case 'exampleTranslations':
      return data.examples.some((e) => e.translation) ? (
        <ul className="list-none space-y-2 pl-0">
          {data.examples.map(
            (ex, i) =>
              ex.translation ? (
                <li
                  key={`tr-${i}`}
                  className="rounded-lg border border-violet-200/60 bg-violet-50/50 px-3 py-2 text-sm italic text-slate-700 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-slate-300"
                >
                  {ex.translation}
                </li>
              ) : null,
          )}
        </ul>
      ) : null
    case 'notes':
      return data.notes?.trim() ? (
        <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">
          {data.notes}
        </p>
      ) : null
    default:
      return null
  }
}
