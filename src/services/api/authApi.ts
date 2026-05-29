import { apiClient } from '@/services/api/apiClient'
import type {
  GoogleAuthApiResponseDto,
  GoogleAuthRequestDto,
  GoogleAuthResponseDto,
} from '@/services/api/types/authApi.types'

export async function loginWithGoogle(
  googleIdToken: string,
): Promise<GoogleAuthResponseDto> {
  const body: GoogleAuthRequestDto = { credential: googleIdToken }
  const { data } = await apiClient.post<GoogleAuthApiResponseDto>(
    '/api/auth/google',
    body,
  )
  if (!data.token || !data.email) {
    throw new Error('Google sign-in failed. Please try again.')
  }
  return {
    success: true,
    token: data.token,
    user: { email: data.email, name: data.name ?? '' },
  }
}
