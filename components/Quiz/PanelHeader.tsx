'use client'

import type { ReactNode } from 'react'

interface PanelHeaderProps {
  icon?: string
  title: string
  right?: ReactNode
}

export function PanelHeader({ icon, title, right }: PanelHeaderProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingBottom: 10, marginBottom: 14,
      borderBottom: '1px dashed rgba(91,78,60,0.22)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <span style={{ fontSize: 13, opacity: 0.7 }}>{icon}</span>}
        <span style={{
          fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', color: '#3f345f',
          fontFamily: '"Bradley Hand","Segoe Print",cursive', textTransform: 'uppercase',
        }}>{title}</span>
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}
