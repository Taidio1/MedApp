import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/guards'
import { LoginForm } from './LoginForm'

export default async function LoginPage() {
  const profile = await getCurrentUserProfile()
  if (profile) redirect('/')

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#7c3aed] flex items-center justify-center">
            <span className="text-white text-lg font-bold">A</span>
          </div>
          <div className="text-center">
            <h1 className="text-white font-semibold text-lg tracking-wide">
              Anatomy Studio
            </h1>
            <p className="text-gray-500 text-xs mt-1">
              Interaktywny eksplorator anatomii 3D
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-xl bg-[#12122a] border border-[#2a2a4e] p-6">
          <h2 className="text-white text-sm font-semibold mb-4">Logowanie</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
