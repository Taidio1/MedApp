import { requireUser } from '@/lib/auth/guards'
import { fetchQuizLeaderboard } from '@/lib/supabase/quiz'

export async function GET() {
  await requireUser()
  try {
    const entries = await fetchQuizLeaderboard()
    return Response.json(entries)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać rankingu'
    return Response.json({ error: message }, { status: 500 })
  }
}
