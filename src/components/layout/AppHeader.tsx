import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AppNav } from '@/components/layout/AppNav'
import { GlobalSearchButton } from '@/components/layout/GlobalSearchButton'
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { useAuthStore } from '@/store/auth/authStore'

type AppHeaderProps = {
  /** Deck picker, draft stats — desktop header only. */
  trailing?: ReactNode
}

function MemizBrand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-400/80 bg-white text-sm font-semibold text-slate-700 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-200"
        aria-hidden
      >
        M
      </span>
      <div className="min-w-0">
        <p className="text-[16px] font-bold leading-tight text-slate-900 dark:text-white">Memiz</p>
        {!compact ? (
          <p className="text-[11px] leading-tight text-slate-600 dark:text-slate-400">
            AI flashcard workspace
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function AppHeader({ trailing }: AppHeaderProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [menuOpen, setMenuOpen] = useState(false)

  const accountLabel = user?.name?.trim() || user?.email || 'Account'

  return (
    <header className="shrink-0 border-b border-slate-200/90 bg-[#ececec] dark:border-slate-700 dark:bg-[#2a2a2a]">
      {/* Mobile: hamburger | Memiz | theme */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:hidden">
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-drawer"
          onClick={() => setMenuOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-700 transition active:bg-slate-200/80 dark:text-slate-200 dark:active:bg-slate-700/80"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <Link to="/decks" className="min-w-0 flex-1" onClick={() => setMenuOpen(false)}>
          <MemizBrand compact />
        </Link>

        <ThemeToggle compact />
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-2.5 sm:flex sm:px-8">
        <Link to="/decks" className="min-w-0">
          <MemizBrand />
        </Link>

        <AppNav />

        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-3 sm:gap-4">
          <GlobalSearchButton />
          {trailing}
          <span
            className="max-w-[10rem] truncate text-[13px] text-slate-600 dark:text-slate-400"
            title={user?.email}
          >
            {accountLabel}
          </span>
          <button
            type="button"
            className="text-[13px] text-accent hover:underline"
            onClick={() => logout()}
          >
            Log Out
          </button>
          <ThemeToggle />
        </div>
      </div>

      <MobileNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  )
}
