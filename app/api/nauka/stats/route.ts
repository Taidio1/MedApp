import { getCurrentUserProfile } from '@/lib/auth/guards'
import { fetchUserStats } from '@/lib/supabase/nauka'

export async function GET() {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json(null)
  try {
    const stats = await fetchUserStats(profile.id)
    return Response.json(stats)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Błąd serwera'
    return Response.json({ error: message }, { status: 500 })
  }
}
