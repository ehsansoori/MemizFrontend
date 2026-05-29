import { apiClient } from '@/services/api/apiClient'
import { useAuthStore } from '@/store/auth/authStore'

let configured = false

/** Attach bearer token from auth store to API requests (once). */
export function setupApiAuth(): void {
  if (configured) return
  configured = true

  apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
}
