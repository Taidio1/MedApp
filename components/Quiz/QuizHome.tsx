'use client'

import { PanelHeader } from './PanelHeader'
import type { QuizConfig } from './quizData'

interface QuizHomeProps {
  config: QuizConfig
  onConfigChange: (c: Partial<QuizConfig>) => void
  onStart: () => void
  onHistory: () => void
  onLeaderboard: () => void
}

const sel: React.CSSProperties = {
  fontSize: 13, fontFamily: 'Inter,sans-serif', color: '#28231c', background: '#fbf7ee',
  border: '1.5px solid rgba(91,78,60,0.2)', borderRadius: 7, padding: '8px 10px',
  width: '100%', outline: 'none', cursor: 'pointer',
  appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2380786d'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 28,
}

const systems = ['Wszystkie układy', 'Układ Krążenia', 'Układ Oddechowy', 'Układ Pokarmowy', 'OUN']
const diffs = ['Wszystkie poziomy', 'Łatwy', 'Średni', 'Trudny']

export function QuizHome({ config, onConfigChange, onStart, onHistory, onLeaderboard }: QuizHomeProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 840, margin: '0 auto', width: '100%' }}>
      {/* Hero */}
      <div style={{ padding: '8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--qz-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📝</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontFamily: '"Libre Baskerville",Georgia,serif', color: '#28231c', fontWeight: 400 }}>Quiz anatomiczny</h1>
            <p style={{ margin: 0, fontSize: 14, color: '#80786d', fontFamily: 'Inter,sans-serif', fontStyle: 'italic' }}>Sprawdź swoją wiedzę o układach i strukturach</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
          {([['5', 'dostępnych pytań'], ['80%', 'ostatni wynik'], ['3', 'sesji w tym tyg.']] as [string, string][]).map(([v, l]) => (
            <div key={l} style={{ flex: '1 1 140px', background: 'var(--qz-accent-soft)', borderRadius: 10, padding: '14px 18px', border: '1px solid rgba(124,107,196,0.1)' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--qz-accent)', fontFamily: 'Inter,sans-serif' }}>{v}</div>
              <div style={{ fontSize: 12, color: '#80786d', fontFamily: 'Inter,sans-serif', fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: '1px', background: 'var(--line)', margin: '4px 0' }} />

      {/* Config */}
      <div>
        <PanelHeader icon="⚙" title="Konfiguracja quizu" />
        <div className="quiz-config-grid" style={{ marginTop: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#80786d', fontFamily: 'Inter,sans-serif', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Układ anatomiczny</label>
            <select value={config.system} onChange={e => onConfigChange({ system: e.target.value })} style={sel}>
              {systems.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#80786d', fontFamily: 'Inter,sans-serif', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Poziom trudności</label>
            <select value={config.diff} onChange={e => onConfigChange({ diff: e.target.value })} style={sel}>
              {diffs.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 24, marginTop: 16 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#80786d', fontFamily: 'Inter,sans-serif', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tryb quizu</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['Nauka', 'Egzamin'] as const).map(m => (
              <button key={m} onClick={() => onConfigChange({ mode: m })}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 9,
                  border: `1.5px solid ${config.mode === m ? 'var(--qz-accent)' : 'rgba(91,78,60,0.18)'}`,
                  background: config.mode === m ? 'var(--qz-accent-soft)' : '#f1eadc',
                  color: config.mode === m ? 'var(--qz-accent)' : '#80786d',
                  fontSize: 14, fontWeight: config.mode === m ? 600 : 400, fontFamily: 'Inter,sans-serif', cursor: 'pointer',
                  transition: 'all 0.18s',
                }}>
                {m === 'Nauka' ? '📖 Nauka' : '⏱ Egzamin'}
              </button>
            ))}
          </div>
          {config.mode === 'Egzamin' && (
            <p style={{ margin: '12px 0 0', fontSize: 13, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>
              Limit czasu: 2 minuty · Bez podpowiedzi · Wynik zapisany do rankingu
            </p>
          )}
        </div>
        <button onClick={onStart} style={{
          width: '100%', padding: '14px', borderRadius: 10, border: 'none',
          background: 'var(--qz-accent)', color: '#fff', fontSize: 15, fontWeight: 600,
          fontFamily: 'Inter,sans-serif', cursor: 'pointer', letterSpacing: '0.02em',
          boxShadow: '0 4px 14px rgba(124,107,196,0.25)', transition: 'opacity 0.18s',
        }}>Rozpocznij Quiz →</button>
      </div>

      <div style={{ height: '1px', background: 'var(--line)', margin: '4px 0' }} />

      {/* History + Leaderboard buttons */}
      <div className="quiz-action-row">
        {([['📋 Historia sesji', onHistory], ['🏆 Ranking', onLeaderboard]] as [string, () => void][]).map(([label, fn]) => (
          <button key={label} onClick={fn} style={{
            flex: 1, padding: '12px', borderRadius: 9, border: '1.5px solid rgba(91,78,60,0.18)',
            background: '#fbf7ee', color: '#28231c', fontSize: 14, fontFamily: 'Inter,sans-serif',
            cursor: 'pointer', transition: 'background 0.15s',
          }}>{label}</button>
        ))}
      </div>
    </div>
  )
}
