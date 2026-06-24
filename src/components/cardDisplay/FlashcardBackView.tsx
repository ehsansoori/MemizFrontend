import { FlashcardExampleList } from '@/components/cardDisplay/FlashcardExampleList'
import {
  flashcardShowsExamplesSection,
  getFlashcardBackModel,
  type FlashcardBackModel,
} from '@/domain/flashcardBackDisplay'
import type { TemplateCardBlock } from '@/domain/templateCardBlocks'
import type { GeneratedCardData } from '@/types/cards'

type FlashcardContentAlign = 'start' | 'center'

type FlashcardBackViewProps = {
  data: GeneratedCardData
  blocks?: TemplateCardBlock[]
  variant?: 'study' | 'quiz' | 'preview'
  contentAlign?: FlashcardContentAlign
  showWord?: boolean
  expectExamples?: boolean
  invalid?: {
    suggestions: string[]
  } | null
  onSuggestionClick?: (word: string) => void
  suggestionsBusy?: boolean
}

function wordSizeClass(variant: FlashcardBackViewProps['variant']): string {
  if (variant === 'study') {
    return 'font-display text-[clamp(2rem,8vw,3.25rem)] font-bold leading-[1.08] tracking-tight'
  }
  if (variant === 'quiz') {
    return 'font-display text-[clamp(1.75rem,6vw,2.5rem)] font-bold leading-tight tracking-tight'
  }
  return 'font-display text-[clamp(1.5rem,5vw,2rem)] font-bold leading-tight tracking-tight'
}

function translationSizeClass(variant: FlashcardBackViewProps['variant']): string {
  if (variant === 'study') {
    return 'text-[clamp(1.5rem,5vw,2.25rem)] font-semibold leading-snug'
  }
  if (variant === 'quiz') {
    return 'text-[clamp(1.25rem,4.5vw,1.875rem)] font-semibold leading-snug'
  }
  return 'text-[clamp(1.125rem,4vw,1.5rem)] font-semibold leading-snug'
}

function InvalidFlashcardBack({
  suggestions,
  onSuggestionClick,
  busy,
}: {
  suggestions: string[]
  onSuggestionClick?: (word: string) => void
  busy?: boolean
}) {
  return (
    <div
      className="rounded-2xl border border-amber-200/90 bg-amber-50/80 px-5 py-6 dark:border-amber-900/40 dark:bg-amber-950/20"
      role="alert"
    >
      <p className="text-[16px] font-bold text-amber-900 dark:text-amber-200">⚠ Word not found</p>
      <p className="mt-2 text-[14px] leading-relaxed text-slate-700 dark:text-slate-300">
        Word or phrase not found. Please check the spelling.
      </p>

      {suggestions.length > 0 ? (
        <div className="mt-5">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Did you mean:
          </p>
          <div className="mt-3 flex flex-col items-start gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={busy || !onSuggestionClick}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[14px] font-semibold text-slate-800 transition hover:border-accent hover:text-accent active:scale-[0.98] disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-accent"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-5 text-[14px] text-slate-600 dark:text-slate-400">No suggestions available.</p>
      )}

      {busy ? (
        <p className="mt-4 text-[13px] text-slate-500 dark:text-slate-400">Generating…</p>
      ) : null}
    </div>
  )
}

function stackClass(contentAlign: FlashcardContentAlign | undefined): string {
  return contentAlign === 'center' ? 'items-center' : 'items-start'
}

