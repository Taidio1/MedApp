'use client'

import { useState, useEffect, useCallback } from 'react'
import { NAUKA_SYSTEMS } from '@/lib/naukaData'
import type { NaukaCard } from '@/lib/naukaData'
import type { UserNaukaStats } from '@/lib/supabase/nauka'

interface NaukaHomeProps {
  configSys: string
  configMode: 'nolimit' | 'pomodoro'
  progress: Record<string, { done: number; total: number }>
  stats: UserNaukaStats | null
  cards: NaukaCard[]
  onConfigSysChange: (sys: string) => void
  onConfigModeChange: (mode: 'nolimit' | 'pomodoro') => void
  onStart: () => void
  onRead: () => void
}

const NK       = '#2C6844'
const NK_LIGHT = '#EAF2EC'
const C = {
  card:   '#FFFFFF',
  alt:    '#F0EDE8',
  text:   '#1B1B19',
  sub:    '#686864',
  muted:  '#9A9A96',
  border: '#E6E2DC',
}
const FONT = "'Manrope', var(--font-manrope, sans-serif)"

const SYS_CARD_COLORS: Record<string, { bg: string; ac: string }> = {
  'Układ Krążenia':  { bg: '#FDE8E0', ac: '#A86850' },
  'Układ Oddechowy': { bg: '#E8F2EB', ac: '#3D8A55' },
  'Układ Pokarmowy': { bg: '#EDE8F8', ac: '#7A59B3' },
  'OUN':             { bg: '#E0EAF8', ac: '#4F6EAA' },
  'Układ Moczowy':   { bg: '#E0F2EF', ac: '#2D8A7A' },
  default:           { bg: '#EAF2EC', ac: '#2C6844' },
}

function IcoBook() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3.5A1.5 1.5 0 013.5 2H8v12H3.5A1.5 1.5 0 012 12.5V3.5z" stroke="currentColor" strokeWidth="1.4"/><path d="M8 2h4.5A1.5 1.5 0 0114 3.5v9a1.5 1.5 0 01-1.5 1.5H8V2z" stroke="currentColor" strokeWidth="1.4"/><path d="M8 2v12" stroke="currentColor" strokeWidth="1.2"/></svg>
}
function IcoNote() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function IcoChevR() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function IcoChevL() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function IcoBrain() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2C5.24 2 3 4.24 3 7c0 1.86 1 3.48 2.5 4.36V14h5v-2.64C12 10.48 13 8.86 13 7c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 2v12" stroke="currentColor" strokeWidth="1.1"/></svg>
}
function IcoInf() {
  return <svg width="20" height="11" viewBox="0 0 20 11" fill="none"><path d="M5 5.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5zm10 0a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" stroke="currentColor" strokeWidth="1.4"/><path d="M7.5 3.5c1 2.5 4 2.5 5 0M7.5 7.5c1-2.5 4-2.5 5 0" stroke="currentColor" strokeWidth="1.2"/></svg>
}
function IcoTimer() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 5.5v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 1.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}

