import { getCurrentUserProfile } from '@/lib/auth/guards'
import { NaukaPage } from '@/components/Nauka/NaukaPage'

export const metadata = {
  title: 'Nauka — MedApp Anatomy Studio',
}

export default async function NaukaRoute() {
  const profile = await getCurrentUserProfile()

  return (
    <NaukaPage
      displayName={profile?.displayName ?? null}
      email={profile?.email ?? null}
      isAdmin={profile?.role === 'admin'}
    />
  )
}
