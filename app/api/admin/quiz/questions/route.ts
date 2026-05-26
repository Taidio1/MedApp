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
      .from('quiz_questions')
      .select('id, type, structure_id, system_name, difficulty, question_text, options, correct_index, answer, image_target, hint, explanation, sort_order, is_active')
      .order('sort_order')
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
  if (!b.type || !b.system_name || !b.difficulty || !b.question_text) {
    return Response.json({ error: 'Wymagane pola: type, system_name, difficulty, question_text' }, { status: 400 })
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert({
        type: b.type as string,
        structure_id: (b.structure_id as string | undefined) ?? null,
        system_name: b.system_name as string,
        difficulty: b.difficulty as string,
        question_text: b.question_text as string,
        options: (b.options as string[] | undefined) ?? null,
        correct_index: (b.correct_index as number | undefined) ?? null,
        answer: (b.answer as string | undefined) ?? null,
        image_target: (b.image_target as string | undefined) ?? null,
        hint: (b.hint as string | undefined) ?? null,
        explanation: (b.explanation as string | undefined) ?? null,
        sort_order: (b.sort_order as number | undefined) ?? 0,
        is_active: (b.is_active as boolean | undefined) ?? true,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return Response.json(data, { status: 201 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}
