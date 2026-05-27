import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { getCurrentUserProfile } from '@/lib/auth/guards'
import { LoginForm } from './LoginForm'
import styles from './login.module.css'

function AnatomicalHeartMark() {
  return (
    <svg viewBox="0 0 120 132" aria-hidden="true">
      <path d="M58 38c-7-16-2-25 10-28 9-2 18 5 20 18 12-2 20 8 18 21-2 18-14 32-26 45-9 10-20 21-23 25-5-5-20-16-31-29C14 75 8 59 13 45c4-13 18-19 30-12 5 3 10 8 15 5Z" />
      <path d="M55 39c4-12 10-20 22-22M83 28c-1 13-5 24-13 34M44 33c-1 11 4 22 16 33M24 43c13 6 25 17 31 32M93 45c-8 17-19 27-35 37M35 85c14 3 28 8 39 19" />
      <path d="M67 15c-3-10-3-14 3-14M79 17c2-8 7-13 14-15M90 30c8-10 14-11 21-8M47 30c-6-10-13-14-22-11M36 38c-6-3-14-4-22 2" />
      <path d="M55 53c9 7 12 18 9 34M73 51c-6 12-9 23-8 35M42 58c8 8 14 18 16 33" />
      <circle cx="57" cy="39" r="4" />
    </svg>
  )
}

export default async function LoginPage() {
  const profile = await getCurrentUserProfile()
  if (profile) redirect('/')

  return (
    <main className={styles.page}>
      <div className={styles.anatomyTop} aria-hidden="true" />
      <div className={styles.anatomyBottom} aria-hidden="true" />

      <section className={styles.shell} aria-labelledby="login-title">
        <header className={styles.hero}>
          <div className={styles.heartMark} aria-hidden="true">
            <AnatomicalHeartMark />
          </div>

          <h1 id="login-title" className={styles.brandTitle}>
            <span>MedApp</span>
            <strong>Anatomy Studio</strong>
          </h1>

          <div className={styles.rule}>
            <span />
          </div>

          <p>Interaktywny atlas anatomii 3D</p>
        </header>

        <Suspense fallback={<div className={styles.authCard} />}>
          <LoginForm />
        </Suspense>

        <footer className={styles.securityNote}>
          <div>
            <ShieldCheck size={22} aria-hidden="true" />
            <p>Bezpieczne logowanie &bull; Twoje dane są chronione</p>
          </div>
          <a href="/#bezpieczenstwo">Dowiedz się więcej o bezpieczeństwie</a>
        </footer>
      </section>
    </main>
  )
}
