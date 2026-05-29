import { GoogleOAuthProvider } from '@react-oauth/google'
import type { ReactNode } from 'react'
import { getGoogleClientId, isGoogleAuthConfigured } from '@/config/env'

type GoogleAuthRootProps = {
  children: ReactNode
}

/**
 * Wraps the app with Google OAuth when configured.
 * If not configured, children still render (login shows setup instructions).
 */
export function GoogleAuthRoot({ children }: GoogleAuthRootProps) {
  const clientId = getGoogleClientId()

  if (!isGoogleAuthConfigured()) {
    return <>{children}</>
  }

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
}
