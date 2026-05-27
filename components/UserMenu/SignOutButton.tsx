'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/auth/browser'

interface SignOutButtonProps {
  children?: ReactNode
  className?: string
}

export function SignOutButton({ children = 'Wyloguj', className }: SignOutButtonProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={className}
    >
      {children}
    </button>
  )
}
