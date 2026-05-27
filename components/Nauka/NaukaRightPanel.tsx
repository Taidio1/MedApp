'use client'

import type { NaukaCard } from '@/lib/naukaData'
import type { UserNaukaStats } from '@/lib/supabase/nauka'

type NaukaScreen  = 'tablica' | 'sesja' | 'czytaj'
type SessionPhase = 'running' | 'done'

interface NaukaRightPanelProps {
  screen: NaukaScreen
  phase: SessionPhase
  currentCard: NaukaCard | null
  notes: Record<string, string>
  stats: UserNaukaStats | null
  onNoteChange: (cardId: string, text: string) => void
  onStart: () => void
  onRead: () => void
}

const NK       = '#2C6844'
const NK_HOVER = '#245738'
const NK_LIGHT = '#EAF2EC'
const NK_BORDER = '#C5DCC9'
const C = {
  card:   '#FFFFFF',
  alt:    '#F0EDE8',
  text:   '#1B1B19',
  sub:    '#686864',
  muted:  '#9A9A96',
  border: '#E6E2DC',
}
const FONT = "'Manrope', var(--font-manrope, sans-serif)"

function IcoFlame() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C7 4.5 5 5.5 5 8.5a3 3 0 006 0c0-2-.8-3-1.5-3.5-.2 1-.5 1.8-.5 2.5a1.5 1.5 0 01-3 0c0-3 2-4 2-6z" fill="#E07020"/></svg>
}
function IcoCards() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="4.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M4.5 4.5V3.5A1.5 1.5 0 016 2h7.5A1.5 1.5 0 0115 3.5v8A1.5 1.5 0 0113.5 13H12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function IcoTrend() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 10.5L5 7l3 3L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function IcoClock() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function IcoCheck() {
  return <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function IcoPlay() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 2l9 5-9 5V2z" fill="currentColor"/></svg>
}
function IcoBook() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3.5A1.5 1.5 0 013.5 2H8v12H3.5A1.5 1.5 0 012 12.5V3.5z" stroke="currentColor" strokeWidth="1.4"/><path d="M8 2h4.5A1.5 1.5 0 0114 3.5v9a1.5 1.5 0 01-1.5 1.5H8V2z" stroke="currentColor" strokeWidth="1.4"/><path d="M8 2v12" stroke="currentColor" strokeWidth="1.2"/></svg>
}

function CircProg({ pct, size = 80, sw = 7, color }: { pct: number; size?: number; sw?: number; color: string }) {
  const r    = (size - sw * 2) / 2
  const circ = 2 * Math.PI * r
  const off  = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset .6s ease' }}/>
    </svg>
  )
}

