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
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  const { id: materialId, sectionId } = await params
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 }) }
  const b = body as Record<string, unknown>
  const update: Record<string, unknown> = {}
  if (b.title !== undefined) update.title = b.title
  if (b.content !== undefined) update.content = b.content
  if (b.sort_order !== undefined) update.sort_order = b.sort_order
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('reading_sections')
      .update(update)
      .eq('material_id', materialId)
      .eq('id', sectionId)
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
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  const { id: materialId, sectionId } = await params
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
      .from('reading_sections')
      .delete()
      .eq('material_id', materialId)
      .eq('id', sectionId)
    if (error) throw new Error(error.message)
    return new Response(null, { status: 204 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}
