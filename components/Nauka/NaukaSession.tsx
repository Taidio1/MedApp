'use client'

import { useState } from 'react'
import { NaukaCard } from '@/lib/naukaData'

interface NaukaSessionProps {
  cards: NaukaCard[]
  cardIdx: number
  flipped: boolean
  results: Record<string, boolean>
  phase: 'running' | 'done'
  timeLeft: number | null
  isPaused: boolean
  configMode: 'nolimit' | 'pomodoro'
  onFlip: () => void
  onAnswer: (knew: boolean) => void
  onPauseToggle: () => void
  onBackToBoard: () => void
  onRepeat: () => void
}

const NK = '#2a7a60'
const NK_SOFT = '#d2ede6'

const SYS_COLORS: Record<string, string> = {
  'Układ Krążenia':  '#bd514d',
  'Układ Oddechowy': '#4f8a3f',
  'Układ Pokarmowy': '#9b74b7',
  'OUN':             '#6578b5',
  'Układ Moczowy':   '#48a77d',
}
const DIFF_LABELS: Record<string, string> = {
  basic: 'Podstawowy', intermediate: 'Średni', advanced: 'Zaawansowany',
}
const DIFF_COLORS: Record<string, string> = {
  basic: '#4caf50', intermediate: '#f59e0b', advanced: '#e53935',
}

const POMODORO = 25 * 60

function PomodoroRing({ timeLeft, isPaused, onPauseToggle }: { timeLeft: number; isPaused: boolean; onPauseToggle: () => void }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const progress = timeLeft / POMODORO
  const offset   = circ * (1 - progress)
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')
  const urgent = timeLeft < 60

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 88, height: 88 }}>
        <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="44" cy="44" r={r} fill="none" stroke={NK_SOFT} strokeWidth="5" />
          <circle
            cx="44" cy="44" r={r} fill="none"
            stroke={urgent ? '#e53935' : NK}
            strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 17, fontWeight: 700,
            color: urgent ? '#e53935' : '#28231c',
            fontFamily: 'Inter,sans-serif',
            fontVariantNumeric: 'tabular-nums',
            transition: 'color 0.3s ease',
          }}>
            {mm}:{ss}
          </span>
        </div>
      </div>
      <button onClick={onPauseToggle}
        style={{
          padding: '5px 16px', borderRadius: 20, cursor: 'pointer',
          border: `1.5px solid ${NK}`, background: isPaused ? NK : 'transparent',
          color: isPaused ? '#fff' : NK,
          fontSize: 12, fontFamily: 'Inter,sans-serif', fontWeight: 600,
          transition: 'all 0.15s',
        }}>
        {isPaused ? '▶ Wznów' : '⏸ Pauza'}
      </button>
    </div>
  )
}

