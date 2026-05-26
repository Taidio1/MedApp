'use client'

import { PanelHeader } from './PanelHeader'
import type { Screen, QuizConfig } from './quizData'

interface QuickLaunchItem {
  struct: string
  sys: string
  icon: string
  color: string
}

interface QuizLeftPanelProps {
  screen: Screen
  config: QuizConfig
  onConfigChange: (c: Partial<QuizConfig>) => void
  onScreenChange: (s: Screen) => void
  onQuickLaunch: (item: QuickLaunchItem) => void
}

const navSections = [
  { id: 'home' as Screen, label: 'Nowy quiz', icon: '📝' },
  { id: 'history' as Screen, label: 'Historia', icon: '📋' },
  { id: 'leaderboard' as Screen, label: 'Ranking', icon: '🏆' },
]

const anatomySystems = [
  { name: 'Układ Krążenia', color: '#bd514d', count: 12 },
  { name: 'Układ Oddechowy', color: '#4f8a3f', count: 8 },
  { name: 'Układ Pokarmowy', color: '#9b74b7', count: 10 },
  { name: 'OUN', color: '#6578b5', count: 15 },
  { name: 'Układ Moczowy', color: '#b8811e', count: 6 },
]

const quickLaunchItems: QuickLaunchItem[] = [
  { struct: 'Serce', sys: 'Układ Krążenia', icon: '🫀', color: '#bd514d' },
  { struct: 'Płuco', sys: 'Układ Oddechowy', icon: '🫁', color: '#4f8a3f' },
  { struct: 'Móżdżek', sys: 'OUN', icon: '🧠', color: '#6578b5' },
  { struct: 'Wątroba', sys: 'Układ Pokarmowy', icon: '🟫', color: '#9b74b7' },
]

function isActive(screen: Screen, id: Screen) {
  if (id === 'home') return screen === 'home' || screen === 'quiz' || screen === 'results'
  return screen === id
}

export function QuizLeftPanel({ screen, onScreenChange, onQuickLaunch }: QuizLeftPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Nav */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid rgba(91,78,60,0.12)' }}>
        <PanelHeader icon="✦" title="Tryby quizu" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navSections.map(s => {
            const active = isActive(screen, s.id)
            return (
              <button key={s.id} onClick={() => onScreenChange(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 7,
                  background: active ? 'var(--qz-accent-soft)' : 'transparent',
                  border: `1.5px solid ${active ? 'var(--qz-accent)' : 'transparent'}`,
                  color: active ? 'var(--qz-accent)' : '#28231c',
                  fontSize: 13, fontFamily: 'Inter,sans-serif', cursor: 'pointer', textAlign: 'left', width: '100%',
                }}>
                <span>{s.icon}</span> {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Anatomical systems */}
      <div style={{ padding: '16px 14px' }}>
        <PanelHeader icon="◉" title="Układy anatomiczne" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {anatomySystems.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 6, background: '#f1eadc', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#28231c', fontFamily: 'Inter,sans-serif' }}>{s.name}</span>
              </div>
              <span style={{ fontSize: 11, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>{s.count}q</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick launch */}
      <div style={{ padding: '14px 14px 18px', borderTop: '1px solid rgba(91,78,60,0.12)', marginTop: 'auto' }}>
        <PanelHeader icon="↗" title="Szybki start z Explorer" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {quickLaunchItems.map(s => (
            <button key={s.struct} onClick={() => onQuickLaunch(s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
                borderRadius: 7, border: '1.5px solid rgba(91,78,60,0.14)',
                background: '#f1eadc', cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 15 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#28231c', fontFamily: 'Inter,sans-serif' }}>{s.struct}</div>
                <div style={{ fontSize: 10, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>{s.sys}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: s.color, fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
