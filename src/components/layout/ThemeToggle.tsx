import { useLayoutEffect, useState } from 'react'

const STORAGE_KEY = 'memiz-theme'

type Theme = 'light' | 'dark' | 'system'

type ThemeToggleProps = {
  compact?: boolean
}

function getSystemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    /* private mode */
  }
  return 'system'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return getSystemDark() ? 'dark' : 'light'
  return theme
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useLayoutEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }

    const resolved = resolveTheme(theme)
    document.documentElement.classList.toggle('dark', resolved === 'dark')

    if (theme !== 'system') return undefined

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => {
      document.documentElement.classList.toggle('dark', mq.matches)
    }
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [theme])

  const cycle = () => {
    setTheme((t) => (t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light'))
  }

  const label =
    theme === 'light'
      ? 'Light theme'
      : theme === 'dark'
        ? 'Dark theme'
        : 'Match system'

  return (
    <button
      type="button"
      onClick={cycle}
      className={
        compact
          ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[18px] transition active:bg-slate-200/80 dark:active:bg-slate-700/80'
          : 'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-surface-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-surface-800'
      }
      aria-label={`Theme: ${label}. Click to cycle.`}
      title={label}
    >
      <span aria-hidden>{theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}</span>
      {!compact ? <span className="hidden sm:inline">{label}</span> : null}
    </button>
  )
}
