'use client'

import type { QuizHistoryEntry } from './quizData'
import { QZ_OK, QZ_ERR } from './quizData'
import { PanelHeader } from './PanelHeader'

interface QuizHistoryProps {
  onBack: () => void
  entries: QuizHistoryEntry[]
}

export function QuizHistory({ onBack, entries }: QuizHistoryProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680, margin: '0 auto', width: '100%' }}>
      <div style={{ background: '#fbf7ee', border: '1px solid rgba(91,78,60,0.14)', borderRadius: 10, padding: '20px 22px', boxShadow: '0 8px 26px rgba(78,66,48,0.08)' }}>
        <PanelHeader icon="📋" title="Historia sesji"
          right={
            <button onClick={onBack} style={{ fontSize: 12, color: '#80786d', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>← Powrót</button>
          } />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.length === 0 && (
            <p style={{ fontSize: 13, color: '#80786d', fontFamily: 'Inter,sans-serif', textAlign: 'center', padding: '20px 0' }}>Brak historii sesji.</p>
          )}
          {entries.map((h, i) => {
            const pct = Math.round((h.score / h.total) * 100)
            const barColor = pct === 100 ? QZ_OK : pct >= 60 ? 'var(--qz-accent)' : QZ_ERR
            return (
              <div key={i} style={{ padding: '12px 14px', background: '#f1eadc', borderRadius: 8, border: '1px solid rgba(91,78,60,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13.5, color: '#28231c', fontFamily: 'Inter,sans-serif', fontWeight: 500 }}>{h.topic}</div>
                    <div style={{ fontSize: 11, color: '#80786d', fontFamily: 'Inter,sans-serif', marginTop: 2 }}>{h.date} · {h.mode} · {h.time}</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: barColor, fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap' }}>{h.score}/{h.total}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(91,78,60,0.12)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
