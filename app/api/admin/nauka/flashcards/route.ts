import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  return null
}

export async function GET() {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('flashcards')
      .select('id, question, answer, system, difficulty, mnemonic, details, struct')
      .order('id')
    if (error) throw new Error(error.message)
    return Response.json(data ?? [])
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 }) }
  const b = body as Record<string, unknown>
  if (!b.id || !b.question || !b.answer || !b.system || !b.difficulty) {
    return Response.json({ error: 'Wymagane pola: id, question, answer, system, difficulty' }, { status: 400 })
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        id: b.id as string,
        question: b.question as string,
        answer: b.answer as string,
        system: b.system as string,
        difficulty: b.difficulty as string,
        mnemonic: (b.mnemonic as string | undefined) ?? '',
        details: (b.details as string | undefined) ?? '',
        struct: (b.struct as string | undefined) ?? '',
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return Response.json(data, { status: 201 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}
