import { requireUser } from '@/lib/auth/guards'
import { saveStudySession, upsertCardProgress } from '@/lib/supabase/nauka'

export async function POST(req: Request) {
  const profile = await requireUser()
  const body = await req.json() as {
    mode: 'nolimit' | 'pomodoro'
    system: string
    cardsTotal: number
    cardsKnown: number
    startedAt: string
    results: Record<string, boolean>
  }

  try {
    await saveStudySession({
      userId:     profile.id,
      mode:       body.mode,
      system:     body.system,
      cardsTotal: body.cardsTotal,
      cardsKnown: body.cardsKnown,
      startedAt:  body.startedAt,
    })

    if (body.results && typeof body.results === 'object') {
      await Promise.all(
        Object.entries(body.results).map(([cardId, known]) =>
          upsertCardProgress({ userId: profile.id, cardId, known }),
        ),
      )
    }

    return Response.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Błąd serwera'
    return Response.json({ error: message }, { status: 500 })
  }
}
