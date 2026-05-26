'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { AppNavbar } from '@/components/AppNavbar/AppNavbar'
import { PanelBottom } from '@/components/PanelBottom/PanelBottom'
import { PanelLeft } from '@/components/PanelLeft/PanelLeft'
import { PanelRight } from '@/components/PanelRight/PanelRight'
import { UserMenu } from '@/components/UserMenu/UserMenu'
import { Viewer3D } from '@/components/Viewer3D/Viewer3D'
import { useAppStore } from '@/lib/store'

interface AppShellProps {
  email: string
  displayName: string | null
  isAdmin: boolean
}

const structureAccents: Record<string, { accent: string; soft: string; color: string }> = {
  serce: { accent: '#bd514d', soft: '#f5dfdc', color: '#ca6678' },
  lung: { accent: '#6578b5', soft: '#e4e9f8', color: '#8c91d0' },
  stomach: { accent: '#a56d7f', soft: '#f4e2e7', color: '#d79baa' },
  liver: { accent: '#4f8a3f', soft: '#e5f1d8', color: '#81b64b' },
  kidney: { accent: '#48a77d', soft: '#dbf1e7', color: '#65b8ae' },
}

function getSystemAccent(system?: string) {
  if (!system) return { accent: '#9b74b7', soft: '#efe5f6', color: '#9db6dc' }
  const normalized = system.toLowerCase()
  if (normalized.includes('krąż') || normalized.includes('kra')) {
    return { accent: '#bd514d', soft: '#f5dfdc', color: '#ca6678' }
  }
  if (normalized.includes('oddech')) {
    return { accent: '#6578b5', soft: '#e4e9f8', color: '#8c91d0' }
  }
  if (normalized.includes('pokarm')) {
    return { accent: '#a56d7f', soft: '#f4e2e7', color: '#d79baa' }
  }
  if (normalized.includes('mocz')) {
    return { accent: '#48a77d', soft: '#dbf1e7', color: '#65b8ae' }
  }
  return { accent: '#9b74b7', soft: '#efe5f6', color: '#9db6dc' }
}

export function AppShell({ email, displayName, isAdmin }: AppShellProps) {
  const selectedStructure = useAppStore((state) => state.selectedStructure)
  const palette =
    (selectedStructure && structureAccents[selectedStructure.id]) ??
    getSystemAccent(selectedStructure?.system)
  const shellStyle = {
    '--accent': palette.accent,
    '--accent-soft': palette.soft,
    '--model-color': palette.color,
  } as CSSProperties

  return (
    <div className="medapp-shell" style={shellStyle}>
      <AppNavbar active="atlas" email={email} displayName={displayName} isAdmin={isAdmin} />

      <div className="medapp-grid" id="explorer">
        <PanelLeft />
        <div className="center-stack">
          <Viewer3D />
          <PanelBottom />
        </div>
        <PanelRight />
      </div>
    </div>
  )
}
