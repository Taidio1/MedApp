'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  LogIn,
  Mail,
  User,
  UserPlus,
  X,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/auth/browser'
import styles from './login.module.css'

type Mode = 'login' | 'register'

function translateError(message: string, mode: Mode): string {
  if (message.includes('Invalid login credentials')) {
    return 'Nieprawidłowy email lub hasło.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Potwierdź adres email przed zalogowaniem.'
  }
  if (message.includes('User already registered') || message.includes('already been registered')) {
    return 'Konto z tym adresem email już istnieje.'
  }
  if (message.includes('Password should be at least')) {
    return 'Hasło musi mieć co najmniej 6 znaków.'
  }
  if (mode === 'register') {
    return 'Nie udało się założyć konta. Spróbuj ponownie.'
  }
  return 'Nie udało się zalogować. Spróbuj ponownie.'
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMode(searchParams.get('tab') === 'register' ? 'register' : 'login')
  }, [searchParams])

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setInfo(null)
  }

  function showPasswordResetNotice() {
    setError(null)
    setInfo('Reset hasła nie jest jeszcze podłączony. Skontaktuj się z administratorem.')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)

    const supabase = createSupabaseBrowserClient()

    if (mode === 'login') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        setError(translateError(signInError.message, 'login'))
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(translateError(signUpError.message, 'register'))
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/')
      router.refresh()
      return
    }

    setInfo('Konto zostało utworzone. Sprawdź skrzynkę email i potwierdź konto, a następnie zaloguj się.')
    setLoading(false)
  }

  const isLogin = mode === 'login'

  return (
    <section className={styles.authCard} aria-label="Panel logowania">
      <div className={styles.tabs} role="tablist" aria-label="Wybierz tryb">
        <button
          type="button"
          role="tab"
          aria-selected={isLogin}
          onClick={() => switchMode('login')}
          className={isLogin ? styles.activeTab : undefined}
        >
          <User size={34} strokeWidth={1.8} aria-hidden="true" />
          <span>Logowanie</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isLogin}
          onClick={() => switchMode('register')}
          className={!isLogin ? styles.activeTab : undefined}
        >
          <UserPlus size={36} strokeWidth={1.65} aria-hidden="true" />
          <span>Rejestracja</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.fieldGroup} htmlFor="email">
          <span>Email</span>
          <div className={styles.inputShell}>
            <Mail size={34} strokeWidth={1.6} aria-hidden="true" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="Wpisz swój adres email"
            />
          </div>
        </label>

        <label className={styles.fieldGroup} htmlFor="password">
          <span className={styles.passwordLabel}>
            Hasło
            {isLogin && (
              <button type="button" onClick={showPasswordResetNotice}>
                Zapomniałeś hasła?
              </button>
            )}
          </span>
          <div className={styles.inputShell}>
            <LockKeyhole size={34} strokeWidth={1.6} aria-hidden="true" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder={isLogin ? 'Wpisz swoje hasło' : 'Utwórz hasło'}
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
            >
              {showPassword ? <EyeOff size={34} strokeWidth={1.6} /> : <Eye size={34} strokeWidth={1.6} />}
            </button>
          </div>
        </label>

        <button type="submit" disabled={loading} className={styles.submitButton}>
          <LogIn size={34} strokeWidth={1.8} aria-hidden="true" />
          <span>
            {loading
              ? isLogin ? 'Logowanie...' : 'Rejestrowanie...'
              : isLogin ? 'Zaloguj się' : 'Zarejestruj się'}
          </span>
        </button>

        <div className={styles.divider}>
          <span>lub kontynuuj z</span>
        </div>

        <div className={styles.socialGrid}>
          <button type="button" aria-label="Kontynuuj z Google">
            <span className={styles.googleMark} aria-hidden="true">G</span>
            <span>Google</span>
          </button>
          <button type="button" aria-label="Kontynuuj z Apple">
            <span className={styles.appleMark} aria-hidden="true" />
            <span>Apple</span>
          </button>
        </div>

        <p className={styles.modeHint}>
          {isLogin ? 'Nie masz konta?' : 'Masz już konto?'}{' '}
          <button type="button" onClick={() => switchMode(isLogin ? 'register' : 'login')}>
            {isLogin ? 'Przejdź do rejestracji' : 'Przejdź do logowania'}
          </button>
        </p>

        {(showHint || info) && (
          <div className={`${styles.notice} ${styles.infoNotice}`} role="status">
            <Info size={32} strokeWidth={2.1} aria-hidden="true" />
            <div>
              <strong>{info ? 'Informacja' : 'Przykład informacji'}</strong>
              <p>{info ?? 'Twoje postępy w nauce są bezpiecznie synchronizowane w chmurze.'}</p>
            </div>
            {!info && (
              <button type="button" onClick={() => setShowHint(false)} aria-label="Zamknij informację">
                <X size={36} strokeWidth={1.6} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {error && (
          <div className={`${styles.notice} ${styles.errorNotice}`} role="alert">
            <AlertCircle size={32} strokeWidth={2.1} aria-hidden="true" />
            <div>
              <strong>Błąd logowania</strong>
              <p>{error}</p>
            </div>
            <button type="button" onClick={() => setError(null)} aria-label="Zamknij błąd">
              <X size={36} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </div>
        )}
      </form>
    </section>
  )
}
