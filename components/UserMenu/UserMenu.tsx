'use client'

import Link from 'next/link'
import { SignOutButton } from '@/components/UserMenu/SignOutButton'

interface UserMenuProps {
  email: string
  displayName: string | null
  isAdmin: boolean
}

export function UserMenu({ email, displayName, isAdmin }: UserMenuProps) {
  return (
    <div className="user-menu">
      <span className="user-menu-name">
        {displayName ?? email}
      </span>

      {isAdmin && (
        <Link
          href="/admin"
          className="user-menu-link"
        >
          Admin
        </Link>
      )}

      <SignOutButton className="user-menu-button" />
    </div>
  )
}
