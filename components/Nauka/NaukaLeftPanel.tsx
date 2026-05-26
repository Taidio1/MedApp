'use client'

import { NAUKA_SYSTEMS, SYSTEM_PROGRESS } from '@/lib/naukaData'

type NaukaScreen = 'tablica' | 'sesja' | 'czytaj'

interface NaukaLeftPanelProps {
  screen: NaukaScreen
  configSys: string
  onScreenChange: (s: NaukaScreen) => void
  onSysSelect: (sys: string) => void
}

const NK = '#2a7a60'
const NK_SOFT = '#d2ede6'

const navItems = [
  { id: 'tablica' as NaukaScreen, label: 'Tablica', icon: '⊞' },
  { id: 'sesja'   as NaukaScreen, label: 'Sesja nauki', icon: '▶' },
  { id: 'czytaj'  as NaukaScreen, label: 'Czytaj', icon: '📖' },
]

const totalDone  = Object.values(SYSTEM_PROGRESS).reduce((a, v) => a + v.done,  0)
const totalCards = Object.values(SYSTEM_PROGRESS).reduce((a, v) => a + v.total, 0)

export function NaukaLeftPanel({ screen, configSys, onScreenChange, onSysSelect }: NaukaLeftPanelProps) {
  const sysColor = (name: string) =>
    NAUKA_SYSTEMS.find(s => s.name === name)?.color ?? NK

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>

      {/* Nav */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid rgba(91,78,60,0.12)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#80786d', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Inter,sans-serif' }}>
          Nawigacja
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {navItems.map(item => {
            const active = screen === item.id
            return (
              <button key={item.id} onClick={() => onScreenChange(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 11px', borderRadius: 7, width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: active ? NK_SOFT : 'transparent',
                  border: `1.5px solid ${active ? NK : 'transparent'}`,
                  color: active ? NK : '#28231c',
                  fontSize: 13, fontFamily: 'Inter,sans-serif', fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: 14, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Systems */}
      <div style={{ padding: '16px 14px', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#80786d', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Inter,sans-serif' }}>
          Układy anatomiczne
        </div>

        {/* Overall */}
        <button onClick={() => onSysSelect('Wszystkie układy')}
          style={{
            width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 7, cursor: 'pointer',
            background: configSys === 'Wszystkie układy' ? NK_SOFT : '#f1eadc',
            border: `1.5px solid ${configSys === 'Wszystkie układy' ? NK : 'transparent'}`,
            marginBottom: 8, transition: 'all 0.15s',
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: configSys === 'Wszystkie układy' ? NK : '#28231c', fontFamily: 'Inter,sans-serif' }}>
              Wszystkie układy
            </span>
            <span style={{ fontSize: 11, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>{totalDone}/{totalCards}</span>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: 'rgba(91,78,60,0.12)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: NK, width: `${Math.round(totalDone / totalCards * 100)}%`, transition: 'width 0.4s ease' }} />
          </div>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {NAUKA_SYSTEMS.slice(1).map(sys => {
            const prog = SYSTEM_PROGRESS[sys.name]
            const pct  = prog ? Math.round(prog.done / prog.total * 100) : 0
            const active = configSys === sys.name
            return (
              <button key={sys.name} onClick={() => onSysSelect(sys.name)}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                  background: active ? NK_SOFT : 'transparent',
                  border: `1.5px solid ${active ? NK : 'transparent'}`,
                  transition: 'all 0.15s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: sys.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, color: active ? NK : '#28231c', fontFamily: 'Inter,sans-serif', fontWeight: active ? 600 : 400 }}>{sys.name}</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>{pct}%</span>
                </div>
                <div style={{ height: 3, borderRadius: 99, background: 'rgba(91,78,60,0.10)', overflow: 'hidden', marginLeft: 14 }}>
                  <div style={{ height: '100%', borderRadius: 99, background: sys.color, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Today's plan footer */}
      <div style={{ padding: '14px', borderTop: '1px solid rgba(91,78,60,0.12)', background: '#f9f5ed' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#80786d', textTransform: 'uppercase', marginBottom: 9, fontFamily: 'Inter,sans-serif' }}>
          Plan na dziś
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { label: 'Kart do powtórki', value: '8', color: '#bd514d' },
            { label: 'Nowych kart',      value: '5', color: NK },
            { label: 'Czas nauki',       value: '~12 min', color: '#80786d' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: row.color, fontFamily: 'Inter,sans-serif' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
