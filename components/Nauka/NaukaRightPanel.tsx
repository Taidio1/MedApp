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
}

const NK      = '#2a7a60'
const NK_SOFT = '#d2ede6'

const DIFF_LABELS: Record<string, { label: string; color: string }> = {
  basic:        { label: 'Podstawowy',   color: '#4caf50' },
  intermediate: { label: 'Średni',       color: '#f59e0b' },
  advanced:     { label: 'Zaawansowany', color: '#e53935' },
}

const SYS_COLORS: Record<string, string> = {
  'Układ Krążenia':  '#bd514d',
  'Układ Oddechowy': '#4f8a3f',
  'Układ Pokarmowy': '#9b74b7',
  'OUN':             '#6578b5',
  'Układ Moczowy':   '#48a77d',
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#80786d', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'Inter,sans-serif' }}>
      {children}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fbf7ee', border: '1px solid rgba(91,78,60,0.14)', borderRadius: 10, padding: '14px 16px', boxShadow: '0 4px 14px rgba(78,66,48,0.06)', ...style }}>
      {children}
    </div>
  )
}

export function NaukaRightPanel({ screen, phase, currentCard, notes, stats, onNoteChange }: NaukaRightPanelProps) {
  const inSession = screen === 'sesja' && phase === 'running' && currentCard !== null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', overflowY: 'auto' }}>

      {/* Notes */}
      <Card>
        <SectionLabel>Notatki</SectionLabel>
        <textarea
          placeholder={currentCard ? `Notatka do: ${currentCard.struct}…` : 'Wybierz kartę, aby dodać notatkę…'}
          disabled={!currentCard}
          value={currentCard ? (notes[currentCard.id] ?? '') : ''}
          onChange={e => currentCard && onNoteChange(currentCard.id, e.target.value)}
          style={{
            width: '100%', minHeight: 90, resize: 'vertical',
            padding: '9px 11px', borderRadius: 8,
            border: '1px solid rgba(91,78,60,0.16)',
            background: currentCard ? 'rgba(255,255,255,0.7)' : 'rgba(91,78,60,0.04)',
            color: '#28231c', fontSize: 12.5, lineHeight: 1.6,
            fontFamily: '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif',
            outline: 'none',
            cursor: currentCard ? 'text' : 'not-allowed',
            opacity: currentCard ? 1 : 0.6,
          }}
        />
      </Card>

      {/* During session: Mnemonic + Details */}
      {inSession && currentCard && (
        <>
          <Card>
            <SectionLabel>Mnemotechnika</SectionLabel>
            <p style={{
              margin: 0, fontStyle: 'italic', lineHeight: 1.65, fontSize: 13,
              fontFamily: '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif',
              color: '#4b4236',
            }}>
              {currentCard.mnemonic}
            </p>
          </Card>

          <Card>
            <SectionLabel>Szczegóły</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
                borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'Inter,sans-serif',
                background: NK_SOFT, color: NK,
              }}>
                {currentCard.struct}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
                borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'Inter,sans-serif',
                background: `${SYS_COLORS[currentCard.system] ?? NK}18`,
                color: SYS_COLORS[currentCard.system] ?? NK,
              }}>
                {currentCard.system}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
                borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'Inter,sans-serif',
                background: `${DIFF_LABELS[currentCard.difficulty]?.color ?? '#ccc'}18`,
                color: DIFF_LABELS[currentCard.difficulty]?.color ?? '#ccc',
              }}>
                {DIFF_LABELS[currentCard.difficulty]?.label}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.65, color: '#4b4236', fontFamily: '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif' }}>
              {currentCard.details}
            </p>
          </Card>
        </>
      )}

      {/* Outside session: Stats + Import/Share */}
      {!inSession && (
        <>
          <Card>
            <SectionLabel>Statystyki</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Łączne karty',     value: stats?.totalCards.toString()              ?? '—', icon: '◉' },
                { label: 'Opanowane',        value: stats?.knownCards.toString()              ?? '—', icon: '✓' },
                { label: 'Sesje w tym tyg.', value: stats?.sessionsThisWeek.toString()        ?? '—', icon: '▶' },
                { label: 'Czas nauki',       value: stats ? formatMinutes(stats.totalStudyMinutes) : '—', icon: '⏱' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(91,78,60,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13, color: NK }}>{row.icon}</span>
                    <span style={{ fontSize: 12, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#28231c', fontFamily: 'Inter,sans-serif' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <button style={{
            width: '100%', padding: '11px', borderRadius: 8,
            border: '1.5px dashed rgba(91,78,60,0.25)', background: 'transparent',
            color: '#80786d', fontSize: 12.5, fontFamily: 'Inter,sans-serif',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = NK; (e.currentTarget as HTMLButtonElement).style.color = NK }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(91,78,60,0.25)'; (e.currentTarget as HTMLButtonElement).style.color = '#80786d' }}
          >
            <span>↑</span> Importuj karty
          </button>

          <button style={{
            width: '100%', padding: '11px', borderRadius: 8,
            border: '1.5px dashed rgba(91,78,60,0.25)', background: 'transparent',
            color: '#80786d', fontSize: 12.5, fontFamily: 'Inter,sans-serif',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = NK; (e.currentTarget as HTMLButtonElement).style.color = NK }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(91,78,60,0.25)'; (e.currentTarget as HTMLButtonElement).style.color = '#80786d' }}
          >
            <span>↗</span> Udostępnij postęp
          </button>
        </>
      )}
    </div>
  )
}
