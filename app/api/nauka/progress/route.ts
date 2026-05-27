import { getCurrentUserProfile } from '@/lib/auth/guards'
import { fetchUserProgress } from '@/lib/supabase/nauka'

export async function GET() {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({})
  try {
    const progress = await fetchUserProgress(profile.id)
    return Response.json(progress)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Błąd serwera'
    return Response.json({ error: message }, { status: 500 })
  }
}
