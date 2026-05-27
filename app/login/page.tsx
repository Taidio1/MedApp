import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/guards'
import { LoginForm } from './LoginForm'

export default async function LoginPage() {
  const profile = await getCurrentUserProfile()
  if (profile) redirect('/')

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--app-bg)] px-4 py-8 text-[var(--ink)]">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[rgba(124,107,196,0.28)] bg-[var(--qz-accent-soft)]">
            <span className="text-lg font-bold text-[var(--qz-accent)]">A</span>
          </div>
          <div className="text-center">
            <h1 className="font-serif text-xl font-medium tracking-normal text-[var(--ink)]">
              Anatomy Studio
            </h1>
            <p className="mt-1 text-xs italic text-[var(--muted)]">
              Interaktywny eksplorator anatomii 3D
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--ink)]">Logowanie</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
