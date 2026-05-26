'use client'

import { QuizQuestion, QuizConfig, QZ_OK, QZ_ERR, isAnswerCorrect } from './quizData'
import { PanelHeader } from './PanelHeader'
import type { Screen } from './quizData'

interface QuizRightPanelProps {
  screen: Screen
  questions: QuizQuestion[]
  idx: number
  answers: (number | string | null)[]
  timeElapsed: number | null
  streak: number
  hintUsed: boolean
  onHint: () => void
  config: QuizConfig
}

const typeLabels: Record<string, string> = { mcq: 'Wielokrotny wybór', fill: 'Uzupełnij lukę', image: 'Identyfikacja' }

export function QuizRightPanel({ screen, questions, idx, answers, timeElapsed, streak, hintUsed, onHint, config }: QuizRightPanelProps) {
  const score = answers.filter((a, i) => i < questions.length && isAnswerCorrect(questions[i], a)).length
  const isExam = config.mode === 'Egzamin'
  const timeLimit = 120
  const elapsed = timeElapsed ?? 0
  const displayTime = isExam ? Math.max(0, timeLimit - elapsed) : elapsed
  const mm = String(Math.floor(displayTime / 60)).padStart(2, '0')
  const ss = String(displayTime % 60).padStart(2, '0')
  const timerColor = isExam && displayTime < 30 ? QZ_ERR : '#28231c'

  const q = questions[idx] ?? questions[0]
  const inQuiz = screen === 'quiz'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', overflowY: 'auto' }}>
      {inQuiz && (
        <div style={{ background: '#fbf7ee', border: '1px solid rgba(91,78,60,0.14)', borderRadius: 10, padding: '16px 18px', boxShadow: '0 4px 14px rgba(78,66,48,0.06)' }}>
          <PanelHeader icon="⏱" title="Sesja quizu" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {timeElapsed !== null && (
              <div style={{ background: '#f1eadc', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: timerColor, fontFamily: 'Inter,sans-serif', fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</div>
                <div style={{ fontSize: 10, color: '#80786d', fontFamily: 'Inter,sans-serif', marginTop: 2 }}>{isExam ? 'pozostało' : 'czas sesji'}</div>
              </div>
            )}
            <div style={{ background: 'var(--qz-accent-soft)', borderRadius: 8, padding: '10px 12px', textAlign: 'center', gridColumn: timeElapsed === null ? '1 / -1' : undefined }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--qz-accent)', fontFamily: 'Inter,sans-serif' }}>{score}/{answers.filter(a => a !== null).length}</div>
              <div style={{ fontSize: 10, color: '#80786d', fontFamily: 'Inter,sans-serif', marginTop: 2 }}>wynik</div>
            </div>
          </div>
          <div style={{ marginTop: 10, padding: '8px 12px', background: streak >= 2 ? '#fff4e0' : '#f1eadc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>🔥 Seria poprawnych</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: streak >= 2 ? '#c8620a' : '#80786d', fontFamily: 'Inter,sans-serif' }}>{streak}</span>
          </div>
        </div>
      )}

      {inQuiz && (
        <div style={{ background: '#fbf7ee', border: '1px solid rgba(91,78,60,0.14)', borderRadius: 10, padding: '16px 18px', boxShadow: '0 4px 14px rgba(78,66,48,0.06)' }}>
          <PanelHeader icon="◎" title="Postęp" />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {questions.map((_, i) => {
              const a = answers[i]
              let bg = 'rgba(91,78,60,0.12)'
              if (i === idx) bg = 'var(--qz-accent)'
              else if (a !== null && a !== undefined) {
                bg = isAnswerCorrect(questions[i], a) ? QZ_OK : QZ_ERR
              }
              return (
                <div key={i} style={{ width: 28, height: 28, borderRadius: 7, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: (i === idx || (a !== null && a !== undefined)) ? '#fff' : '#80786d', fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>{i + 1}</div>
              )
            })}
          </div>
        </div>
      )}

      {inQuiz && config.mode === 'Nauka' && (
        <div style={{ background: '#fbf7ee', border: '1px solid rgba(91,78,60,0.14)', borderRadius: 10, padding: '16px 18px', boxShadow: '0 4px 14px rgba(78,66,48,0.06)' }}>
          <PanelHeader icon="💡" title="Podpowiedź" />
          {!hintUsed
            ? <button onClick={onHint} style={{ width: '100%', padding: '9px', borderRadius: 7, border: '1.5px dashed rgba(91,78,60,0.28)', background: 'transparent', color: '#80786d', fontSize: 12, fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>Użyj podpowiedzi</button>
            : <p style={{ margin: 0, fontSize: 13, color: '#28231c', fontFamily: '"Libre Baskerville",Georgia,serif', lineHeight: 1.6 }}>{q.hint}</p>
          }
        </div>
      )}

      {inQuiz && (
        <div style={{ background: '#fbf7ee', border: '1px solid rgba(91,78,60,0.14)', borderRadius: 10, padding: '16px 18px', boxShadow: '0 4px 14px rgba(78,66,48,0.06)' }}>
          <PanelHeader icon="◆" title="Struktura" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--qz-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🫀</div>
            <div>
              <div style={{ fontSize: 15, fontFamily: '"Libre Baskerville",Georgia,serif', color: '#28231c' }}>{q.struct}</div>
              <div style={{ fontSize: 11, color: '#80786d', fontFamily: 'Inter,sans-serif', fontStyle: 'italic' }}>{q.sys}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#80786d', fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pytanie</span><span style={{ color: '#28231c' }}>{idx + 1} / {questions.length}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Trudność</span><span style={{ color: '#28231c' }}>{q.diff}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Typ</span><span style={{ color: '#28231c' }}>{typeLabels[q.type]}</span></div>
          </div>
        </div>
      )}

      {!inQuiz && (
        <div style={{ background: '#fbf7ee', border: '1px solid rgba(91,78,60,0.14)', borderRadius: 10, padding: '20px 18px', boxShadow: '0 4px 14px rgba(78,66,48,0.06)' }}>
          <PanelHeader icon="◆" title="Statystyki" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([['Łączny wynik', '1340 pkt'], ['Najlepsza seria', '14 pytań'], ['Ukończone quizy', '12'], ['Czas nauki', '2h 34min']] as [string, string][]).map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(91,78,60,0.1)' }}>
                <span style={{ fontSize: 12, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>{l}</span>
                <span style={{ fontSize: 13, color: '#28231c', fontFamily: 'Inter,sans-serif', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
