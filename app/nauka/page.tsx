import { requireUser } from '@/lib/auth/guards'
import { NaukaPage } from '@/components/Nauka/NaukaPage'

export const metadata = {
  title: 'Nauka — MedApp Anatomy Studio',
}

export default async function NaukaRoute() {
  const profile = await requireUser()

  return (
    <NaukaPage
      displayName={profile.displayName}
      isAdmin={profile.role === 'admin'}
    />
  )
}
