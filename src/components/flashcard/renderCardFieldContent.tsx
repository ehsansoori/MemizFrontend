import type { ReactNode } from 'react'
import type { CardFieldKey, GeneratedCardData } from '@/types/cards'
import { cardInput, exampleSentence, exampleTranslation } from '@/domain/languageCardData'

export function renderCardFieldContent(
  data: GeneratedCardData,
  field: CardFieldKey,
): ReactNode {
  switch (field) {
    case 'input': {
      const input = cardInput(data)
      return input ? (
        <span className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {input}
        </span>
      ) : null
    }
    case 'translation':
      return data.translation ? (
        <span className="font-display text-xl font-semibold text-slate-900 dark:text-white">
          {data.translation}
        </span>
      ) : null
    case 'pronunciations':
      return data.pronunciations?.length ? (
        <div className="flex flex-col gap-1">
          {data.pronunciations.map((p, i) => (
            <span
              key={`${p.accent}-${p.phonetic}-${i}`}
              className="font-mono text-sm text-violet-600 dark:text-violet-300"
            >
              {p.accent ? `${p.accent} ` : ''}
              {p.phonetic}
            </span>
          ))}
        </div>
      ) : null
    case 'partOfSpeech':
      return data.partOfSpeech?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {data.partOfSpeech.map((pos) => (
            <span
              key={pos}
              className="inline-block rounded-md bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {pos}
            </span>
          ))}
        </div>
      ) : null
    case 'examples':
      return data.examples.length > 0 ? (
        <ul className="list-none space-y-2 pl-0">
          {data.examples.map((ex, i) => {
            const sentence = exampleSentence(ex)
            const tr = exampleTranslation(ex)
            if (!sentence && !tr) return null
            return (
              <li
                key={`ex-${i}`}
                className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-sm dark:border-slate-700/80 dark:bg-slate-900/50"
              >
                {sentence}
                {tr ? (
                  <p className="mt-1 text-sm italic text-slate-600 dark:text-slate-400">{tr}</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null
    default:
      return null
  }
}
