'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/auth/browser'

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
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setInfo(null)
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

    // register
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(translateError(signUpError.message, 'register'))
      setLoading(false)
      return
    }

    // If session is present the project has auto-confirm enabled → redirect immediately
    if (data.session) {
      router.push('/')
      router.refresh()
      return
    }

    // Otherwise email confirmation is required
    setInfo('Konto zostało utworzone. Sprawdź skrzynkę email i potwierdź konto, a następnie zaloguj się.')
    setLoading(false)
  }

  const isLogin = mode === 'login'

  return (
    <div className="flex flex-col gap-4">
      {/* Tab switcher */}
      <div className="flex rounded-md overflow-hidden border border-[#2a2a4e]">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            isLogin
              ? 'bg-[#7c3aed] text-white'
              : 'bg-transparent text-gray-400 hover:text-white'
          }`}
        >
          Logowanie
        </button>
        <button
          type="button"
          onClick={() => switchMode('register')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            !isLogin
              ? 'bg-[#7c3aed] text-white'
              : 'bg-transparent text-gray-400 hover:text-white'
          }`}
        >
          Rejestracja
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-md bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {info && (
          <div className="rounded-md bg-green-900/40 border border-green-700 px-4 py-3 text-sm text-green-300">
            {info}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-xs text-gray-400 uppercase tracking-wide">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="rounded-md bg-[#1e1e3a] border border-[#2a2a4e] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-xs text-gray-400 uppercase tracking-wide">
            Hasło
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            className="rounded-md bg-[#1e1e3a] border border-[#2a2a4e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-md bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? isLogin ? 'Logowanie…' : 'Rejestrowanie…'
            : isLogin ? 'Zaloguj się' : 'Zarejestruj się'}
        </button>
      </form>
    </div>
  )
}
