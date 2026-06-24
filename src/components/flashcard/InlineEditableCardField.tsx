import { useCallback, useEffect, useRef, useState } from 'react'
import type { CardFieldKey, ExampleSentenceDto, GeneratedCardData } from '@/types/cards'
import { renderCardFieldContent } from '@/components/flashcard/renderCardFieldContent'
import { cardInput, exampleSentence } from '@/domain/languageCardData'
import {
  formatPronunciationsForDisplay,
  parsePronunciationsFromText,
} from '@/domain/pronunciations'
import { fieldLabel } from '@/utils/renderCardFace'

function examplesToLines(data: GeneratedCardData): string {
  return data.examples.map((e) => exampleSentence(e)).join('\n')
}

function mergeExampleLines(
  data: GeneratedCardData,
  exLines: string,
): Partial<GeneratedCardData> {
  const exParts = exLines.split('\n').map((l) => l.trim())
  const prev = data.examples
  const examples: ExampleSentenceDto[] = []
  const n = Math.max(exParts.length, prev.length)
  for (let i = 0; i < n; i += 1) {
    const sentence = exParts[i] ?? ''
    const translation = prev[i]?.translation
    if (!sentence && !translation) continue
    if (sentence || translation) examples.push({ sentence, translation })
  }
  return { examples: examples.length ? examples : [] }
}

function draftStringForField(fieldType: CardFieldKey, data: GeneratedCardData): string {
  switch (fieldType) {
    case 'input':
      return cardInput(data)
    case 'translation':
      return data.translation ?? ''
    case 'pronunciations':
      return data.pronunciations?.length ? formatPronunciationsForDisplay(data.pronunciations) : ''
    case 'partOfSpeech':
      return data.partOfSpeech?.join(', ') ?? ''
    case 'examples':
      return examplesToLines(data)
    default: {
      const _exhaustive: never = fieldType
      return _exhaustive
    }
  }
}

const ghostInput =
  'w-full min-w-0 rounded-md border-0 bg-transparent px-0 py-0.5 text-base leading-relaxed text-slate-900 shadow-none outline-none ring-0 transition placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500/20 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-violet-400/25'

const ghostTextarea =
  'min-h-[4.5rem] w-full min-w-0 resize-y rounded-md border-0 bg-transparent px-0 py-0.5 text-base leading-relaxed text-slate-900 shadow-none outline-none ring-0 transition placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500/20 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-violet-400/25'

type InlineEditableCardFieldProps = {
  fieldType: CardFieldKey
  data: GeneratedCardData
  onCommit: (patch: Partial<GeneratedCardData>) => void
  readOnly: boolean
}

export function InlineEditableCardField({
  fieldType,
  data,
  onCommit,
  readOnly,
}: InlineEditableCardFieldProps) {
  const label = fieldLabel(fieldType)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const snapshotRef = useRef('')
  const skipBlurRef = useRef(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const beginEdit = useCallback(() => {
    if (readOnly) return
    const initial = draftStringForField(fieldType, data)
    snapshotRef.current = initial
    setDraft(initial)
    setEditing(true)
  }, [data, fieldType, readOnly])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current instanceof HTMLInputElement) {
        const len = inputRef.current.value.length
        inputRef.current.setSelectionRange(len, len)
      }
    }
  }, [editing])

  const revert = useCallback(() => {
    setDraft(snapshotRef.current)
  }, [])

  const commit = useCallback(() => {
    switch (fieldType) {
      case 'input': {
        const input = draft.trim() || cardInput(data)
        if (input !== cardInput(data)) onCommit({ input })
        break
      }
      case 'translation': {
        const v = draft.trim() || undefined
        if (v !== data.translation) onCommit({ translation: v })
        break
      }
      case 'pronunciations': {
        const parsed = parsePronunciationsFromText(draft)
        onCommit({ pronunciations: parsed.length > 0 ? parsed : undefined })
        break
      }
      case 'partOfSpeech': {
        const parts = draft.split(/\s*[,·]\s*/).map((p) => p.trim()).filter(Boolean)
        const next = parts.length > 0 ? parts : undefined
        const prev = data.partOfSpeech?.join(', ') ?? ''
        if (draft.trim() !== prev) onCommit({ partOfSpeech: next })
        break
      }
      case 'examples': {
        onCommit(mergeExampleLines(data, draft))
        break
      }
      default:
        break
    }
  }, [data, draft, fieldType, onCommit])

  const endEdit = useCallback(() => {
    setEditing(false)
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      skipBlurRef.current = true
      revert()
      endEdit()
      queueMicrotask(() => {
        skipBlurRef.current = false
      })
      return
    }

    const isMultiline = fieldType === 'translation' || fieldType === 'examples' || fieldType === 'pronunciations'

    if (!isMultiline && e.key === 'Enter') {
      e.preventDefault()
      commit()
      endEdit()
      return
    }

    if (isMultiline && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      commit()
      endEdit()
    }
  }

  const onBlur = () => {
    if (skipBlurRef.current) return
    commit()
    endEdit()
  }

  const display = renderCardFieldContent(data, fieldType)
  const hasDisplay = display != null

  if (readOnly) {
    return (
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
          {label}
        </p>
        <div className="text-base leading-relaxed text-slate-900 dark:text-slate-100">
          {hasDisplay ? (
            display
          ) : (
            <span className="text-sm text-slate-400 italic dark:text-slate-500">Empty</span>
          )}
        </div>
      </div>
    )
  }

  if (!editing) {
    return (
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
          {label}
        </p>
        <button
          type="button"
          onClick={beginEdit}
          className="group/edit -mx-1 w-full rounded-md px-1 py-0.5 text-left text-base leading-relaxed text-slate-900 transition-colors hover:bg-slate-100/80 focus-visible:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/25 dark:text-slate-100 dark:hover:bg-white/[0.06] dark:focus-visible:bg-white/[0.06]"
          aria-label={`Edit ${label}`}
        >
          {hasDisplay ? (
            <span className="block [&_*]:pointer-events-none">{display}</span>
          ) : (
            <span className="text-sm text-slate-400 italic opacity-90 group-hover/edit:text-slate-500 dark:text-slate-500 dark:group-hover/edit:text-slate-400">
              Click to add…
            </span>
          )}
        </button>
      </div>
    )
  }

  const isMultiline =
    fieldType === 'translation' || fieldType === 'examples' || fieldType === 'pronunciations'

  const inputClass =
    fieldType === 'input'
      ? 'font-display text-2xl font-semibold tracking-tight sm:text-3xl'
      : fieldType === 'pronunciations'
        ? 'font-mono text-sm text-violet-700 dark:text-violet-300'
        : ''

  if (isMultiline) {
    return (
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
          {label}
        </p>
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          rows={fieldType === 'examples' ? 5 : 3}
          className={`${ghostTextarea} ${inputClass}`}
          aria-label={label}
          placeholder={
            fieldType === 'examples'
              ? 'One example sentence per line'
              : fieldType === 'pronunciations'
                ? 'One pronunciation per line (optional accent prefix)'
                : undefined
          }
        />
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          Ctrl+Enter to save · Esc cancels · Enter for newline
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
        {label}
      </p>
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className={`${ghostInput} ${inputClass}`}
        aria-label={label}
      />
    </div>
  )
}
