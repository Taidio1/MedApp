import { ProfilePage } from '@/components/Profile/ProfilePage'
import { getCurrentUserProfile } from '@/lib/auth/guards'
import { fetchUserStats } from '@/lib/supabase/nauka'
import { fetchUserQuizHistory, fetchUserQuizSummary } from '@/lib/supabase/quiz'
import type { UserNaukaStats } from '@/lib/supabase/nauka'
import type { QuizHistoryEntry } from '@/components/Quiz/quizData'
import type { UserQuizSummary } from '@/lib/supabase/quiz'

export const metadata = {
  title: 'Profil — MedApp Anatomy Studio',
}

const EMPTY_QUIZ_SUMMARY: UserQuizSummary = {
  completedSessions: 0,
  averageScorePercent: 0,
  bestStreak: 0,
  totalTimeSeconds: 0,
}

async function optionalData<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch {
    return fallback
  }
}

export default async function ProfileRoute() {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    return (
      <ProfilePage
        profile={{ id: '', email: '', displayName: null, avatarUrl: null, role: 'user' }}
        learningStats={null}
        quizHistory={[]}
        quizSummary={EMPTY_QUIZ_SUMMARY}
      />
    )
  }

  const [learningStats, quizHistory, quizSummary] = await Promise.all([
    optionalData<UserNaukaStats | null>(() => fetchUserStats(profile.id), null),
    optionalData<QuizHistoryEntry[]>(() => fetchUserQuizHistory(profile.id), []),
    optionalData<UserQuizSummary>(() => fetchUserQuizSummary(profile.id), EMPTY_QUIZ_SUMMARY),
  ])

  return (
    <ProfilePage
      profile={profile}
      learningStats={learningStats}
      quizHistory={quizHistory}
      quizSummary={quizSummary}
    />
  )
}
