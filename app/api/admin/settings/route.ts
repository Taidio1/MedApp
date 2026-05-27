import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  return null
}

export async function PUT(req: Request) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  if (b.key !== 'require_login') {
    return Response.json({ error: 'Nieznany klucz ustawień' }, { status: 400 })
  }
  if (b.value !== 'true' && b.value !== 'false') {
    return Response.json({ error: 'Wartość musi być "true" lub "false"' }, { status: 400 })
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: b.key, value: b.value, updated_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Błąd serwera' },
      { status: 500 },
    )
  }
}
