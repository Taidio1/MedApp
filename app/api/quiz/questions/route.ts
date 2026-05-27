import { getCurrentUserProfile } from '@/lib/auth/guards'
import { fetchQuizQuestions, mapDbQuestionToUi } from '@/lib/supabase/quiz'

export async function GET() {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json([])
  try {
    const dbQuestions = await fetchQuizQuestions()
    return Response.json(dbQuestions.map(mapDbQuestionToUi))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać pytań'
    return Response.json({ error: message }, { status: 500 })
  }
}