export function NaukaHome({
  configSys, configMode, progress, stats, cards,
  onConfigSysChange, onConfigModeChange, onStart, onRead,
}: NaukaHomeProps) {
  const [browseIdx, setBrowseIdx] = useState(0)
  const [flipped, setFlipped]     = useState(false)

  const systemCards = configSys === 'Wszystkie układy'
    ? cards
    : cards.filter(c => c.system === configSys)
  const total = systemCards.length
  const card  = systemCards[browseIdx] ?? null

  useEffect(() => {
    setBrowseIdx(0)
    setFlipped(false)
  }, [configSys])

  const nextCard = useCallback(() => {
    setFlipped(false)
    setTimeout(() => setBrowseIdx(i => (i + 1) % Math.max(total, 1)), 80)
  }, [total])

  const prevCard = useCallback(() => {
    setFlipped(false)
    setTimeout(() => setBrowseIdx(i => (i - 1 + Math.max(total, 1)) % Math.max(total, 1)), 80)
  }, [total])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight') nextCard()
      if (e.key === 'ArrowLeft')  prevCard()
      if (e.key === ' ')          { e.preventDefault(); setFlipped(f => !f) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [nextCard, prevCard])

  const cardColors = card
    ? (SYS_CARD_COLORS[card.system] ?? SYS_CARD_COLORS.default)
    : SYS_CARD_COLORS.default

  const dotCount = Math.min(systemCards.length, 8)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 780, margin: '0 auto' }}>
      {/* System selector */}
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: C.text, fontFamily: FONT }}>System</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {NAUKA_SYSTEMS.map(s => {
            const active = configSys === s.name
            return (
              <button key={s.name}
                onClick={() => onConfigSysChange(s.name)}
                style={{
                  padding: '7px 16px', borderRadius: 100,
                  fontFamily: FONT, fontSize: 13, cursor: 'pointer', transition: 'all .15s',
                  background: active ? NK : C.alt,
                  color:      active ? '#fff' : C.text,
                  border:     active ? 'none' : `1px solid ${C.border}`,
                  fontWeight: active ? 600 : 500,
                }}>
                {s.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Flashcard browser */}
      {card && (
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, boxShadow: '0 2px 20px rgba(20,15,5,.07)' }}>

          {/* Card header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ background: NK_LIGHT, color: NK, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
              Fiszki
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: C.sub, fontWeight: 500, fontFamily: FONT }}>
                {browseIdx + 1} <span style={{ color: C.muted }}>/</span> {total}
              </span>
              <div style={{ width: 88, height: 4, background: C.alt, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  width: `${((browseIdx + 1) / Math.max(total, 1)) * 100}%`,
                  height: '100%', background: NK, borderRadius: 2, transition: 'width .35s ease',
                }} />
              </div>
            </div>
          </div>

          {/* 3D flip card */}
          <div className="nk2-flip-wrap" style={{ height: 216, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setFlipped(f => !f)}>
            <div className={`nk2-flip-inner${flipped ? ' flipped' : ''}`}>

              {/* Front */}
              <div className="nk2-flip-face" style={{ background: cardColors.bg, display: 'flex', alignItems: 'center', gap: 24, padding: '22px 26px' }}>
                <div style={{
                  width: 120, height: 172, borderRadius: 12, background: cardColors.bg,
                  position: 'relative', overflow: 'hidden', flexShrink: 0,
                  border: `1.5px solid ${cardColors.ac}22`,
                }}>
                  <svg width="120" height="172" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.09 }}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <line key={i} x1={i * 14 - 6} y1={0} x2={i * 14 + 24} y2={200} stroke={cardColors.ac} strokeWidth="1.2" />
                    ))}
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg width="44" height="40" viewBox="0 0 24 22" fill="none" style={{ opacity: 0.22 }}>
                      <path d="M12 21S1 14 1 7.5a5.5 5.5 0 0111-.5 5.5 5.5 0 0111 .5C23 14 12 21 12 21z" fill={cardColors.ac} />
                    </svg>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3, margin: 0, lineHeight: 1.15, color: C.text, fontFamily: FONT }}>
                    {card.struct}
                  </h2>
                  <p style={{ fontSize: 13, color: C.sub, fontStyle: 'italic', margin: '4px 0 10px', fontFamily: FONT }}>{card.system}</p>
                  <div style={{ width: 32, height: 1.5, background: C.border, marginBottom: 10 }} />
                  <p style={{ fontSize: 13.5, color: C.text, lineHeight: 1.68, margin: 0, fontFamily: FONT }}>
                    {card.question}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 14, color: NK, fontSize: 13, fontWeight: 600, fontFamily: FONT }}>
                    Pokaż odpowiedź <IcoChevR />
                  </div>
                </div>
              </div>

              {/* Back */}
              <div className="nk2-flip-back" style={{ background: NK_LIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '28px 36px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: NK, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, fontFamily: FONT }}>
                  {card.struct} — odpowiedź
                </div>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.78, margin: 0, fontFamily: FONT }}>{card.answer}</p>
                <div style={{ marginTop: 18, fontSize: 12, color: NK, fontWeight: 600, opacity: 0.65, fontFamily: FONT }}>
                  Kliknij lub naciśnij spację, aby wrócić →
                </div>
              </div>
            </div>
          </div>

          {/* Navigation row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <button onClick={e => { e.stopPropagation(); prevCard() }} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8,
              background: C.alt, border: `1px solid ${C.border}`, color: C.text,
              fontSize: 13, fontWeight: 500, fontFamily: FONT, cursor: 'pointer',
            }}>
              <IcoChevL />Poprzednia
            </button>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {Array.from({ length: dotCount }).map((_, i) => (
                <div key={i}
                  onClick={e => { e.stopPropagation(); setBrowseIdx(i); setFlipped(false) }}
                  style={{
                    width: i === browseIdx ? 22 : 7, height: 7, borderRadius: 4,
                    background: i === browseIdx ? NK : C.border,
                    cursor: 'pointer', transition: 'all .2s',
                  }}
                />
              ))}
              {systemCards.length > 8 && <span style={{ fontSize: 11, color: C.muted }}>…</span>}
            </div>

            <button onClick={e => { e.stopPropagation(); nextCard() }} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8,
              background: C.alt, border: `1px solid ${C.border}`, color: C.text,
              fontSize: 13, fontWeight: 500, fontFamily: FONT, cursor: 'pointer',
            }}>
              Następna<IcoChevR />
            </button>
          </div>

          {/* Keyboard hints */}
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 14, fontSize: 11, color: C.muted }}>
            {([['←  →', 'nawigacja'], ['spacja', 'odwróć']] as [string, string][]).map(([k, l]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <kbd style={{ background: C.alt, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 6px', fontFamily: 'monospace', fontSize: 10 }}>{k}</kbd>
                <span>{l}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Study mode */}
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ color: NK, display: 'flex' }}><IcoBrain /></span>
          <span style={{ fontWeight: 600, fontSize: 14, color: C.text, fontFamily: FONT }}>Tryb nauki</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {([
            { value: 'nolimit'  as const, label: 'Bez limitu', sub: 'Ucz się bez ograniczeń', Icon: IcoInf   },
            { value: 'pomodoro' as const, label: 'Pomodoro',   sub: '25 min skupienia',        Icon: IcoTimer },
          ]).map(m => {
            const active = configMode === m.value
            const MIcon = m.Icon
            return (
              <button key={m.value} onClick={() => onConfigModeChange(m.value)}
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: 10,
                  background: active ? C.alt : 'transparent',
                  border: `1.5px solid ${active ? NK : C.border}`,
                  fontFamily: FONT, cursor: 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s',
                }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: `2px solid ${active ? NK : C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'border-color .15s',
                }}>
                  {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: NK }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{m.sub}</div>
                </div>
                <span style={{ color: C.muted, display: 'flex', flexShrink: 0 }}><MIcon /></span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Materials */}
      <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '16px 20px' }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12, fontFamily: FONT }}>Materiały</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {([
            { Icon: IcoBook, label: 'Materiały do czytania', sub: 'Artykuły i opracowania',    iconBg: NK_LIGHT, iconCo: NK,          onClick: onRead },
            { Icon: IcoNote, label: 'Notatki',               sub: 'Twoje notatki i informacje', iconBg: '#EDE8F8', iconCo: '#7A59B3', onClick: undefined as (() => void) | undefined },
          ]).map((item, i) => {
            const ItemIcon = item.Icon
            return (
              <button key={i}
                onClick={item.onClick}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  borderRadius: 12, border: `1px solid ${C.border}`, cursor: item.onClick ? 'pointer' : 'default',
                  background: 'transparent', fontFamily: FONT, transition: 'background .13s', textAlign: 'left',
                }}
                onMouseEnter={e => { if (item.onClick) (e.currentTarget as HTMLButtonElement).style.background = C.alt }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.iconCo, flexShrink: 0 }}>
                  <ItemIcon />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>{item.sub}</div>
                </div>
                <span style={{ color: C.muted, display: 'flex', flexShrink: 0 }}><IcoChevR /></span>
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
