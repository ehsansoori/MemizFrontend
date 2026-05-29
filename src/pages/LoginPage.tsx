import { useState } from 'react'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { isGoogleAuthConfigured } from '@/config/env'
import { getApiErrorMessage } from '@/services/api/getApiErrorMessage'
import { useAuthStore } from '@/store/auth/authStore'

export function LoginPage() {
  const signInWithGoogleCredential = useAuthStore((s) => s.signInWithGoogleCredential)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const googleReady = isGoogleAuthConfigured()

  const handleSuccess = async (response: CredentialResponse) => {
    const credential = response.credential
    if (!credential) {
      setError('Google did not return a sign-in token.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await signInWithGoogleCredential(credential)
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not sign in with Google.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 py-12 dark:bg-slate-950">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex flex-col items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-400/80 bg-white text-lg font-semibold text-slate-700 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-200"
            aria-hidden
          >
            M
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Memiz
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              AI flashcard workspace
            </p>
          </div>
        </div>

        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          Private beta — sign in to continue.
        </p>

        {!googleReady ? (
          <div
            className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-left text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
            role="status"
          >
            <p className="font-medium">Google sign-in is not configured yet</p>
            <p className="mt-2 text-[13px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
              Add your client ID to{' '}
              <code className="rounded bg-white/80 px-1 py-0.5 dark:bg-black/20">
                .env.local
              </code>
              :
            </p>
            <p className="mt-2 rounded-lg bg-white/70 px-2 py-2 text-left font-mono text-[11px] break-all dark:bg-black/20">
              VITE_GOOGLE_CLIENT_ID=
              <br />
              your-id.apps.googleusercontent.com
            </p>
            <p className="mt-2 text-[13px] text-amber-900/80 dark:text-amber-200/80">
              Restart the dev server after saving (<code>npm run dev</code>). See README for
              setup steps.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              In Google Cloud Console, add this origin under your OAuth client:{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
                {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}
              </code>
            </p>
          <div className="flex justify-center">
            {busy ? (
              <p className="text-sm text-slate-500">Signing in…</p>
            ) : (
              <GoogleLogin
                onSuccess={(res) => void handleSuccess(res)}
                onError={() => setError('Google sign-in was cancelled or failed.')}
                text="continue_with"
                shape="rectangular"
                theme="outline"
                size="large"
                width="280"
              />
            )}
          </div>
          </>
        )}

        {error ? (
          <p
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
