import { exampleSentence } from '@/domain/languageCardData'
import type { ExampleSentenceDto } from '@/types/cards'

type FlashcardExampleListProps = {
  examples: ExampleSentenceDto[]
  variant?: 'study' | 'quiz' | 'preview' | 'edit'
  contentAlign?: 'start' | 'center'
  includeTranslation?: boolean
  showEmptyWarning?: boolean
}

function sentenceClass(variant: FlashcardExampleListProps['variant']): string {
  if (variant === 'study') {
    return 'text-[clamp(1.05rem,3vw,1.15rem)] leading-relaxed text-slate-800 dark:text-slate-100'
  }
  return 'text-[15px] leading-relaxed text-slate-800 dark:text-slate-100 md:text-[16px]'
}

function translationClass(variant: FlashcardExampleListProps['variant']): string {
  if (variant === 'study') {
    return 'text-[clamp(0.95rem,2.5vw,1.05rem)] leading-relaxed text-slate-500 dark:text-slate-400'
  }
  return 'text-[14px] leading-relaxed text-slate-500 dark:text-slate-400'
}

function FlashcardExampleDivider() {
  return <div className="my-2 border-t border-slate-200/80 dark:border-slate-700/60" role="separator" />
}

export function FlashcardExampleList({
  examples,
  variant = 'quiz',
  contentAlign = 'start',
  includeTranslation = true,
  showEmptyWarning,
}: FlashcardExampleListProps) {
  const centered = contentAlign === 'center'
  const populated = examples.filter((example) => exampleSentence(example))

  if (populated.length === 0) {
    if (!showEmptyWarning) return null
    return (
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-950/15">
        <p className="text-[14px] font-medium text-amber-900 dark:text-amber-200">
          ⚠ No examples were generated. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className={centered ? 'flex w-full flex-col items-center text-center' : 'flex flex-col'}>
      {populated.map((example, index) => (
        <div key={`${exampleSentence(example)}-${index}`} className={centered ? 'w-full' : undefined}>
          {index > 0 ? <FlashcardExampleDivider /> : null}
          <div className="flex flex-col gap-1.5 py-1">
            <p className={`${sentenceClass(variant)} ${centered ? 'text-balance' : ''}`}>
              {exampleSentence(example)}
            </p>
            {includeTranslation && example.translation ? (
              <p className={`${translationClass(variant)} italic`}>{example.translation}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
