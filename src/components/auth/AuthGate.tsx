import type { ReactNode } from 'react'
import { LoginPage } from '@/pages/LoginPage'
import { useAuthHydrated } from '@/hooks/auth/useAuthHydrated'
import { selectIsAuthenticated, useAuthStore } from '@/store/auth/authStore'

type AuthGateProps = {
  children: ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const hydrated = useAuthHydrated()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white dark:bg-slate-950">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <>{children}</>
}
