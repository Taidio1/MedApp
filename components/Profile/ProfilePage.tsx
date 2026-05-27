import Link from 'next/link'
import {
  BookOpen,
  CircleQuestionMark,
  Clock3,
  GraduationCap,
  House,
  LogOut,
  Mail,
  ShieldCheck,
  Trophy,
  UserRound,
} from 'lucide-react'
import { AppNavbar } from '@/components/AppNavbar/AppNavbar'
import { SignOutButton } from '@/components/UserMenu/SignOutButton'
import type { QuizHistoryEntry } from '@/components/Quiz/quizData'
import type { UserProfile } from '@/lib/auth/types'
import type { UserNaukaStats } from '@/lib/supabase/nauka'
import type { UserQuizSummary } from '@/lib/supabase/quiz'
import { AdminToolsPanel } from './AdminToolsPanel'
import { ProfileMetricGrid } from './ProfileMetricGrid'
import type { ProfileMetric } from './ProfileMetricGrid'

interface ProfilePageProps {
  profile: UserProfile
  learningStats: UserNaukaStats | null
  quizHistory: QuizHistoryEntry[]
  quizSummary: UserQuizSummary
}

function getInitials(profile: UserProfile) {
  const source = profile.displayName || profile.email
  const parts = source.split(/[.\s@_-]+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'M'
}

function formatMinutes(minutes?: number) {
  if (!minutes) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`
}

function formatSeconds(seconds: number) {
  if (seconds <= 0) return '0 min'
  return formatMinutes(Math.round(seconds / 60))
}

function roleLabel(role: UserProfile['role']) {
  if (role === 'admin') return 'Administrator'
  if (role === 'premiumUser') return 'Learner premium'
  return 'Learner'
}

export function ProfilePage({ profile, learningStats, quizHistory, quizSummary }: ProfilePageProps) {
  const isAdmin = profile.role === 'admin'
  const knownCards = learningStats?.knownCards ?? 0
  const totalCards = learningStats?.totalCards ?? 0
  const progressPercent = totalCards > 0 ? Math.round((knownCards / totalCards) * 100) : 0
  const displayName = profile.displayName || profile.email

  const learningMetrics: ProfileMetric[] = [
    { label: 'Opanowane karty', value: `${knownCards}/${totalCards}`, detail: `${progressPercent}% całości`, tone: 'green' },
    { label: 'Do powtórki', value: String(learningStats?.cardsToReview ?? 0), detail: 'według ostatnich sesji', tone: 'red' },
    { label: 'Sesje w tygodniu', value: String(learningStats?.sessionsThisWeek ?? 0), detail: 'ostatnie 7 dni', tone: 'accent' },
    { label: 'Czas nauki', value: formatMinutes(learningStats?.totalStudyMinutes), detail: `${learningStats?.newCardsToday ?? 0} nowych dziś`, tone: 'muted' },
  ]

  const quizMetrics: ProfileMetric[] = [
    { label: 'Ukończone quizy', value: String(quizSummary.completedSessions), detail: 'zapisane sesje', tone: 'blue' },
    { label: 'Średni wynik', value: `${quizSummary.averageScorePercent}%`, detail: 'ze wszystkich odpowiedzi', tone: 'accent' },
    { label: 'Najlepsza seria', value: String(quizSummary.bestStreak), detail: 'poprawnych odpowiedzi', tone: 'green' },
    { label: 'Czas quizów', value: formatSeconds(quizSummary.totalTimeSeconds), detail: 'łączny czas', tone: 'muted' },
  ]

  return (
    <div className="profile-shell">
      <AppNavbar active="profil" email={profile.email} displayName={profile.displayName} isAdmin={isAdmin} />

      <main className="profile-main">
        <section className="profile-hero profile-card" aria-label="Podsumowanie profilu">
          <div className="profile-avatar" aria-hidden="true">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" />
            ) : (
              <span>{getInitials(profile)}</span>
            )}
          </div>

          <div className="profile-hero-copy">
            <p className="profile-kicker">Profil użytkownika</p>
            <h1>{displayName}</h1>
            <div className="profile-mail">
              <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>{profile.email}</span>
            </div>
          </div>

          <div className="profile-role-block">
            <span className={`profile-role-pill ${isAdmin ? 'profile-role-pill--admin' : ''}`}>
              {isAdmin ? <ShieldCheck size={16} strokeWidth={1.9} /> : <GraduationCap size={16} strokeWidth={1.9} />}
              {roleLabel(profile.role)}
            </span>
            <small>
              {isAdmin
                ? 'Konto ma dostęp do narzędzi zarządzania treścią.'
                : 'Konto skupione na nauce, quizach i pracy z atlasem.'}
            </small>
          </div>
        </section>

        <div className="profile-content-grid">
          <section className="profile-card" aria-labelledby="learning-title">
            <div className="profile-section-heading">
              <span aria-hidden="true"><BookOpen size={17} strokeWidth={1.8} /></span>
              <div>
                <p>Notes nauki</p>
                <h2 id="learning-title">Postęp nauki</h2>
              </div>
            </div>

            <ProfileMetricGrid metrics={learningMetrics} />

            {!learningStats && (
              <p className="profile-empty-note">Brak zapisanych sesji nauki. Zacznij od kilku fiszek w module Nauka.</p>
            )}
          </section>

          <section className="profile-card" aria-labelledby="quiz-title">
            <div className="profile-section-heading">
              <span aria-hidden="true"><Trophy size={17} strokeWidth={1.8} /></span>
              <div>
                <p>Sprawdzanie wiedzy</p>
                <h2 id="quiz-title">Quizy</h2>
              </div>
            </div>

            <ProfileMetricGrid metrics={quizMetrics} />

            <div className="profile-history">
              <h3>Ostatnie próby</h3>
              {quizHistory.length > 0 ? (
                <ul>
                  {quizHistory.slice(0, 4).map((entry) => (
                    <li key={`${entry.date}-${entry.topic}-${entry.time}`}>
                      <span>
                        <strong>{entry.topic}</strong>
                        <small>{entry.date} · {entry.mode}</small>
                      </span>
                      <em>{entry.score}/{entry.total}</em>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="profile-empty-note">Brak ukończonych quizów. Uruchom krótki quiz, aby zobaczyć historię.</p>
              )}
            </div>
          </section>

          <aside className="profile-side-stack">
            <section className="profile-card" aria-labelledby="actions-title">
              <div className="profile-section-heading">
                <span aria-hidden="true"><UserRound size={17} strokeWidth={1.8} /></span>
                <div>
                  <p>Skróty</p>
                  <h2 id="actions-title">Dalsza praca</h2>
                </div>
              </div>

              <div className="profile-action-list">
                <Link href="/nauka">
                  <BookOpen size={19} strokeWidth={1.8} aria-hidden="true" />
                  <span>Kontynuuj naukę</span>
                </Link>
                <Link href="/quiz">
                  <CircleQuestionMark size={19} strokeWidth={1.8} aria-hidden="true" />
                  <span>Rozpocznij quiz</span>
                </Link>
                <Link href="/">
                  <House size={19} strokeWidth={1.8} aria-hidden="true" />
                  <span>Otwórz atlas</span>
                </Link>
              </div>
            </section>

            <section className="profile-card" aria-labelledby="account-title">
              <div className="profile-section-heading">
                <span aria-hidden="true"><Clock3 size={17} strokeWidth={1.8} /></span>
                <div>
                  <p>Konto</p>
                  <h2 id="account-title">Ustawienia</h2>
                </div>
              </div>

              <dl className="profile-account-list">
                <div>
                  <dt>Identyfikator</dt>
                  <dd>{profile.id.slice(0, 8)}…</dd>
                </div>
                <div>
                  <dt>Rola</dt>
                  <dd>{roleLabel(profile.role)}</dd>
                </div>
                <div>
                  <dt>Wylogowanie</dt>
                  <dd>
                    <SignOutButton className="profile-sign-out-button">
                      <LogOut size={17} strokeWidth={1.9} aria-hidden="true" />
                      <span>Wyloguj</span>
                    </SignOutButton>
                  </dd>
                </div>
              </dl>
            </section>

            {isAdmin && <AdminToolsPanel />}
          </aside>
        </div>
      </main>
    </div>
  )
}
