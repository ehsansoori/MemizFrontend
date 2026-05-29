import axios from 'axios'

export function isAbortError(error: unknown): boolean {
  if (axios.isCancel(error)) return true
  if (error instanceof DOMException && error.name === 'AbortError') return true
  return false
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isAbortError(error)) {
    return 'Request was cancelled.'
  }

  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return 'Cannot reach the server. Check that the API is running and VITE_API_BASE_URL is correct.'
    }
    if (error.response?.status === 400 || error.response?.status === 401) {
      const data = error.response.data
      if (typeof data === 'string' && data.trim()) return data
      if (data && typeof data === 'object') {
        if ('error' in data && typeof data.error === 'string') {
          const code = data.error
          if (code === 'credential is required') {
            return 'Sign-in token was missing. Try again.'
          }
          if (code === 'invalid_token') {
            return 'Google sign-in token was invalid or expired. Try again.'
          }
          if (code === 'email_not_allowed') {
            return 'This Google account is not on the beta allowlist.'
          }
          return code
        }
        if ('title' in data && typeof data.title === 'string') {
          return data.title
        }
      }
      if (error.response.status === 401) {
        return 'You are not authorized to perform this action.'
      }
      return 'Invalid request. Check your inputs and try again.'
    }
    if (error.response?.status === 403) return 'Access denied.'
    if (error.response?.status === 404) return 'API endpoint not found.'
    if (error.response?.status && error.response.status >= 500) {
      return 'Server error. Please try again in a moment.'
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
