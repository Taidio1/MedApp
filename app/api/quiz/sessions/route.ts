import { getCurrentUserProfile } from '@/lib/auth/guards'
import { createQuizSession, completeQuizSession } from '@/lib/supabase/quiz'

export async function POST(request: Request) {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  let body: {
    mode?: unknown
    systemFilter?: unknown
    difficultyFilter?: unknown
    totalQuestions?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 })
  }

  if (body.mode !== 'Nauka' && body.mode !== 'Egzamin') {
    return Response.json({ error: 'Pole mode musi być "Nauka" lub "Egzamin"' }, { status: 400 })
  }
  if (typeof body.totalQuestions !== 'number') {
    return Response.json({ error: 'Pole totalQuestions musi być liczbą' }, { status: 400 })
  }

  try {
    const sessionId = await createQuizSession({
      userId: profile.id,
      mode: body.mode,
      systemFilter: typeof body.systemFilter === 'string' ? body.systemFilter : 'Wszystkie układy',
      difficultyFilter: typeof body.difficultyFilter === 'string' ? body.difficultyFilter : 'Wszystkie poziomy',
      totalQuestions: body.totalQuestions,
    })
    return Response.json({ sessionId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się utworzyć sesji'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const patchProfile = await getCurrentUserProfile()
  if (!patchProfile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  let body: {
    sessionId?: unknown
    correctCount?: unknown
    maxStreak?: unknown
    timeElapsedSeconds?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 })
  }

  if (typeof body.sessionId !== 'string') {
    return Response.json({ error: 'Pole sessionId jest wymagane' }, { status: 400 })
  }

  try {
    await completeQuizSession({
      sessionId: body.sessionId,
      correctCount: typeof body.correctCount === 'number' ? body.correctCount : 0,
      maxStreak: typeof body.maxStreak === 'number' ? body.maxStreak : 0,
      timeElapsedSeconds: typeof body.timeElapsedSeconds === 'number' ? body.timeElapsedSeconds : 0,
    })
    return Response.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się zakończyć sesji'
    return Response.json({ error: message }, { status: 500 })
  }
}
