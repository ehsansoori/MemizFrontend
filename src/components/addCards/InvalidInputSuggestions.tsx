type InvalidInputSuggestionsProps = {
  suggestions: string[]
  busy?: boolean
  onSuggestion: (word: string) => void
}

/** Inline alert shown below the input when AI cannot find the entered word. */
export function InvalidInputSuggestions({
  suggestions,
  busy,
  onSuggestion,
}: InvalidInputSuggestionsProps) {
  return (
    <div
      className="rounded-2xl border border-amber-200/90 bg-amber-50/80 px-4 py-3.5 dark:border-amber-900/40 dark:bg-amber-950/20"
      role="alert"
    >
      <p className="text-[14px] font-semibold text-amber-900 dark:text-amber-200">Word not found</p>
      <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
        Please check the spelling.
      </p>

      {suggestions.length > 0 ? (
        <div className="mt-3">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Did you mean:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={busy}
                onClick={() => onSuggestion(suggestion)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[13px] font-semibold text-slate-800 transition hover:border-accent hover:text-accent active:scale-[0.98] disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-accent"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
