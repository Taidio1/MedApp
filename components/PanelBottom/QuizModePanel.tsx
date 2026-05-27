'use client'

import { useEffect } from 'react'
import { Annotation } from '@/lib/types'
import {
  QuizQuestion,
  QuizScore,
  buildQuizQuestion,
  scoreQuizAnswer,
} from '@/lib/learning'

interface QuizModePanelProps {
  annotations: Annotation[]
  fallbackAnnotations: Annotation[]
  question: QuizQuestion | null
  selectedAnswerId: string | null
  score: QuizScore
  onSetQuestion: (question: QuizQuestion | null) => void
  onSetSelectedAnswer: (annotationId: string | null) => void
  onSetScore: (score: QuizScore) => void
  onSelectAnnotation: (annotation: Annotation) => void
}

export function QuizModePanel({
  annotations,
  fallbackAnnotations,
  question,
  selectedAnswerId,
  score,
  onSetQuestion,
  onSetSelectedAnswer,
  onSetScore,
  onSelectAnnotation,
}: QuizModePanelProps) {
  useEffect(() => {
    if (!question) {
      const next = buildQuizQuestion(annotations, fallbackAnnotations, score.answered)
      onSetQuestion(next)
      if (next) onSelectAnnotation(next.target)
    }
  }, [annotations, fallbackAnnotations, onSelectAnnotation, onSetQuestion, question, score.answered])

  if (annotations.length === 0) {
    return (
      <div className="empty-state min-h-[150px] rounded-md border border-dashed border-[#d1d5db]">
        Quiz potrzebuje widocznych punktów z wybranych warstw.
      </div>
    )
  }

  if (!question) {
    return (
      <div className="empty-state min-h-[150px] rounded-md border border-dashed border-[#d1d5db]">
        Ten zestaw potrzebuje co najmniej dwóch odpowiedzi do quizu.
      </div>
    )
  }

  const answered = selectedAnswerId != null
  const correct = selectedAnswerId === question.target.id

  const handleAnswer = (answerId: string) => {
    if (answered) return
    const isCorrect = answerId === question.target.id
    onSetSelectedAnswer(answerId)
    onSetScore(scoreQuizAnswer(score, isCorrect))
  }

  const handleNext = () => {
    onSetSelectedAnswer(null)
    const next = buildQuizQuestion(annotations, fallbackAnnotations, score.answered)
    onSetQuestion(next)
    if (next) onSelectAnnotation(next.target)
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_170px]">
      <div className="quiz-card p-3">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#9ca3af]">
          Pytanie {score.answered + 1}
        </p>
        <h3 className="mt-1 text-sm font-bold text-[#111827]">{question.prompt}</h3>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {question.options.map((option) => {
            const selected = selectedAnswerId === option.id
            const isTarget = option.id === question.target.id

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleAnswer(option.id)}
                className={[
                  'min-h-8 rounded-md border px-2 text-left text-[11px] font-semibold transition-colors',
                  answered && isTarget
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : selected
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-[#e5e7eb] bg-[#f9fafb] text-[#374151] hover:border-[#c4b5fd]',
                ].join(' ')}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="quiz-card flex flex-col gap-2 p-3">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#9ca3af]">
          Wynik
        </p>
        <p className="text-sm font-bold text-[#111827]">
          {score.correct}/{score.answered}
        </p>
        <p className="text-[11px] text-[#6b7280]">Seria: {score.streak}</p>
        {answered && (
          <p className={correct ? 'text-[11px] text-emerald-700' : 'text-[11px] text-red-700'}>
            {correct ? 'Dobrze.' : `Poprawnie: ${question.target.label}`}
          </p>
        )}
        <button
          type="button"
          onClick={handleNext}
          className="primary-action mt-auto h-8 text-[11px]"
        >
          Następne
        </button>
      </div>
    </div>
  )
}
