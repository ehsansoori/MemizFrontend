import { Outlet, useLocation } from 'react-router-dom'
import { ActiveDeckSelector } from '@/components/layout/ActiveDeckSelector'
import { AppHeader } from '@/components/layout/AppHeader'
import { WorkspaceHeaderStrip } from '@/components/controls/WorkspaceHeaderStrip'

export function AppShell() {
  const { pathname } = useLocation()
  const onAddCards = pathname === '/add-cards'
  const showDeckPicker = onAddCards

  const trailing = (
    <>
      {showDeckPicker ? <ActiveDeckSelector /> : null}
      {onAddCards ? <WorkspaceHeaderStrip /> : null}
    </>
  )

  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-slate-950">
      <AppHeader trailing={trailing} />
      <Outlet />
    </div>
  )
}
