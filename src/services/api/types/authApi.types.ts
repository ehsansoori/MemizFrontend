import type { GoogleAuthResponse } from '@/types/auth'

export type GoogleAuthRequestDto = {
  /** Google ID token (JWT) from OAuth credential response. */
  credential: string
}

/** Shape returned by ASP.NET `POST /api/auth/google`. */
export type GoogleAuthApiResponseDto = {
  token: string
  email: string
  name: string
}

export type GoogleAuthResponseDto = GoogleAuthResponse
