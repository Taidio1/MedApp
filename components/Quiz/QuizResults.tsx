'use client'

import { QuizQuestion, QZ_OK, QZ_OK_SOFT, QZ_ERR, QZ_ERR_SOFT, isAnswerCorrect } from './quizData'
import { PanelHeader } from './PanelHeader'

interface QuizResultsProps {
  questions: QuizQuestion[]
  answers: (number | string | null)[]
  timeStr: string
  streak: number
  onRestart: () => void
  onHome: () => void
  onHistory: () => void
  onLeaderboard: () => void
}

export function QuizResults({ questions, answers, timeStr, streak, onRestart, onHome, onHistory, onLeaderboard }: QuizResultsProps) {
  const score = answers.filter((a, i) => isAnswerCorrect(questions[i], a)).length
  const pct = Math.round((score / questions.length) * 100)
  const grade = pct === 100 ? '🏆 Doskonale!' : pct >= 80 ? '🌟 Bardzo dobrze!' : pct >= 60 ? '👍 Nieźle!' : '📚 Ćwicz więcej'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 840, margin: '0 auto', width: '100%' }}>
      {/* Score hero */}
      <div style={{ padding: '8px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>{grade}</div>
        <div style={{ fontSize: 64, fontFamily: '"Libre Baskerville",Georgia,serif', color: 'var(--qz-accent)', fontWeight: 700, lineHeight: 1 }}>
          {score}<span style={{ fontSize: 28, color: '#80786d', fontWeight: 400 }}>/{questions.length}</span>
        </div>
        <div style={{ fontSize: 16, color: '#80786d', fontFamily: 'Inter,sans-serif', marginTop: 8 }}>{pct}% poprawnych odpowiedzi</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 24 }}>
          {([['⏱', timeStr, 'Czas'], ['🔥', streak, 'Najlepsza seria'], ['⭐', Math.round(score * 280), 'Punkty XP']] as [string, string | number, string][]).map(([ic, v, l]) => (
            <div key={l}>
              <div style={{ fontSize: 16 }}>{ic} <strong style={{ fontFamily: 'Inter,sans-serif', color: '#28231c' }}>{v}</strong></div>
              <div style={{ fontSize: 12, color: '#80786d', fontFamily: 'Inter,sans-serif', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: '1px', background: 'var(--line)', margin: '4px 0' }} />

      {/* Per-question breakdown */}
      <div>
        <PanelHeader icon="📋" title="Podsumowanie odpowiedzi" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {questions.map((q, i) => {
            const ok = isAnswerCorrect(q, answers[i])
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 16px', background: ok ? QZ_OK_SOFT : QZ_ERR_SOFT, borderRadius: 10, border: `1.5px solid ${ok ? QZ_OK : QZ_ERR}15` }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{ok ? '✓' : '✗'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: '#28231c', fontFamily: 'Inter,sans-serif', lineHeight: 1.5 }}>{q.q}</div>
                  <div style={{ fontSize: 12, color: '#80786d', fontFamily: 'Inter,sans-serif', marginTop: 4, fontWeight: 500 }}>{q.struct} · {q.diff}</div>
                </div>
                <span style={{ fontSize: 12, color: ok ? QZ_OK : QZ_ERR, fontWeight: 700, fontFamily: 'Inter,sans-serif', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{ok ? 'Poprawna' : 'Błędna'}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ height: '1px', background: 'var(--line)', margin: '4px 0' }} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onRestart} style={{ flex: 2, padding: '14px', borderRadius: 9, border: 'none', background: 'var(--qz-accent)', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'Inter,sans-serif', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,107,196,0.25)' }}>Nowy quiz</button>
        <button onClick={onHistory} style={{ flex: 1, padding: '14px', borderRadius: 9, border: '1.5px solid rgba(91,78,60,0.2)', background: '#fbf7ee', color: '#28231c', fontSize: 14, fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>Historia</button>
        <button onClick={onLeaderboard} style={{ flex: 1, padding: '14px', borderRadius: 9, border: '1.5px solid rgba(91,78,60,0.2)', background: '#fbf7ee', color: '#28231c', fontSize: 14, fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>Ranking</button>
      </div>
    </div>
  )
}
