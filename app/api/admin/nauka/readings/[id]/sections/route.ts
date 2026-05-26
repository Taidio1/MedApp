import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  return null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  const { id: materialId } = await params
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 }) }
  const b = body as Record<string, unknown>
  if (!b.id || !b.title || !b.content || b.sort_order === undefined) {
    return Response.json({ error: 'Wymagane pola: id, title, content, sort_order' }, { status: 400 })
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('reading_sections')
      .insert({
        id: b.id as string,
        material_id: materialId,
        title: b.title as string,
        content: b.content as string,
        sort_order: b.sort_order as number,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return Response.json(data, { status: 201 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}
