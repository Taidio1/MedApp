import { requireUser } from '@/lib/auth/guards'
import { QuizPage } from '@/components/Quiz/QuizPage'

export const metadata = {
  title: 'Quiz anatomiczny — MedApp Anatomy Studio',
}

export default async function QuizRoute() {
  const profile = await requireUser()

  return (
    <QuizPage
      displayName={profile.displayName}
      isAdmin={profile.role === 'admin'}
      userId={profile.id}
    />
  )
}
