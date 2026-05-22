import { createSupabaseServerClient } from '@/lib/auth/server'
import { fetchStructures } from '@/lib/supabase/structures'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const structures = await fetchStructures(supabase)
    return Response.json(structures)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać struktur'
    return Response.json({ error: message }, { status: 500 })
  }
}
