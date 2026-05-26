export type AppRole = 'user' | 'admin' | 'premiumUser'

export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  role: AppRole
}
