import { getStudyCardDisplay, studyCardMetadataLine } from '@/domain/cardFaceText'
import type { GeneratedCardData } from '@/types/cards'
import type { SavedCard } from '@/types/cards'

type ReviewAnswerDetailsProps = {
  data?: GeneratedCardData
  card?: SavedCard
  variant?: 'default' | 'quiz'
}

export function ReviewAnswerDetails({
  data,
  card,
  variant = 'default',
}: ReviewAnswerDetailsProps) {
  if (variant === 'quiz' && card) {
    const display = getStudyCardDisplay(card)
    const metadata = studyCardMetadataLine(display)
    const hasExamples = display.examples.length > 0

    return (
      <div className="w-full">
        {display.meaning ? (
          <p className="whitespace-pre-wrap text-[clamp(1.25rem,5vw,1.75rem)] font-medium leading-snug text-slate-800 dark:text-slate-100">
            {display.meaning}
          </p>
        ) : (
          <p className="text-[16px] text-slate-400 dark:text-slate-500">No meaning yet</p>
        )}

        {display.englishMeaning ? (
          <p className="mt-2 whitespace-pre-wrap text-[16px] leading-relaxed text-slate-500 dark:text-slate-400">
            {display.englishMeaning}
          </p>
        ) : null}

        {metadata ? (
          <p className="mt-4 font-mono text-[14px] leading-relaxed text-slate-400 dark:text-slate-500">
            {metadata}
          </p>
        ) : null}

        {hasExamples ? (
          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            {display.examples.map((ex, i) => (
              <div key={`${ex.text}-${i}`}>
                <p className="text-[16px] leading-relaxed text-slate-700 dark:text-slate-200 md:text-[17px]">
                  {ex.text}
                </p>
                {ex.translation ? (
                  <p className="mt-1 text-[15px] italic text-slate-400 dark:text-slate-500 md:text-[16px]">
                    {ex.translation}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  const cardData = data ?? card?.data
  if (!cardData) return null

  const meaning = [cardData.targetMeaning, cardData.englishMeaning].filter(Boolean).join(' · ')
  const hasExamples = cardData.examples.length > 0

  return (
    <div className="w-full space-y-4 text-left">
      {meaning ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Meaning
          </p>
          <p className="mt-1 text-[17px] font-medium leading-snug text-slate-800 dark:text-slate-100">
            {meaning}
          </p>
        </div>
      ) : null}

      {cardData.phonetic ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Phonetic
          </p>
          <p className="mt-1 font-mono text-[15px] text-violet-600 dark:text-violet-300">
            {cardData.phonetic}
          </p>
        </div>
      ) : null}

      {cardData.partOfSpeech ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Part of speech
          </p>
          <p className="mt-1">
            <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-[13px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {cardData.partOfSpeech}
            </span>
          </p>
        </div>
      ) : null}

      {hasExamples ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Examples
          </p>
          <ul className="mt-2 space-y-2">
            {cardData.examples.map((ex, i) => (
              <li
                key={`${ex.text}-${i}`}
                className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 dark:border-slate-700/80 dark:bg-slate-900/40"
              >
                <p className="text-[14px] leading-relaxed text-slate-800 dark:text-slate-100">
                  {ex.text}
                </p>
                {ex.translation ? (
                  <p className="mt-1 text-[13px] italic text-slate-500 dark:text-slate-400">
                    {ex.translation}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
