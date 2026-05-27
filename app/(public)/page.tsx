import { getCurrentUserProfile } from '@/lib/auth/guards'
import { AppShell } from '@/components/AppShell/AppShell'

export default async function HomePage() {
  const profile = await getCurrentUserProfile()

  return (
    <AppShell
      email={profile?.email ?? null}
      displayName={profile?.displayName ?? null}
      isAdmin={profile?.role === 'admin'}
    />
  )
}
