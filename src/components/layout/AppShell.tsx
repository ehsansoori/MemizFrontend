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
    <div
      className={[
        'flex flex-col bg-white dark:bg-slate-950',
        onQuiz || onStudy ? 'h-dvh max-h-dvh overflow-hidden' : 'min-h-dvh',
      ].join(' ')}
    >
      {!onQuiz && !onStudy ? <AppHeader trailing={trailing} /> : null}
      <div
        className={[
          'flex min-h-0 flex-1 flex-col',
          onQuiz || onStudy ? 'h-full overflow-hidden' : 'overflow-y-auto',
        ].join(' ')}
      >
        <Outlet />
      </div>
    </div>
  )
}
