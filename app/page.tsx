import { requireUser } from '@/lib/auth/guards'
import { AppShell } from '@/components/AppShell/AppShell'

export default async function HomePage() {
  const profile = await requireUser()

  return (
    <AppShell
      email={profile.email}
      displayName={profile.displayName}
      isAdmin={profile.role === 'admin'}
    />
  )
}
