import { getCurrentUserProfile } from '@/lib/auth/guards'
import { QuizPage } from '@/components/Quiz/QuizPage'

export const metadata = {
  title: 'Quiz anatomiczny — MedApp Anatomy Studio',
}

export default async function QuizRoute() {
  const profile = await getCurrentUserProfile()

  return (
    <QuizPage
      displayName={profile?.displayName ?? null}
      isAdmin={profile?.role === 'admin'}
      userId={profile?.id ?? ''}
    />
  )
}
