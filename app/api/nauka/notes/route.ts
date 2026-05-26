import { requireUser } from '@/lib/auth/guards'
import { fetchUserNotes, upsertUserNote } from '@/lib/supabase/nauka'

export async function GET() {
  const profile = await requireUser()
  try {
    const notes = await fetchUserNotes(profile.id)
    return Response.json(notes)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Błąd serwera'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const profile = await requireUser()
  const body = await req.json() as { cardId: string; content: string }

  if (!body.cardId || typeof body.cardId !== 'string') {
    return Response.json({ error: 'Brak cardId' }, { status: 400 })
  }

  try {
    await upsertUserNote({ userId: profile.id, cardId: body.cardId, content: body.content ?? '' })
    return Response.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Błąd serwera'
    return Response.json({ error: message }, { status: 500 })
  }
}
