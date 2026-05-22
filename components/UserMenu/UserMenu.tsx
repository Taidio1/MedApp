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
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 max-w-[160px] truncate">
        {displayName ?? email}
      </span>

      {isAdmin && (
        <Link
          href="/admin/annotations"
          className="px-2 py-1 text-xs rounded bg-[#2a2a4e] text-[#a78bfa] hover:bg-[#3a3a6e] transition-colors"
        >
          Admin
        </Link>
      )}

      <button
        onClick={handleSignOut}
        className="px-2 py-1 text-xs rounded bg-[#2a2a4e] text-gray-400 hover:text-white hover:bg-[#3a3a6e] transition-colors"
      >
        Wyloguj
      </button>
    </div>
  )
}
