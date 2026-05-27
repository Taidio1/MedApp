import { getCurrentUserProfile, getRequireLoginSetting } from '@/lib/auth/guards'
import { AuthGateOverlay } from '@/components/AuthGate/AuthGateOverlay'

export default async function GatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, requireLogin] = await Promise.all([
    getCurrentUserProfile(),
    getRequireLoginSetting(),
  ])

  if (requireLogin && !profile) {
    return (
      <>
        {children}
        <AuthGateOverlay />
      </>
    )
  }

  return <>{children}</>
}
