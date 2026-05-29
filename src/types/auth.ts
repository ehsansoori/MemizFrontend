export type AuthUser = {
  email: string
  name: string
}

export type GoogleAuthResponse = {
  success: boolean
  token: string
  user: AuthUser
}
