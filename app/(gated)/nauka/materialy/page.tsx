import { AppNavbar } from '@/components/AppNavbar/AppNavbar'
import { NaukaMaterialsPage } from '@/components/Nauka/NaukaMaterialsPage'
import { getCurrentUserProfile } from '@/lib/auth/guards'
import { fetchReadingMaterials } from '@/lib/supabase/nauka'

export const metadata = {
  title: 'Materiały do czytania — MedApp Anatomy Studio',
}

interface NaukaMaterialsRouteProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function NaukaMaterialsRoute({ searchParams }: NaukaMaterialsRouteProps) {
  const profile = await getCurrentUserProfile()
  const params = await searchParams
  const systemParam = Array.isArray(params.system) ? params.system[0] : params.system
  const readings = await fetchReadingMaterials()

  return (
    <div className="quiz-shell app-shell-with-navbar reading-materials-page">
      <AppNavbar
        active="nauka"
        displayName={profile?.displayName ?? null}
        isAdmin={profile?.role === 'admin'}
        email={profile?.email}
      />
      <NaukaMaterialsPage readings={readings} selectedSystem={systemParam ?? null} />
    </div>
  )
}
