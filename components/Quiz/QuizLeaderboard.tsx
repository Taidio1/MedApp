'use client'

import type { QuizLBEntry } from './quizData'
import { PanelHeader } from './PanelHeader'

interface QuizLeaderboardProps {
  onBack: () => void
  entries: QuizLBEntry[]
}

const medals = ['🥇', '🥈', '🥉']

export function QuizLeaderboard({ onBack, entries }: QuizLeaderboardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680, margin: '0 auto', width: '100%' }}>
      <div style={{ background: '#fbf7ee', border: '1px solid rgba(91,78,60,0.14)', borderRadius: 10, padding: '20px 22px', boxShadow: '0 8px 26px rgba(78,66,48,0.08)' }}>
        <PanelHeader icon="🏆" title="Ranking globalny"
          right={
            <button onClick={onBack} style={{ fontSize: 12, color: '#80786d', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>← Powrót</button>
          } />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.length === 0 && (
            <p style={{ fontSize: 13, color: '#80786d', fontFamily: 'Inter,sans-serif', textAlign: 'center', padding: '20px 0' }}>Brak danych rankingu.</p>
          )}
          {entries.map(p => (
            <div key={p.rank} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
              background: p.isMe ? 'var(--qz-accent-soft)' : p.rank <= 3 ? '#f1eadc' : '#fbf7ee',
              borderRadius: 8, border: `1.5px solid ${p.isMe ? 'var(--qz-accent)' : 'rgba(91,78,60,0.12)'}`,
            }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{medals[p.rank - 1] ?? p.rank}</span>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: p.isMe ? 'var(--qz-accent)' : '#e8dfd0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: p.isMe ? '#fff' : '#80786d', fontWeight: 600, fontFamily: 'Inter,sans-serif',
              }}>{p.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, color: '#28231c', fontFamily: 'Inter,sans-serif', fontWeight: p.isMe ? 600 : 400 }}>{p.name}{p.isMe && ' (Ty)'}</div>
                <div style={{ fontSize: 11, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>🔥 Seria: {p.streak}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--qz-accent)', fontFamily: 'Inter,sans-serif' }}>{p.pts.toLocaleString()} pkt</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
