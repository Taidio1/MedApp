import { getCurrentUserProfile } from '@/lib/auth/guards'
import { fetchFlashcards } from '@/lib/supabase/nauka'

export async function GET(req: Request) {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json([])
  const { searchParams } = new URL(req.url)
  const system = searchParams.get('system') ?? undefined
  try {
    const cards = await fetchFlashcards(system)
    return Response.json(cards)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Błąd serwera'
    return Response.json({ error: message }, { status: 500 })
  }
}
