import type { GeneratedCardData } from '@/types/cards'

type ReviewAnswerDetailsProps = {
  data: GeneratedCardData
}

export function ReviewAnswerDetails({ data }: ReviewAnswerDetailsProps) {
  const meaning = [data.targetMeaning, data.englishMeaning].filter(Boolean).join(' · ')
  const hasExamples = data.examples.length > 0

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

      {data.phonetic ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Phonetic
          </p>
          <p className="mt-1 font-mono text-[15px] text-violet-600 dark:text-violet-300">
            {data.phonetic}
          </p>
        </div>
      ) : null}

      {data.partOfSpeech ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Part of speech
          </p>
          <p className="mt-1">
            <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-[13px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {data.partOfSpeech}
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
            {data.examples.map((ex, i) => (
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