function DisplayBackBlock({
  block,
  model,
  data,
  variant,
  expectExamples,
  contentAlign,
}: {
  block: TemplateCardBlock
  model: FlashcardBackModel
  data: GeneratedCardData
  variant: FlashcardBackViewProps['variant']
  expectExamples: boolean
  contentAlign?: FlashcardContentAlign
}) {
  const centered = contentAlign === 'center'
  const textCenter = centered ? 'text-center' : ''

  if (block.type === 'examples') {
    const showExamples = flashcardShowsExamplesSection(model, { expectExamples })
    if (!showExamples) return null
    return (
      <FlashcardExampleList
        examples={data.examples}
        variant={variant}
        includeTranslation={block.includeTranslation}
        showEmptyWarning={expectExamples && model.examples.length === 0}
        contentAlign={contentAlign}
      />
    )
  }

  if (block.type === 'pronunciations' && model.pronunciations.length > 0) {
    return (
      <div className={`flex flex-col gap-2 ${stackClass(contentAlign)}`}>
        {model.pronunciations.map((pronunciation, index) => (
          <span
            key={`${pronunciation.accent}-${pronunciation.phonetic}-${index}`}
            className="inline-flex items-center gap-1.5 font-mono text-[14px] text-slate-500 dark:text-slate-400"
          >
            {pronunciation.accent ? (
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {pronunciation.accent}
              </span>
            ) : null}
            {pronunciation.phonetic}
          </span>
        ))}
      </div>
    )
  }

  if (block.type !== 'simple') return null

  if (block.patchKey === 'input' && model.input) {
    return (
      <h2
        className={`${wordSizeClass(variant)} text-balance text-slate-900 dark:text-white ${textCenter}`}
      >
        {model.input}
      </h2>
    )
  }

  if (block.patchKey === 'translation' && model.translation) {
    return (
      <p
        className={`${translationSizeClass(variant)} text-balance text-slate-900 dark:text-white ${textCenter}`}
      >
        {model.translation}
      </p>
    )
  }

  if (block.patchKey === 'partOfSpeech' && model.partOfSpeech.length > 0) {
    return (
      <div
        className={
          centered
            ? 'flex flex-wrap justify-center gap-2'
            : 'flex flex-col items-start gap-2'
        }
      >
        {model.partOfSpeech.map((pos) => (
          <span
            key={pos}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            {pos}
          </span>
        ))}
      </div>
    )
  }

  return null
}

function LegacyOrderedBack({
  model,
  data,
  variant,
  expectExamples,
}: {
  model: FlashcardBackModel
  data: GeneratedCardData
  variant: FlashcardBackViewProps['variant']
  expectExamples: boolean
}) {
  const showExamples = flashcardShowsExamplesSection(model, { expectExamples })

  return (
    <>
      {model.translation ? (
        <p className={`${translationSizeClass(variant)} text-slate-900 dark:text-white`}>
          {model.translation}
        </p>
      ) : null}

      {model.partOfSpeech.length > 0 ? (
        <div className="flex flex-col items-start gap-2">
          {model.partOfSpeech.map((pos) => (
            <span
              key={pos}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {pos}
            </span>
          ))}
        </div>
      ) : null}

      {model.pronunciations.length > 0 ? (
        <div className="flex flex-col items-start gap-2">
          {model.pronunciations.map((pronunciation, index) => (
            <span
              key={`${pronunciation.accent}-${pronunciation.phonetic}-${index}`}
              className="inline-flex items-center gap-1.5 font-mono text-[14px] text-slate-500 dark:text-slate-400"
            >
              {pronunciation.accent ? (
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {pronunciation.accent}
                </span>
              ) : null}
              {pronunciation.phonetic}
            </span>
          ))}
        </div>
      ) : null}

      {showExamples ? (
        <FlashcardExampleList
          examples={data.examples}
          variant={variant}
          includeTranslation
          showEmptyWarning={expectExamples && model.examples.length === 0}
        />
      ) : null}
    </>
  )
}

export function FlashcardBackView({
  data,
  blocks,
  variant = 'quiz',
  contentAlign = 'start',
  showWord = false,
  expectExamples = false,
  invalid,
  onSuggestionClick,
  suggestionsBusy,
}: FlashcardBackViewProps) {
  if (invalid) {
    return (
      <InvalidFlashcardBack
        suggestions={invalid.suggestions}
        onSuggestionClick={onSuggestionClick}
        busy={suggestionsBusy}
      />
    )
  }

  const resolvedExpectExamples = blocks
    ? blocks.some((block) => block.type === 'examples')
    : expectExamples
  const model = getFlashcardBackModel(data)

  const centered = contentAlign === 'center'

  return (
    <div
      className={[
        'flex flex-col gap-4 sm:gap-5',
        centered ? 'items-center text-center' : '',
      ].join(' ')}
    >
      {showWord && model.input ? (
        <h2
          className={`${wordSizeClass(variant)} text-balance text-slate-900 dark:text-white ${centered ? 'text-center' : ''}`}
        >
          {model.input}
        </h2>
      ) : null}

      {blocks ? (
        blocks.map((block) => (
          <DisplayBackBlock
            key={block.id}
            block={block}
            model={model}
            data={data}
            variant={variant}
            expectExamples={resolvedExpectExamples}
            contentAlign={contentAlign}
          />
        ))
      ) : (
        <LegacyOrderedBack
          model={model}
          data={data}
          variant={variant}
          expectExamples={resolvedExpectExamples}
        />
      )}
    </div>
  )
}
