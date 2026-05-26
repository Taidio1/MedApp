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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 680, margin: '0 auto', width: '100%' }}>
      {/* Score hero */}
      <div style={{ background: '#fbf7ee', border: '1px solid rgba(91,78,60,0.14)', borderRadius: 10, padding: '28px 32px', textAlign: 'center', boxShadow: '0 8px 26px rgba(78,66,48,0.08)' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>{grade}</div>
        <div style={{ fontSize: 52, fontFamily: '"Libre Baskerville",Georgia,serif', color: 'var(--qz-accent)', fontWeight: 700, lineHeight: 1 }}>
          {score}<span style={{ fontSize: 24, color: '#80786d', fontWeight: 400 }}>/{questions.length}</span>
        </div>
        <div style={{ fontSize: 15, color: '#80786d', fontFamily: 'Inter,sans-serif', marginTop: 4 }}>{pct}% poprawnych odpowiedzi</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 18 }}>
          {([['⏱', timeStr, 'Czas'], ['🔥', streak, 'Najlepsza seria'], ['⭐', Math.round(score * 280), 'Punkty XP']] as [string, string | number, string][]).map(([ic, v, l]) => (
            <div key={l}>
              <div style={{ fontSize: 14 }}>{ic} <strong style={{ fontFamily: 'Inter,sans-serif', color: '#28231c' }}>{v}</strong></div>
              <div style={{ fontSize: 11, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-question breakdown */}
      <div style={{ background: '#fbf7ee', border: '1px solid rgba(91,78,60,0.14)', borderRadius: 10, padding: '20px 22px', boxShadow: '0 8px 26px rgba(78,66,48,0.08)' }}>
        <PanelHeader icon="📋" title="Podsumowanie odpowiedzi" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {questions.map((q, i) => {
            const ok = isAnswerCorrect(q, answers[i])
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', background: ok ? QZ_OK_SOFT : QZ_ERR_SOFT, borderRadius: 7, border: `1px solid ${ok ? QZ_OK : QZ_ERR}22` }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{ok ? '✓' : '✗'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: '#28231c', fontFamily: 'Inter,sans-serif', lineHeight: 1.4 }}>{q.q}</div>
                  <div style={{ fontSize: 11, color: '#80786d', fontFamily: 'Inter,sans-serif', marginTop: 2 }}>{q.struct} · {q.diff}</div>
                </div>
                <span style={{ fontSize: 11, color: ok ? QZ_OK : QZ_ERR, fontWeight: 600, fontFamily: 'Inter,sans-serif', flexShrink: 0 }}>{ok ? 'Poprawna' : 'Błędna'}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onRestart} style={{ flex: 2, padding: '12px', borderRadius: 8, border: 'none', background: 'var(--qz-accent)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>Nowy quiz</button>
        <button onClick={onHistory} style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1.5px solid rgba(91,78,60,0.2)', background: '#fbf7ee', color: '#28231c', fontSize: 13, fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>Historia</button>
        <button onClick={onLeaderboard} style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1.5px solid rgba(91,78,60,0.2)', background: '#fbf7ee', color: '#28231c', fontSize: 13, fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>Ranking</button>
      </div>
    </div>
  )
}
