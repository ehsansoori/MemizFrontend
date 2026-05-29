import { Button } from '@/components/ui/Button'

type UnknownWordCardProps = {
  originalWord: string
  suggestions: string[]
  editMode: boolean
  draft: string
  busy?: boolean
  onDraftChange: (value: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveAndGenerate: () => void
  onSuggestion: (word: string) => void
  onUseWordAnyway: () => void
}

export function UnknownWordCard({
  originalWord,
  suggestions,
  editMode,
  draft,
  busy,
  onDraftChange,
  onStartEdit,
  onCancelEdit,
  onSaveAndGenerate,
  onSuggestion,
  onUseWordAnyway,
}: UnknownWordCardProps) {
  return (
    <div className="w-full rounded-2xl border border-amber-200 bg-amber-50/70 p-6 dark:border-amber-900/50 dark:bg-amber-950/20">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Unknown word</p>

      {editMode ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Edit the word, then generate again for this card only.
          </p>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Word
            </span>
            <input
              type="text"
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              disabled={busy}
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !busy) {
                  e.preventDefault()
                  onSaveAndGenerate()
                }
                if (e.key === 'Escape' && !busy) {
                  e.preventDefault()
                  onCancelEdit()
                }
              }}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              loading={busy}
              disabled={!draft.trim()}
              onClick={onSaveAndGenerate}
            >
              Save &amp; Generate
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium">Typed word:</span>{' '}
            <span className="font-semibold text-accent">{originalWord}</span>
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            This word was not recognized.
          </p>
          {busy ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Generating…</p>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                Suggestions
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={busy}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-accent hover:text-accent disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    onClick={() => onSuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={busy} onClick={onStartEdit}>
              Generate again
            </Button>
            <Button type="button" variant="primary" disabled={busy} onClick={onUseWordAnyway}>
              Use my word anyway
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
