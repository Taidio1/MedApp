import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'
import {
  createSupabaseAdminClient,
  hasSupabaseAdminCredentials,
} from '@/lib/supabase/admin'
import { fetchStructures } from '@/lib/supabase/structures'

export async function GET() {
  try {
    const profile = await getCurrentUserProfile()
    const supabase = hasSupabaseAdminCredentials()
      ? createSupabaseAdminClient()
      : await createSupabaseServerClient()
    const structures = await fetchStructures(
      supabase,
      profile
        ? { role: profile.role, premiumUntil: profile.premiumUntil }
        : null,
    )
    return Response.json(structures)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać struktur'
    return Response.json({ error: message }, { status: 500 })
  }
}
