import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from './server'
import type { UserProfile } from './types'

interface UsersRow {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin' | 'premiumUser'
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data, error: profileError } = await supabase
    .from('users')
    .select('id, email, display_name, avatar_url, role')
    .eq('id', user.id)
    .single()

  if (profileError || !data) return null

  const row = data as unknown as UsersRow

  return {
    id: row.id,
    email: row.email ?? user.email ?? '',
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
  }
}

export async function requireUser(): Promise<UserProfile> {
  const profile = await getCurrentUserProfile()
  if (!profile) redirect('/login')
  return profile
}

export async function requireAdmin(): Promise<UserProfile> {
  const profile = await getCurrentUserProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/')
  return profile
}

export const getRequireLoginSetting = cache(async (): Promise<boolean> => {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'require_login')
      .single()
    if (error) {
      console.error('[getRequireLoginSetting] Supabase error:', error.code, error.message)
      return true
    }
    console.log('[getRequireLoginSetting] value:', data?.value)
    return data?.value !== 'false'
  } catch (e) {
    console.error('[getRequireLoginSetting] Exception:', e)
    return true
  }
})
