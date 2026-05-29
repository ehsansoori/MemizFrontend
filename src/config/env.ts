const PLACEHOLDER_CLIENT_IDS = new Set([
  'YOUR_GOOGLE_CLIENT_ID',
  'your-google-client-id.apps.googleusercontent.com',
])

/** Google OAuth Web client ID from Vite env (`VITE_GOOGLE_CLIENT_ID`). */
export function getGoogleClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''
}

export function isGoogleAuthConfigured(): boolean {
  const clientId = getGoogleClientId()
  if (!clientId) return false
  if (PLACEHOLDER_CLIENT_IDS.has(clientId)) return false
  return true
}
