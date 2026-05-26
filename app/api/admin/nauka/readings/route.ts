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
      .from('reading_materials')
      .select('id, sys, title, read_time, reading_sections(id, title, content, sort_order)')
      .order('sys')
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
  if (!b.sys || !b.title || b.read_time === undefined) {
    return Response.json({ error: 'Wymagane pola: sys, title, read_time' }, { status: 400 })
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('reading_materials')
      .insert({ sys: b.sys as string, title: b.title as string, read_time: b.read_time as number })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return Response.json(data, { status: 201 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}
