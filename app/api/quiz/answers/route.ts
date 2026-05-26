import { requireUser } from '@/lib/auth/guards'
import { saveQuizAnswer } from '@/lib/supabase/quiz'

export async function POST(request: Request) {
  await requireUser()
  let body: {
    sessionId?: unknown
    questionId?: unknown
    userAnswer?: unknown
    isCorrect?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 })
  }

  if (typeof body.sessionId !== 'string' || typeof body.questionId !== 'string') {
    return Response.json({ error: 'Pola sessionId i questionId są wymagane' }, { status: 400 })
  }

  try {
    await saveQuizAnswer({
      sessionId: body.sessionId,
      questionId: body.questionId,
      userAnswer: typeof body.userAnswer === 'string' ? body.userAnswer : '',
      isCorrect: body.isCorrect === true,
    })
    return Response.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się zapisać odpowiedzi'
    return Response.json({ error: message }, { status: 500 })
  }
}