function StreakWidget({ stats }: { stats: UserNaukaStats | null }) {
  const days  = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
  const streak = stats?.sessionsThisWeek ?? 0
  const today  = new Date().getDay()
  const todayIdx = today === 0 ? 6 : today - 1
  // Mark done: last `streak` days up to today
  const done = days.map((_, i) => streak > 0 && i <= todayIdx && (todayIdx - i) < streak)

  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <div style={{
        padding: '14px 16px 12px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, fontFamily: FONT }}>Seria nauki</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 1, fontFamily: FONT }}>
            {streak > 0 ? `Aktywna od ${streak} ${streak === 1 ? 'dnia' : 'dni'}` : 'Zacznij swoją serię!'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FEF0E6', borderRadius: 100, padding: '5px 12px' }}>
          <IcoFlame />
          <span style={{ fontWeight: 800, fontSize: 20, color: '#E07020', lineHeight: 1 }}>{streak}</span>
          <span style={{ fontSize: 11, color: '#C06010', fontWeight: 600, marginLeft: 1 }}>dni</span>
        </div>
      </div>

      <div style={{ padding: '14px 16px 16px', display: 'flex', justifyContent: 'space-between' }}>
        {days.map((d, i) => {
          const isToday = i === todayIdx
          const isDone  = done[i]
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                position: 'relative', width: 32, height: 32, borderRadius: '50%',
                background: isDone ? NK : C.alt,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isToday ? `0 0 0 3px ${NK_LIGHT}` : 'none',
                border: isToday ? `2px solid ${NK}` : '2px solid transparent',
                transition: 'all .2s',
              }}>
                {isDone && <IcoCheck />}
                {isToday && (
                  <span style={{
                    position: 'absolute', inset: -4, borderRadius: '50%',
                    border: `2px solid ${NK}`,
                    animation: 'nk2-pulse-ring 1.6s ease-out infinite',
                    opacity: 0.4,
                  }} />
                )}
              </div>
              <span style={{ fontSize: 10, color: isToday ? NK : C.muted, fontWeight: isToday ? 700 : 400, lineHeight: 1, fontFamily: FONT }}>
                {d}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '10px 16px', background: NK_LIGHT, borderTop: `1px solid ${NK_BORDER}`, fontSize: 12, color: NK, fontWeight: 600, textAlign: 'center', fontFamily: FONT }}>
        Nie przerywaj serii — wróć jutro!
      </div>
    </div>
  )
}

export function NaukaRightPanel({
  screen, phase, currentCard, notes, stats, onNoteChange, onStart, onRead,
}: NaukaRightPanelProps) {
  const knownCards = stats?.knownCards  ?? 0
  const totalCards = stats?.totalCards  ?? 0
  const pct        = totalCards > 0 ? Math.round(knownCards / totalCards * 100) : 0
  const streak     = stats?.sessionsThisWeek ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

      {/* Streak widget */}
      <StreakWidget stats={stats} />

      {/* Overall progress */}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 11, color: C.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 14, fontFamily: FONT }}>
          Postęp ogólny
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#FEF0E6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IcoFlame />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 20, color: C.text, lineHeight: 1 }}>{streak}</div>
                <div style={{ fontSize: 11, color: C.sub, fontFamily: FONT }}>dni z rzędu</div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: FONT }}>Seria</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: NK_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: NK, flexShrink: 0 }}>
                <IcoCards />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 20, color: C.text, lineHeight: 1 }}>{knownCards}</div>
                <div style={{ fontSize: 11, color: C.sub, fontFamily: FONT }}>fiszki</div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: FONT }}>Nauczone</div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <CircProg pct={pct} size={80} sw={7} color={NK} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 17, color: C.text, lineHeight: 1 }}>{pct}%</span>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginTop: 5, fontFamily: FONT }}>Opanowanie</div>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: FONT }}>Wszystkie systemy</div>
          </div>
        </div>
      </div>

      {/* Today's plan */}
      {stats && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12, fontFamily: FONT }}>
            <span style={{ color: NK, display: 'flex' }}><IcoTrend /></span>Plan na dziś
          </div>
          <div style={{ background: C.alt, borderRadius: 10, padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
            {[
              { label: 'Do powtórki', val: stats.cardsToReview.toString(),                       co: C.text,   HasIcon: false },
              { label: 'Nowe dziś',   val: stats.newCardsToday.toString(),                        co: NK,       HasIcon: false },
              { label: 'Czas',        val: stats.estimatedMinutes > 0 ? `~${stats.estimatedMinutes}` : '0', co: C.text, HasIcon: true  },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2, fontFamily: FONT }}>{s.label}</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: s.co, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  {s.HasIcon && <span style={{ display: 'flex', color: C.muted }}><IcoClock /></span>}
                  {s.val}
                </div>
                {s.label === 'Czas' && <div style={{ fontSize: 10, color: C.sub, fontFamily: FONT }}>min</div>}
              </div>
            ))}
          </div>
          <div style={{ height: 3, background: C.alt, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: NK, borderRadius: 2 }} />
          </div>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 8 }} />

      {/* CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onStart}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: 13, borderRadius: 10, border: 'none', cursor: 'pointer',
            fontFamily: FONT, fontWeight: 700, fontSize: 15, color: '#fff',
            background: NK, boxShadow: `0 4px 16px ${NK}38`, transition: 'all .15s', width: '100%',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = NK_HOVER }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = NK }}
        >
          <IcoPlay />Rozpocznij sesję
        </button>
        <button
          onClick={onRead}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: 11, borderRadius: 10, cursor: 'pointer',
            fontFamily: FONT, fontWeight: 600, fontSize: 14,
            color: NK, border: `1.5px solid ${NK}`, background: 'transparent', transition: 'all .15s', width: '100%',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = NK_LIGHT }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <IcoBook />Czytaj materiał
        </button>
      </div>
    </div>
  )
}
