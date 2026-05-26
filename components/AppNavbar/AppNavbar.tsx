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
  email?: string
  isAdmin?: boolean
}

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
      <header className="nauka-mobile-header app-navbar-header">
        <Link href="/" className="nauka-mobile-brand app-navbar-brand" aria-label="MedApp Anatomy Studio">
          <div>
            <strong>MedApp</strong>
            <span>Anatomy Studio</span>
          </div>
        </Link>

        <div className="app-navbar-actions">
          <button className="nauka-mobile-icon-button" aria-label="Powiadomienia" type="button">
            <Bell size={22} strokeWidth={1.9} />
            <span aria-hidden="true" />
          </button>
          {email && (
            <div className="app-navbar-user">
              <UserMenu email={email} displayName={displayName ?? null} isAdmin={isAdmin} />
            </div>
          )}
        </div>
      </header>

      <nav className="nauka-mobile-nav app-navbar-nav" aria-label="Główna nawigacja">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          const href = item.href
          const content = (
            <>
              <Icon size={24} strokeWidth={1.8} />
              <span>{item.label}</span>
            </>
          )

          if (isActive) {
            return (
              <span key={item.id} className="nauka-mobile-nav-item app-navbar-nav-item is-active">
                {content}
              </span>
            )
          }

          return (
            <Link key={item.id} href={href} className="nauka-mobile-nav-item app-navbar-nav-item">
              {content}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
