import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  return null
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  const { id } = await params
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 }) }
  const b = body as Record<string, unknown>
  const update: Record<string, unknown> = {}
  if (b.sys !== undefined) update.sys = b.sys
  if (b.title !== undefined) update.title = b.title
  if (b.read_time !== undefined) update.read_time = b.read_time
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('reading_materials')
      .update(update)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  const { id } = await params
  try {
    const supabase = await createSupabaseServerClient()
    const { error: secErr } = await supabase.from('reading_sections').delete().eq('material_id', id)
    if (secErr) throw new Error(secErr.message)
    const { error } = await supabase.from('reading_materials').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return new Response(null, { status: 204 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}