function ResultsView({ cards, results, onBackToBoard, onRepeat }: {
  cards: NaukaCard[]
  results: Record<string, boolean>
  onBackToBoard: () => void
  onRepeat: () => void
}) {
  const knew    = Object.values(results).filter(Boolean).length
  const didnt   = Object.values(results).filter(v => !v).length
  const total   = cards.length
  const pct     = total > 0 ? Math.round(knew / total * 100) : 0

  return (
    <div style={{ animation: 'nk-rise-in 0.3s ease both' }}>

      {/* Score hero */}
      <div style={{
        background: pct >= 70
          ? 'linear-gradient(135deg,#edf9f5,#d6f0e8)'
          : 'linear-gradient(135deg,#fff5f5,#fde8e8)',
        border: `1.5px solid ${pct >= 70 ? NK + '30' : '#e5353530'}`,
        borderRadius: 14, padding: '28px 32px', textAlign: 'center', marginBottom: 20,
        boxShadow: '0 8px 26px rgba(78,66,48,0.08)',
      }}>
        <div style={{
          fontSize: 52, fontWeight: 700,
          color: pct >= 70 ? NK : '#c0392b',
          fontFamily: '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif',
          lineHeight: 1,
        }}>
          {knew}<span style={{ fontSize: 28 }}>/{total}</span>
        </div>
        <p style={{ margin: '8px 0 16px', fontSize: 15, color: pct >= 70 ? '#1a4a38' : '#7b2020', fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>
          {pct >= 70 ? 'Świetnie! ' : 'Ćwicz dalej — '}{pct}% opanowanych
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: NK, fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>✓ {knew} znam</span>
          <span style={{ fontSize: 13, color: '#e53935', fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>✗ {didnt} nie znam</span>
        </div>
      </div>

      {/* Per-card breakdown */}
      <div style={{ background: '#fbf7ee', border: '1px solid rgba(91,78,60,0.12)', borderRadius: 10, padding: '16px 18px', marginBottom: 18, boxShadow: '0 4px 14px rgba(78,66,48,0.05)' }}>
        <div style={{ fontSize: 11, color: '#80786d', fontFamily: 'Inter,sans-serif', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Wyniki per karta
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {cards.map(card => {
            const knew = results[card.id]
            return (
              <div key={card.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 10px', borderRadius: 7,
                background: knew ? '#f0faf5' : '#fdf4f4',
                border: `1px solid ${knew ? '#c5e8d5' : '#f5c6c6'}`,
              }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1, color: knew ? NK : '#e53935' }}>
                  {knew ? '✓' : '✗'}
                </span>
                <span style={{ fontSize: 12.5, color: '#28231c', lineHeight: 1.4, fontFamily: '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif' }}>
                  {card.question.length > 70 ? card.question.slice(0, 70) + '…' : card.question}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBackToBoard}
          style={{
            flex: 1, padding: '12px', borderRadius: 9,
            border: `1.5px solid ${NK}`, background: 'transparent',
            color: NK, fontSize: 13.5, fontWeight: 600, fontFamily: 'Inter,sans-serif',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = NK_SOFT }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          Wróć do tablicy
        </button>
        <button onClick={onRepeat}
          style={{
            flex: 1, padding: '12px', borderRadius: 9,
            background: `linear-gradient(135deg, ${NK}, #3d9e7e)`,
            border: 'none', color: '#fff',
            fontSize: 13.5, fontWeight: 700, fontFamily: 'Inter,sans-serif',
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(42,122,96,0.28)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = '' }}
        >
          Powtórz sesję
        </button>
      </div>
    </div>
  )
}

export function NaukaSession({
  cards, cardIdx, flipped, results, phase,
  timeLeft, isPaused, configMode,
  onFlip, onAnswer, onPauseToggle, onBackToBoard, onRepeat,
}: NaukaSessionProps) {
  if (phase === 'done') {
    return <ResultsView cards={cards} results={results} onBackToBoard={onBackToBoard} onRepeat={onRepeat} />
  }

  const card    = cards[cardIdx]
  const knew    = Object.values(results).filter(Boolean).length
  const didnt   = Object.values(results).filter(v => !v).length
  const answered = Object.keys(results).length
  const total   = cards.length

  if (!card) return null

  const sysColor  = SYS_COLORS[card.system] ?? NK
  const diffColor = DIFF_COLORS[card.difficulty] ?? '#80786d'

  return (
    <div style={{ animation: 'nk-rise-in 0.28s ease both' }}>

      {/* Top: progress + score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'rgba(91,78,60,0.10)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: `linear-gradient(90deg, ${NK}, #3d9e7e)`,
            width: `${total > 0 ? (answered / total) * 100 : 0}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
          <span style={{ fontSize: 12.5, color: NK, fontFamily: 'Inter,sans-serif', fontWeight: 700 }}>✓ {knew} znam</span>
          <span style={{ fontSize: 12.5, color: '#e53935', fontFamily: 'Inter,sans-serif', fontWeight: 700 }}>✗ {didnt} nie znam</span>
        </div>
      </div>

      {/* Timer area */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        {configMode === 'pomodoro' && timeLeft !== null ? (
          <PomodoroRing timeLeft={timeLeft} isPaused={isPaused} onPauseToggle={onPauseToggle} />
        ) : (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', borderRadius: 20, fontSize: 13,
            background: NK_SOFT, color: NK,
            fontFamily: 'Inter,sans-serif', fontWeight: 600,
          }}>
            ∞ Bez limitu
          </span>
        )}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
          borderRadius: 20, fontSize: 11.5, fontWeight: 600, fontFamily: 'Inter,sans-serif',
          background: `${diffColor}18`, color: diffColor,
        }}>
          {DIFF_LABELS[card.difficulty]}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
          borderRadius: 20, fontSize: 11.5, fontWeight: 600, fontFamily: 'Inter,sans-serif',
          background: `${sysColor}18`, color: sysColor,
        }}>
          {card.system}
        </span>
      </div>

      {/* Flashcard */}
      <div key={`card-${cardIdx}-${flipped ? 'back' : 'front'}`} style={{
        background: '#fbf7ee',
        border: `1.5px solid ${flipped ? NK + '40' : 'rgba(91,78,60,0.14)'}`,
        borderRadius: 14, padding: '32px 36px',
        boxShadow: '0 8px 26px rgba(78,66,48,0.08)',
        minHeight: 200,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', gap: 20,
        animation: 'nk-card-flip 0.28s cubic-bezier(0.16,1,0.3,1) both',
        marginBottom: 16,
      }}>
        {!flipped ? (
          <>
            <p style={{
              margin: 0, lineHeight: 1.65, fontSize: 17,
              fontFamily: '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif',
              color: '#28231c', fontWeight: 400,
            }}>
              {card.question}
            </p>
            <button onClick={onFlip}
              style={{
                padding: '9px 22px', borderRadius: 8, cursor: 'pointer',
                border: `1.5px solid ${NK}`, background: 'transparent',
                color: NK, fontSize: 13, fontFamily: 'Inter,sans-serif', fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = NK_SOFT }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              Pokaż odpowiedź
            </button>
          </>
        ) : (
          <>
            <p style={{
              margin: 0, lineHeight: 1.7, fontSize: 15.5,
              fontFamily: '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif',
              color: '#1a4a38',
            }}>
              {card.answer}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => onAnswer(false)}
                style={{
                  padding: '10px 24px', borderRadius: 9, cursor: 'pointer',
                  border: '1.5px solid #e53935', background: '#fdf4f4',
                  color: '#c0392b', fontSize: 14, fontFamily: 'Inter,sans-serif', fontWeight: 700,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fae0e0' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fdf4f4' }}
              >
                ✗ Nie znam
              </button>
              <button onClick={() => onAnswer(true)}
                style={{
                  padding: '10px 24px', borderRadius: 9, cursor: 'pointer',
                  border: 'none', background: `linear-gradient(135deg,${NK},#3d9e7e)`,
                  color: '#fff', fontSize: 14, fontFamily: 'Inter,sans-serif', fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(42,122,96,0.28)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = '' }}
              >
                ✓ Znam
              </button>
            </div>
          </>
        )}
      </div>

      {/* Navigation dots */}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 6 }}>
        {cards.map((c, i) => {
          const isCurrentCard = i === cardIdx
          const res = results[c.id]
          const hasResult = res !== undefined

          let bg = 'rgba(91,78,60,0.14)'
          let borderColor = 'transparent'
          if (isCurrentCard) { bg = NK_SOFT; borderColor = NK }
          else if (hasResult && res) bg = '#c5e8d5'
          else if (hasResult && !res) bg = '#f5c6c6'

          const textColor = isCurrentCard ? NK : hasResult ? (res ? NK : '#c0392b') : '#80786d'

          return (
            <div key={c.id} style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: bg, border: `1.5px solid ${borderColor}`,
              color: textColor, fontSize: 11, fontWeight: 700,
              fontFamily: 'Inter,sans-serif',
              transition: 'all 0.2s ease',
            }}>
              {i + 1}
            </div>
          )
        })}
      </div>

    </div>
  )
}
