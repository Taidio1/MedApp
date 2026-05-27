import { getCurrentUserProfile } from '@/lib/auth/guards'
import { fetchUserQuizHistory } from '@/lib/supabase/quiz'

export async function GET() {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json([])
  try {
    const history = await fetchUserQuizHistory(profile.id)
    return Response.json(history)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać historii'
    return Response.json({ error: message }, { status: 500 })
  }
}
