import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { loginWithGoogle } from '@/services/api/authApi'
import type { AuthUser } from '@/types/auth'

const STORAGE_KEY = 'memiz-auth'

type AuthState = {
  token: string | null
  user: AuthUser | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
  signInWithGoogleCredential: (googleIdToken: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      login: (token, user) => set({ token, user }),

      logout: () => set({ token: null, user: null }),

      signInWithGoogleCredential: async (googleIdToken) => {
        const result = await loginWithGoogle(googleIdToken)
        set({ token: result.token, user: result.user })
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
)

export function selectIsAuthenticated(state: AuthState): boolean {
  return !!state.token && !!state.user
}
