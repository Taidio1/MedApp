'use client'

import Link from 'next/link'
import {
  Bell,
  Box,
  CircleQuestionMark,
  GraduationCap,
  House,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { UserMenu } from '@/components/UserMenu/UserMenu'

export type AppNavId = 'atlas' | 'explorer' | 'quiz' | 'nauka' | 'profil'

interface AppNavbarProps {
  active: AppNavId
  displayName?: string | null
  email?: string | null
  isAdmin?: boolean
}

const SANS = 'Inter,sans-serif'

const navItems: { id: AppNavId; label: string; href: string; icon: LucideIcon }[] = [
  { id: 'atlas', label: 'Atlas', href: '/', icon: House },
  { id: 'explorer', label: 'Explorer 3D', href: '/#explorer', icon: Box },
  { id: 'quiz', label: 'Quiz', href: '/quiz', icon: CircleQuestionMark },
  { id: 'nauka', label: 'Nauka', href: '/nauka', icon: GraduationCap },
  { id: 'profil', label: 'Profil', href: '/profil', icon: UserRound },
]

export function AppNavbar({ active, displayName, email, isAdmin = false }: AppNavbarProps) {
  return (
    <div className="app-navbar">
      <Link href="/" className="app-navbar-brand" aria-label="MedApp Anatomy Studio">
        <strong>MedApp</strong>
      </Link>

      <nav className="app-navbar-nav" aria-label="Główna nawigacja">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          const href = item.href
          const content = (
            <>
              <Icon size={22} strokeWidth={1.8} />
              <span>{item.label}</span>
            </>
          )

          if (isActive) {
            return (
              <span key={item.id} className="app-navbar-nav-item is-active">
                {content}
              </span>
            )
          }

          return (
            <Link key={item.id} href={href} className="app-navbar-nav-item">
              {content}
            </Link>
          )
        })}
      </nav>

      <div className="app-navbar-actions">
        {email ? (
          <>
            <button className="app-navbar-icon-button" aria-label="Powiadomienia" type="button">
              <Bell size={20} strokeWidth={2} />
              <span aria-hidden="true" />
            </button>
            <div className="app-navbar-user">
              <UserMenu email={email} displayName={displayName ?? null} isAdmin={isAdmin} />
            </div>
          </>
        ) : (
          <Link
            href="/login"
            style={{
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 500,
              color: '#5b4e3c',
              padding: '7px 16px',
              border: '1.5px solid rgba(91,78,60,0.28)',
              borderRadius: 8,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Zaloguj się
          </Link>
        )}
      </div>
    </div>
  )
}
