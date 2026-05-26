'use client'

import { NAUKA_SYSTEMS, SYSTEM_PROGRESS } from '@/lib/naukaData'

interface NaukaHomeProps {
  configSys: string
  configMode: 'nolimit' | 'pomodoro'
  onConfigSysChange: (sys: string) => void
  onConfigModeChange: (mode: 'nolimit' | 'pomodoro') => void
  onStart: () => void
  onRead: () => void
}

const NK = '#2a7a60'
const NK_SOFT = '#d2ede6'

const totalDone  = Object.values(SYSTEM_PROGRESS).reduce((a, v) => a + v.done,  0)
const totalCards = Object.values(SYSTEM_PROGRESS).reduce((a, v) => a + v.total, 0)
const overallPct = Math.round(totalDone / totalCards * 100)

export function NaukaHome({ configSys, configMode, onConfigSysChange, onConfigModeChange, onStart, onRead }: NaukaHomeProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'nk-rise-in 0.3s ease both' }}>

      {/* Hero card */}
      <div style={{
        background: 'linear-gradient(135deg, #edf9f5 0%, #d6f0e8 60%, #c8e8de 100%)',
        border: `1.5px solid ${NK}28`,
        borderRadius: 12, padding: '28px 32px',
        boxShadow: '0 8px 26px rgba(42,122,96,0.10)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative orb */}
        <div style={{
          position: 'absolute', right: -30, top: -30,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(42,122,96,0.08)',
          pointerEvents: 'none',
        }} />

        <h2 style={{
          margin: '0 0 6px',
          fontFamily: '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif',
          fontSize: 26, fontWeight: 500, color: '#1a4a38', lineHeight: 1.1,
        }}>
          Nauka anatomii
        </h2>
        <p style={{ margin: '0 0 22px', fontSize: 13.5, color: NK, fontFamily: 'Inter,sans-serif' }}>
          Opanuj ciało ludzkie karta po karcie
        </p>

        {/* Progress bar */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
            <span style={{ fontSize: 12.5, color: '#28231c', fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>
              Ogólny postęp
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: NK, fontFamily: 'Inter,sans-serif' }}>
              {totalDone}/{totalCards} kart · {overallPct}%
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: 'rgba(42,122,96,0.15)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: `linear-gradient(90deg, ${NK}, #3d9e7e)`,
              width: `${overallPct}%`,
              transition: 'width 0.6s ease',
              boxShadow: '0 0 8px rgba(42,122,96,0.4)',
            }} />
          </div>
        </div>

        {/* Stat chips */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: `${totalDone} opanowanych`, bg: NK_SOFT, color: NK },
            { label: `${totalCards - totalDone} do powtórki`, bg: '#fef3cd', color: '#92680a' },
            { label: '8 nowych dziś', bg: '#e6f4ff', color: '#1a6aad' },
          ].map(chip => (
            <span key={chip.label} style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: chip.bg, color: chip.color, fontFamily: 'Inter,sans-serif',
            }}>
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      {/* Session config card */}
      <div style={{
        background: '#fbf7ee',
        border: '1px solid rgba(91,78,60,0.14)',
        borderRadius: 12, padding: '22px 26px',
        boxShadow: '0 8px 26px rgba(78,66,48,0.08)',
      }}>
        <h3 style={{
          margin: '0 0 18px',
          fontFamily: '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif',
          fontSize: 17, fontWeight: 500, color: '#28231c',
        }}>
          Konfiguracja sesji
        </h3>

        {/* System dropdown */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11.5, color: '#80786d', fontFamily: 'Inter,sans-serif', fontWeight: 600, marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Układ anatomiczny
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={configSys}
              onChange={e => onConfigSysChange(e.target.value)}
              style={{
                width: '100%', padding: '10px 36px 10px 12px', borderRadius: 8,
                border: '1.5px solid rgba(91,78,60,0.18)',
                background: '#f9f5ed', color: '#28231c',
                fontSize: 13, fontFamily: 'Inter,sans-serif',
                appearance: 'none', cursor: 'pointer', outline: 'none',
              }}
            >
              {NAUKA_SYSTEMS.map(s => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
            <span style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none', fontSize: 11, color: '#80786d',
            }}>▼</span>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontSize: 11.5, color: '#80786d', fontFamily: 'Inter,sans-serif', fontWeight: 600, marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Tryb
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { value: 'nolimit' as const,  label: '∞ Bez limitu' },
              { value: 'pomodoro' as const, label: '🍅 Pomodoro (25 min)' },
            ].map(opt => (
              <button key={opt.value} onClick={() => onConfigModeChange(opt.value)}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${configMode === opt.value ? NK : 'rgba(91,78,60,0.18)'}`,
                  background: configMode === opt.value ? NK_SOFT : 'transparent',
                  color: configMode === opt.value ? NK : '#80786d',
                  fontSize: 13, fontFamily: 'Inter,sans-serif', fontWeight: configMode === opt.value ? 600 : 400,
                  transition: 'all 0.15s',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button onClick={onStart}
          style={{
            width: '100%', padding: '13px', borderRadius: 9,
            background: `linear-gradient(135deg, ${NK}, #3d9e7e)`,
            border: 'none', color: '#fff',
            fontSize: 14.5, fontWeight: 700, fontFamily: 'Inter,sans-serif',
            cursor: 'pointer', letterSpacing: '0.02em',
            boxShadow: '0 4px 16px rgba(42,122,96,0.32)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 7px 22px rgba(42,122,96,0.38)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(42,122,96,0.32)' }}
        >
          Rozpocznij sesję
        </button>
      </div>

      {/* Secondary buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onRead}
          style={{
            flex: 1, padding: '12px', borderRadius: 9,
            border: `1.5px solid ${NK}`, background: 'transparent',
            color: NK, fontSize: 13.5, fontWeight: 600, fontFamily: 'Inter,sans-serif',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = NK_SOFT }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          📖 Czytaj materiały
        </button>
        <button
          style={{
            flex: 1, padding: '12px', borderRadius: 9,
            border: '1.5px solid rgba(91,78,60,0.20)', background: 'transparent',
            color: '#80786d', fontSize: 13.5, fontWeight: 600, fontFamily: 'Inter,sans-serif',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f1eadc' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          📊 Postęp szczegółowy
        </button>
      </div>

    </div>
  )
}
