import { useCallback, useEffect, useRef, useState } from 'react'
import type { CardFieldKey, ExampleSentenceDto, GeneratedCardData } from '@/types/cards'
import { renderCardFieldContent } from '@/components/flashcard/renderCardFieldContent'
import { fieldLabel } from '@/utils/renderCardFace'

function examplesToLines(data: GeneratedCardData): string {
  return data.examples.map((e) => e.text).join('\n')
}

function translationsToLines(data: GeneratedCardData): string {
  return data.examples.map((e) => e.translation ?? '').join('\n')
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
    const text = exParts[i] ?? ''
    const translation = prev[i]?.translation
    if (!text && !translation) continue
    if (text) examples.push({ text, translation })
  }
  return { examples: examples.length ? examples : [] }
}

function mergeTranslationLines(
  data: GeneratedCardData,
  trLines: string,
): Partial<GeneratedCardData> {
  const trParts = trLines.split('\n').map((l) => l.trim())
  const examples = data.examples.map((ex, i) => ({
    ...ex,
    translation: (trParts[i] ?? '').trim() || undefined,
  }))
  return { examples }
}

function draftStringForField(fieldType: CardFieldKey, data: GeneratedCardData): string {
  switch (fieldType) {
    case 'word':
      return data.word
    case 'phonetic':
      return data.phonetic ?? ''
    case 'partOfSpeech':
      return data.partOfSpeech ?? ''
    case 'targetMeaning':
      return data.targetMeaning ?? ''
    case 'englishMeaning':
      return data.englishMeaning ?? ''
    case 'notes':
      return data.notes ?? ''
    case 'examples':
      return examplesToLines(data)
    case 'exampleTranslations':
      return translationsToLines(data)
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
      case 'word': {
        const word = draft.trim() || data.word
        if (word !== data.word) onCommit({ word })
        break
      }
      case 'phonetic': {
        const v = draft.trim() || undefined
        if (v !== data.phonetic) onCommit({ phonetic: v })
        break
      }
      case 'partOfSpeech': {
        const v = draft.trim() || undefined
        if (v !== data.partOfSpeech) onCommit({ partOfSpeech: v })
        break
      }
      case 'targetMeaning': {
        const v = draft.trim() || undefined
        if (v !== data.targetMeaning) onCommit({ targetMeaning: v })
        break
      }
      case 'englishMeaning': {
        const v = draft.trim() || undefined
        if (v !== data.englishMeaning) onCommit({ englishMeaning: v })
        break
      }
      case 'notes': {
        const v = draft.trim() || undefined
        if (v !== data.notes) onCommit({ notes: v })
        break
      }
      case 'examples': {
        const next = mergeExampleLines(data, draft)
        onCommit(next)
        break
      }
      case 'exampleTranslations': {
        onCommit(mergeTranslationLines(data, draft))
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

    const isMultiline =
      fieldType === 'englishMeaning' ||
      fieldType === 'notes' ||
      fieldType === 'examples' ||
      fieldType === 'exampleTranslations'

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
    fieldType === 'englishMeaning' ||
    fieldType === 'notes' ||
    fieldType === 'examples' ||
    fieldType === 'exampleTranslations'

  const wordClass =
    fieldType === 'word'
      ? 'font-display text-2xl font-semibold tracking-tight sm:text-3xl'
      : fieldType === 'phonetic'
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
          rows={fieldType === 'examples' || fieldType === 'exampleTranslations' ? 5 : 3}
          className={`${ghostTextarea} ${wordClass}`}
          aria-label={label}
          placeholder={
            fieldType === 'examples'
              ? 'One example sentence per line'
              : fieldType === 'exampleTranslations'
                ? 'One translation per line (aligned with examples)'
                : undefined
          }
        />
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          {fieldType === 'englishMeaning' || fieldType === 'notes'
            ? 'Ctrl+Enter to save · Esc cancels'
            : 'Ctrl+Enter to save · Esc cancels · Enter for newline'}
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
        className={`${ghostInput} ${wordClass}`}
        aria-label={label}
      />
    </div>
  )
}
