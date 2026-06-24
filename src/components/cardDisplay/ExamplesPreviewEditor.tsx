import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlashcardPreviewSection } from '@/components/cardDisplay/FlashcardPreviewPanel'
import {
  examplesToBlockText,
  hasVisibleExamples,
  parseExamplesFromBlockText,
} from '@/domain/exampleBlockText'
import { exampleSentence } from '@/domain/languageCardData'
import type { ExampleSentenceDto } from '@/types/cards'

const exampleSentenceClass =
  'text-[15px] leading-relaxed text-slate-800 dark:text-slate-100'

const exampleTranslationClass =
  'text-[14px] leading-relaxed text-slate-500 dark:text-slate-400'

const textareaClass =
  'w-full resize-y rounded-md border-0 bg-accent/[0.08] px-2.5 py-2 text-[14px] leading-relaxed text-slate-800 ring-1 ring-accent/30 outline-none transition dark:bg-accent/10 dark:text-slate-100'

type ExamplesPreviewEditorProps = {
  examples: ExampleSentenceDto[]
  count: number
  includeTranslation: boolean
  disabled?: boolean
  onCommit: (examples: ExampleSentenceDto[]) => void
}

export function ExamplesPreviewEditor({
  examples,
  count,
  includeTranslation,
  disabled,
  onCommit,
}: ExamplesPreviewEditorProps) {
  const items = useMemo(
    () => Array.from({ length: count }, (_, i) => examples[i] ?? { sentence: '' }),
    [examples, count],
  )

  const blockText = useMemo(
    () => examplesToBlockText(items, includeTranslation),
    [items, includeTranslation],
  )

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(blockText)
  const snapshotRef = useRef(blockText)
  const skipBlurRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!editing) setDraft(blockText)
  }, [blockText, editing])

  const visible = items.filter((item) => exampleSentence(item) || item.translation?.trim())

  const beginEdit = useCallback(() => {
    if (disabled) return
    snapshotRef.current = blockText
    setDraft(blockText)
    setEditing(true)
  }, [disabled, blockText])

  useEffect(() => {
    if (!editing || !textareaRef.current) return
    textareaRef.current.focus()
    textareaRef.current.select()
  }, [editing])

  const endEdit = useCallback(
    (commit: boolean) => {
      if (commit) {
        onCommit(parseExamplesFromBlockText(draft, count, includeTranslation))
      } else {
        setDraft(snapshotRef.current)
      }
      setEditing(false)
    },
    [draft, count, includeTranslation, onCommit],
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      skipBlurRef.current = true
      endEdit(false)
      queueMicrotask(() => {
        skipBlurRef.current = false
      })
      return
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      endEdit(true)
    }
  }

  const onBlur = () => {
    if (skipBlurRef.current) return
    endEdit(true)
  }

  if (!hasVisibleExamples(items) && disabled) return null

  if (editing) {
    return (
      <FlashcardPreviewSection title="Examples">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          rows={Math.max(8, draft.split('\n').length + 2)}
          aria-label="Edit all examples"
          className={textareaClass}
        />
      </FlashcardPreviewSection>
    )
  }

  return (
    <FlashcardPreviewSection title="Examples">
      <button
        type="button"
        onClick={beginEdit}
        disabled={disabled}
        className={[
          'w-full rounded-md border-0 bg-transparent px-0 py-1 text-left transition',
          disabled
            ? 'cursor-default'
            : 'cursor-text hover:bg-slate-100/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/25 dark:hover:bg-slate-800/50',
        ].join(' ')}
        aria-label="Edit all examples"
      >
        {visible.length > 0 ? (
          <ul className="space-y-3">
            {visible.map((item, index) => (
              <li key={index} className="flex gap-2.5">
                <span className="mt-1 shrink-0 text-[15px] text-slate-400" aria-hidden>
                  •
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className={exampleSentenceClass}>{exampleSentence(item)}</p>
                  {includeTranslation && item.translation?.trim() ? (
                    <p className={exampleTranslationClass}>{item.translation}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] italic text-slate-400">Tap to add examples</p>
        )}
      </button>
    </FlashcardPreviewSection>
  )
}
