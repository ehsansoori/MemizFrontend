import type { ReactNode } from 'react'
import { AppNav } from '@/components/layout/AppNav'
import { GlobalSearchButton } from '@/components/layout/GlobalSearchButton'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { useAuthStore } from '@/store/auth/authStore'

type AppHeaderProps = {
  /** Deck picker, draft stats — right side before account links. */
  trailing?: ReactNode
}

export function AppHeader({ trailing }: AppHeaderProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const accountLabel = user?.name?.trim() || user?.email || 'Account'

  return (
    <header className="border-b border-slate-200/90 bg-[#ececec] dark:border-slate-700 dark:bg-[#2a2a2a]">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-2.5 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-400/80 bg-white text-sm font-semibold text-slate-700 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-200"
            aria-hidden
          >
            M
          </span>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold leading-tight text-slate-900 dark:text-white">
              Memiz
            </h1>
            <p className="text-[11px] leading-tight text-slate-600 dark:text-slate-400">
              AI flashcard workspace
            </p>
          </div>
        </div>

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
    </header>
  )
}
