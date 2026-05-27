'use client'

import { useState, useEffect } from 'react'
import { QuizQuestion, QuizConfig, QZ_OK, QZ_OK_SOFT, QZ_ERR, QZ_ERR_SOFT, isAnswerCorrect } from './quizData'
import { MCQOptions } from './MCQOptions'
import { FillInput } from './FillInput'
import { HeartDiagram } from './HeartDiagram'

interface QuizQuestionViewProps {
  questions: QuizQuestion[]
  idx: number
  answers: (number | string | null)[]
  onAnswer: (idx: number, val: number | string) => void
  onNext: () => void
  hintUsed: boolean
  onHint: () => void
  config: QuizConfig
}

export function QuizQuestionView({ questions, idx, answers, onAnswer, onNext, hintUsed, onHint, config }: QuizQuestionViewProps) {
  const [fillVal, setFillVal] = useState('')
  const [imgSel, setImgSel] = useState<string | null>(null)
  const q = questions[idx]
  const ans = answers[idx]
  const revealed = ans !== undefined && ans !== null

  const [feedbackAnim, setFeedbackAnim] = useState('')
  useEffect(() => {
    if (ans === undefined || ans === null) { setFeedbackAnim(''); return }
    const ok = isAnswerCorrect(q, ans)
    setFeedbackAnim(ok ? 'correct' : 'wrong')
    const t = setTimeout(() => setFeedbackAnim(''), 800)
    return () => clearTimeout(t)
  }, [ans, q])

  useEffect(() => {
    setFillVal('')
    setImgSel(null)
  }, [idx])

  const diffColor = { łatwy: QZ_OK, średni: 'var(--qz-accent)', trudny: QZ_ERR }[q.diff] ?? '#80786d'
  const diffBg = { łatwy: QZ_OK_SOFT, średni: 'var(--qz-accent-soft)', trudny: QZ_ERR_SOFT }[q.diff] ?? '#f1eadc'
  const typeLabel = { mcq: 'Wielokrotny wybór', fill: 'Uzupełnij lukę', image: 'Identyfikacja na schemacie' }[q.type]

  const handleCheck = () => {
    if (q.type === 'fill') onAnswer(idx, fillVal)
    if (q.type === 'image' && imgSel) onAnswer(idx, imgSel)
  }

  const canCheck = q.type === 'fill' ? fillVal.trim().length > 0 : q.type === 'image' ? imgSel !== null : false

  const cardAnim = feedbackAnim === 'correct' ? 'qz-flash-correct 0.75s ease'
    : feedbackAnim === 'wrong' ? 'qz-shake-card 0.5s ease'
    : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 840, margin: '0 auto', width: '100%' }}>
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>
          Pytanie <strong style={{ color: '#28231c' }}>{idx + 1}</strong> z {questions.length}
        </span>
        <span style={{ color: 'rgba(91,78,60,0.25)', fontSize: 14 }}>·</span>
        <span style={{ fontSize: 12, background: diffBg, color: diffColor, padding: '2px 10px', borderRadius: 20, fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>{q.diff}</span>
        <span style={{ fontSize: 12, background: '#f1eadc', color: '#80786d', padding: '2px 10px', borderRadius: 20, fontFamily: 'Inter,sans-serif' }}>{typeLabel}</span>
        <span style={{ fontSize: 13, color: '#80786d', fontFamily: 'Inter,sans-serif', marginLeft: 'auto', fontWeight: 500 }}>{q.struct} · {q.sys}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: 'rgba(91,78,60,0.1)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'var(--qz-accent)', borderRadius: 4, width: `${(idx / questions.length) * 100}%`, transition: 'width 0.4s ease' }} />
      </div>

      {/* Question container */}
      <div style={{
        padding: '12px 0',
        animation: cardAnim,
      }}>
        <p style={{ margin: '0 0 28px', fontSize: 21, fontFamily: '"Libre Baskerville",Georgia,serif', color: '#28231c', lineHeight: 1.5, fontWeight: 400 }}>{q.q}</p>

        <div style={{ background: '#fdfaf2', border: '1.5px solid rgba(91,78,60,0.1)', borderRadius: 12, padding: '24px' }}>
          {q.type === 'mcq' && (
            <MCQOptions q={q} selected={typeof ans === 'number' ? ans : undefined} onSelect={v => onAnswer(idx, v)} revealed={revealed} />
          )}
          {q.type === 'fill' && (
            <FillInput q={q} value={fillVal} onChange={setFillVal} revealed={revealed} />
          )}
          {q.type === 'image' && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <HeartDiagram selected={imgSel} onSelect={setImgSel} target={q.target ?? ''} revealed={revealed} />
            </div>
          )}
        </div>

        {!revealed && q.type !== 'mcq' && (
          <button onClick={handleCheck} disabled={!canCheck} style={{
            marginTop: 24, padding: '12px 32px', borderRadius: 9, border: 'none',
            background: canCheck ? 'var(--qz-accent)' : 'rgba(91,78,60,0.12)',
            color: canCheck ? '#fff' : '#80786d', fontSize: 14, fontWeight: 600,
            fontFamily: 'Inter,sans-serif', cursor: canCheck ? 'pointer' : 'default',
            transition: 'all 0.18s',
            boxShadow: canCheck ? '0 4px 14px rgba(124,107,196,0.2)' : 'none'
          }}>Sprawdź odpowiedź</button>
        )}

        {!revealed && !hintUsed && config.mode === 'Nauka' && (
          <button onClick={onHint} style={{
            marginTop: q.type !== 'mcq' ? 14 : 24, padding: '10px 20px', borderRadius: 8,
            border: '1.5px dashed rgba(91,78,60,0.2)', background: 'transparent',
            color: '#80786d', fontSize: 13, fontFamily: 'Inter,sans-serif',
            cursor: 'pointer', display: 'block',
          }}>💡 Pokaż podpowiedź</button>
        )}
        {!revealed && hintUsed && (
          <div style={{ marginTop: 20, padding: '14px 18px', background: 'var(--qz-accent-soft)', border: '1px solid rgba(124,107,196,0.2)', borderRadius: 10 }}>
            <span style={{ fontSize: 14, color: '#28231c', fontFamily: 'Inter,sans-serif', lineHeight: 1.5 }}>💡 {q.hint}</span>
          </div>
        )}

        {revealed && (
          <div style={{ marginTop: 24, padding: '20px 24px', background: 'var(--paper-deep)', borderRadius: 12, borderLeft: '4px solid var(--qz-accent)' }}>
            <div style={{ fontSize: 11, color: 'var(--qz-accent)', fontWeight: 700, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Wyjaśnienie</div>
            <p style={{ margin: 0, fontSize: 15, color: '#2c251d', fontFamily: '"Libre Baskerville",Georgia,serif', lineHeight: 1.6 }}>{q.exp}</p>
          </div>
        )}
      </div>

      {revealed && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onNext} style={{
            padding: '13px 36px', borderRadius: 10, border: 'none',
            background: 'var(--qz-accent)', color: '#fff', fontSize: 15, fontWeight: 600,
            fontFamily: 'Inter,sans-serif', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(124,107,196,0.25)',
          }}>{idx + 1 < questions.length ? 'Następne pytanie →' : 'Zobacz wyniki →'}</button>
        </div>
      )}
    </div>
  )
}
