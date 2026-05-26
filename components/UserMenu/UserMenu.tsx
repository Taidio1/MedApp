'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/auth/browser'

interface UserMenuProps {
  email: string
  displayName: string | null
  isAdmin: boolean
}

export function UserMenu({ email, displayName, isAdmin }: UserMenuProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="user-menu">
      <span className="user-menu-name">
        {displayName ?? email}
      </span>

      {isAdmin && (
        <Link
          href="/admin/annotations"
          className="user-menu-link"
        >
          Admin
        </Link>
      )}

      <button
        onClick={handleSignOut}
        className="user-menu-button"
      >
        Wyloguj
      </button>
    </div>
  )
}
