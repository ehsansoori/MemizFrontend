import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

const focusShellClass =
  'w-full rounded-lg border-0 bg-accent/[0.06] px-1.5 py-1 ring-2 ring-accent/20 outline-none transition dark:bg-accent/10'

type InlineEditableFlashcardFieldProps = {
  value: string
  onCommit: (value: string) => void
  disabled?: boolean
  multiline?: boolean
  placeholder?: string
  emptyHint?: string
  displayClassName?: string
  editClassName?: string
  renderDisplay?: (value: string) => ReactNode
  hideWhenEmpty?: boolean
  ariaLabel?: string
  /** Preview mode: plain text until clicked, minimal chrome. */
  variant?: 'default' | 'preview'
  /** Shrink to content width (e.g. pronunciation lines). */
  inline?: boolean
}

export function InlineEditableFlashcardField({
  value,
  onCommit,
  disabled = false,
  multiline = false,
  placeholder,
  emptyHint = 'Tap to add…',
  displayClassName = 'text-base leading-relaxed text-slate-900 dark:text-slate-100',
  editClassName = '',
  renderDisplay,
  hideWhenEmpty = false,
  ariaLabel,
  variant = 'default',
  inline = false,
}: InlineEditableFlashcardFieldProps) {
  const isPreview = variant === 'preview'
  const focusClass = isPreview
    ? 'rounded-md border-0 bg-accent/[0.08] px-1 py-0.5 ring-1 ring-accent/30 outline-none dark:bg-accent/10'
    : focusShellClass
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const snapshotRef = useRef(value)
  const skipBlurRef = useRef(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  const beginEdit = useCallback(() => {
    if (disabled) return
    snapshotRef.current = value
    setDraft(value)
    setEditing(true)
  }, [disabled, value])

  useEffect(() => {
    if (!editing || !inputRef.current) return
    inputRef.current.focus()
    if (variant === 'preview') {
      inputRef.current.select()
      return
    }
    const len = inputRef.current.value.length
    inputRef.current.setSelectionRange(len, len)
  }, [editing, variant])

  const endEdit = useCallback(
    (commit: boolean) => {
      if (commit) onCommit(draft)
      else setDraft(snapshotRef.current)
      setEditing(false)
    },
    [draft, onCommit],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      skipBlurRef.current = true
      endEdit(false)
      queueMicrotask(() => {
        skipBlurRef.current = false
      })
      return
    }

    if (!multiline && e.key === 'Enter') {
      e.preventDefault()
      endEdit(true)
      return
    }

    if (multiline && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      endEdit(true)
    }
  }

  const onBlur = () => {
    if (skipBlurRef.current) return
    endEdit(true)
  }

  const trimmed = value.trim()
  const showEmpty = !trimmed

  if (disabled) {
    if (hideWhenEmpty && showEmpty) return null
    if (showEmpty) return null
    return (
      <div className={displayClassName}>
        {renderDisplay ? renderDisplay(value) : value}
      </div>
    )
  }

  if (editing) {
    const className = `${focusClass} ${editClassName} ${inline ? 'min-w-[8rem]' : 'w-full'} ${multiline ? 'min-h-[2.75rem] resize-none' : ''}`

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          rows={multiline ? 2 : 1}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={className}
        />
      )
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={className}
      />
    )
  }

  if (hideWhenEmpty && showEmpty) return null

  const widthClass = inline ? 'inline-block w-auto max-w-full' : 'block w-full'

  return (
    <button
      type="button"
      onClick={beginEdit}
      className={[
        widthClass,
        'rounded-md border-0 bg-transparent text-left transition',
        isPreview
          ? 'cursor-text px-0 py-0 hover:bg-slate-100/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/25 dark:hover:bg-slate-800/50'
          : 'px-0 py-0.5 hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 dark:hover:bg-slate-800/40',
        showEmpty && !isPreview ? 'text-[13px] italic text-slate-400 dark:text-slate-500' : displayClassName,
      ].join(' ')}
      aria-label={ariaLabel ?? (showEmpty && !isPreview ? emptyHint : 'Edit field')}
    >
      {showEmpty && !isPreview ? (
        emptyHint
      ) : renderDisplay ? (
        renderDisplay(value)
      ) : (
        <span className="whitespace-pre-wrap">{value}</span>
      )}
    </button>
  )
}
