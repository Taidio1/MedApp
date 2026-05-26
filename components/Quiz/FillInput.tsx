'use client'

import { QuizQuestion, QZ_OK, QZ_OK_SOFT, QZ_ERR, QZ_ERR_SOFT, normAnswer } from './quizData'

interface FillInputProps {
  q: QuizQuestion
  value: string
  onChange: (v: string) => void
  revealed: boolean
}

export function FillInput({ q, value, onChange, revealed }: FillInputProps) {
  const isCorr = revealed && normAnswer(value) === normAnswer(q.answer ?? '')
  const isWrong = revealed && !isCorr
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ position: 'relative' }}>
        <input
          value={value}
          onChange={e => !revealed && onChange(e.target.value)}
          disabled={revealed}
          placeholder="Wpisz odpowiedź…"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '12px 16px',
            fontSize: 15, fontFamily: 'Inter,sans-serif', color: '#28231c',
            background: revealed ? (isCorr ? QZ_OK_SOFT : QZ_ERR_SOFT) : '#fbf7ee',
            border: `1.5px solid ${revealed ? (isCorr ? QZ_OK : QZ_ERR) : 'rgba(91,78,60,0.22)'}`,
            borderRadius: 8, outline: 'none',
            transition: 'all 0.18s ease',
          }} />
        {revealed && (
          <span style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 18, color: isCorr ? QZ_OK : QZ_ERR, fontWeight: 700,
          }}>{isCorr ? '✓' : '✗'}</span>
        )}
      </div>
      {isWrong && (
        <div style={{ padding: '8px 12px', background: QZ_OK_SOFT, border: `1px solid ${QZ_OK}`, borderRadius: 6 }}>
          <span style={{ fontSize: 13, color: '#28231c', fontFamily: 'Inter,sans-serif' }}>
            Poprawna odpowiedź: <strong style={{ color: QZ_OK }}>{q.answer}</strong>
          </span>
        </div>
      )}
    </div>
  )
}
