'use client'

import { QuizQuestion, LETTERS, QZ_OK, QZ_OK_SOFT, QZ_ERR, QZ_ERR_SOFT } from './quizData'

const haptic = (pattern: number | number[]) => {
  try { if (navigator && navigator.vibrate) navigator.vibrate(pattern) } catch { }
}

interface MCQOptionsProps {
  q: QuizQuestion
  selected: number | undefined
  onSelect: (idx: number) => void
  revealed: boolean
}

export function MCQOptions({ q, selected, onSelect, revealed }: MCQOptionsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(q.opts ?? []).map((opt, i) => {
        const isSel = selected === i
        const isCorr = revealed && i === q.correct
        const isWrong = revealed && isSel && i !== q.correct
        let bg = '#fbf7ee', border = 'rgba(91,78,60,0.18)', color = '#28231c', letterBg = '#f1eadc', letterColor = '#80786d'
        if (isSel && !revealed) { bg = 'var(--qz-accent-soft)'; border = 'var(--qz-accent)'; letterBg = 'var(--qz-accent)'; letterColor = '#fff' }
        if (isCorr) { bg = QZ_OK_SOFT; border = QZ_OK; letterBg = QZ_OK; letterColor = '#fff'; color = '#28231c' }
        if (isWrong) { bg = QZ_ERR_SOFT; border = QZ_ERR; letterBg = QZ_ERR; letterColor = '#fff' }
        return (
          <button key={i} onClick={() => { if (revealed) return; haptic(18); onSelect(i) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
              background: bg, border: `1.5px solid ${border}`, borderRadius: 8,
              cursor: revealed ? 'default' : 'pointer', textAlign: 'left',
              transition: 'all 0.18s ease', width: '100%',
            }}>
            <span style={{
              minWidth: 26, height: 26, borderRadius: 6, background: letterBg, color: letterColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, fontFamily: 'Inter,sans-serif', flexShrink: 0,
              transition: 'all 0.18s ease',
            }}>{LETTERS[i]}</span>
            <span style={{ fontSize: 14, color, fontFamily: 'Inter,sans-serif', lineHeight: 1.4 }}>{opt}</span>
            {isCorr && <span style={{ marginLeft: 'auto', color: QZ_OK, fontWeight: 700, fontSize: 16 }}>✓</span>}
            {isWrong && <span style={{ marginLeft: 'auto', color: QZ_ERR, fontWeight: 700, fontSize: 16 }}>✗</span>}
          </button>
        )
      })}
    </div>
  )
}
