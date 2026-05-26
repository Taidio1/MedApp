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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680, margin: '0 auto', width: '100%' }}>
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>
          Pytanie <strong style={{ color: '#28231c' }}>{idx + 1}</strong> z {questions.length}
        </span>
        <span style={{ color: 'rgba(91,78,60,0.25)', fontSize: 14 }}>·</span>
        <span style={{ fontSize: 12, background: diffBg, color: diffColor, padding: '2px 8px', borderRadius: 20, fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>{q.diff}</span>
        <span style={{ fontSize: 12, background: '#f1eadc', color: '#80786d', padding: '2px 8px', borderRadius: 20, fontFamily: 'Inter,sans-serif' }}>{typeLabel}</span>
        <span style={{ fontSize: 12, color: '#80786d', fontFamily: 'Inter,sans-serif', marginLeft: 'auto' }}>{q.struct} · {q.sys}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'rgba(91,78,60,0.1)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'var(--qz-accent)', borderRadius: 4, width: `${(idx / questions.length) * 100}%`, transition: 'width 0.4s ease' }} />
      </div>

      {/* Question card */}
      <div style={{
        background: '#fbf7ee', border: '1px solid rgba(91,78,60,0.14)', borderRadius: 10,
        padding: '24px 26px', boxShadow: '0 8px 26px rgba(78,66,48,0.08)',
        animation: cardAnim,
      }}>
        <p style={{ margin: '0 0 22px', fontSize: 18, fontFamily: '"Libre Baskerville",Georgia,serif', color: '#28231c', lineHeight: 1.55, fontWeight: 400 }}>{q.q}</p>

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

        {!revealed && q.type !== 'mcq' && (
          <button onClick={handleCheck} disabled={!canCheck} style={{
            marginTop: 18, padding: '11px 24px', borderRadius: 8, border: 'none',
            background: canCheck ? 'var(--qz-accent)' : 'rgba(91,78,60,0.12)',
            color: canCheck ? '#fff' : '#80786d', fontSize: 13, fontWeight: 600,
            fontFamily: 'Inter,sans-serif', cursor: canCheck ? 'pointer' : 'default',
            transition: 'all 0.18s',
          }}>Sprawdź odpowiedź</button>
        )}

        {!revealed && !hintUsed && config.mode === 'Nauka' && (
          <button onClick={onHint} style={{
            marginTop: q.type !== 'mcq' ? 10 : 18, padding: '8px 16px', borderRadius: 7,
            border: '1.5px dashed rgba(91,78,60,0.25)', background: 'transparent',
            color: '#80786d', fontSize: 12, fontFamily: 'Inter,sans-serif',
            cursor: 'pointer', display: 'block',
          }}>💡 Pokaż podpowiedź</button>
        )}
        {!revealed && hintUsed && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--qz-accent-soft)', border: '1px solid var(--qz-accent)', borderRadius: 7 }}>
            <span style={{ fontSize: 13, color: '#28231c', fontFamily: 'Inter,sans-serif' }}>💡 {q.hint}</span>
          </div>
        )}

        {revealed && (
          <div style={{ marginTop: 18, padding: '14px 16px', background: '#f1eadc', borderRadius: 8, borderLeft: '3px solid var(--qz-accent)' }}>
            <div style={{ fontSize: 11, color: 'var(--qz-accent)', fontWeight: 600, fontFamily: 'Inter,sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Wyjaśnienie</div>
            <p style={{ margin: 0, fontSize: 13.5, color: '#28231c', fontFamily: '"Libre Baskerville",Georgia,serif', lineHeight: 1.6 }}>{q.exp}</p>
          </div>
        )}
      </div>

      {revealed && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onNext} style={{
            padding: '11px 28px', borderRadius: 8, border: 'none',
            background: 'var(--qz-accent)', color: '#fff', fontSize: 14, fontWeight: 600,
            fontFamily: 'Inter,sans-serif', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          }}>{idx + 1 < questions.length ? 'Następne pytanie →' : 'Zobacz wyniki →'}</button>
        </div>
      )}
    </div>
  )
}
