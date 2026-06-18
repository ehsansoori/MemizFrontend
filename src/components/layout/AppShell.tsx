import { Outlet, useLocation } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { WorkspaceHeaderStrip } from '@/components/controls/WorkspaceHeaderStrip'

export function AppShell() {
  const { pathname } = useLocation()
  const onAddCards = pathname === '/add-cards'
  const onQuiz = /^\/decks\/[^/]+\/quiz$/.test(pathname)
  const onStudy = /^\/decks\/[^/]+\/study$/.test(pathname)

  const trailing = onAddCards ? (
    <div className="hidden items-center gap-3 sm:flex">
      <WorkspaceHeaderStrip />
    </div>
  ) : null

  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-slate-950">
      {!onQuiz && !onStudy ? <AppHeader trailing={trailing} /> : null}
      <div
        className={[
          'flex min-h-0 flex-1 flex-col',
          onQuiz || onStudy ? 'overflow-hidden' : 'overflow-y-auto',
        ].join(' ')}
      >
        <Outlet />
      </div>
    </div>
  )
}
