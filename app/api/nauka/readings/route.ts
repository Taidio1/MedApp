import { requireUser } from '@/lib/auth/guards'
import { fetchReadingMaterials } from '@/lib/supabase/nauka'

export async function GET() {
  await requireUser()
  try {
    const materials = await fetchReadingMaterials()
    return Response.json(materials)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Błąd serwera'
    return Response.json({ error: message }, { status: 500 })
  }
}
