'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppNavbar } from '@/components/AppNavbar/AppNavbar'
import type { DbLeaderboardEntry } from '@/lib/supabase/quiz'
import {
  type QuizQuestion,
  type QuizConfig,
  type Screen,
  type QuizHistoryEntry,
  type QuizLBEntry,
  isAnswerCorrect,
} from './quizData'
import { QuizHome } from './QuizHome'
import { QuizQuestionView } from './QuizQuestionView'
import { QuizResults } from './QuizResults'
import { QuizHistory } from './QuizHistory'
import { QuizLeaderboard } from './QuizLeaderboard'
import { QuizLeftPanel } from './QuizLeftPanel'
import { QuizRightPanel } from './QuizRightPanel'
import { ExplorerNavBanner } from './ExplorerNavBanner'

interface QuizPageProps {
  displayName: string | null
  isAdmin: boolean
  userId: string
}

const haptic = (pattern: number | number[]) => {
  try { if (navigator && navigator.vibrate) navigator.vibrate(pattern) } catch { }
}

interface ExplorerContext {
  struct: string
  sys: string
}

export function QuizPage({ displayName, isAdmin, userId }: QuizPageProps) {
  const [screen, setScreen] = useState<Screen>('home')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState<(number | string | null)[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [curStreak, setCurStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const [fromExplorer, setFromExplorer] = useState<ExplorerContext | null>(null)
  const [historyEntries, setHistoryEntries] = useState<QuizHistoryEntry[]>([])
  const [lbEntries, setLbEntries] = useState<QuizLBEntry[]>([])
  const [config, setConfig] = useState<QuizConfig>({
    system: 'Wszystkie układy',
    diff: 'Wszystkie poziomy',
    mode: 'Nauka',
    count: 5,
  })

  useEffect(() => {
    fetch('/api/quiz/questions')
      .then(r => r.json())
      .then((data: QuizQuestion[]) => setQuestions(data))
      .catch(() => {})
      .finally(() => setLoadingQuestions(false))
  }, [])

  useEffect(() => {
    if (screen !== 'quiz') return
    const iv = setInterval(() => {
      setTimeElapsed(t => {
        if (config.mode === 'Egzamin' && t >= 119) {
          clearInterval(iv)
          setScreen('results')
        }
        return t + 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [screen, config.mode])

  // Complete session when results screen is shown
  useEffect(() => {
    if (screen !== 'results' || !sessionId) return
    const correctCount = answers.filter((a, i) => isAnswerCorrect(questions[i], a)).length
    fetch('/api/quiz/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, correctCount, maxStreak, timeElapsedSeconds: timeElapsed }),
    }).catch(() => {})
  }, [screen, sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (screen !== 'history') return
    fetch('/api/quiz/history')
      .then(r => r.json())
      .then((data: QuizHistoryEntry[]) => setHistoryEntries(data))
      .catch(() => {})
  }, [screen])

  useEffect(() => {
    if (screen !== 'leaderboard') return
    fetch('/api/quiz/leaderboard')
      .then(r => r.json())
      .then((data: DbLeaderboardEntry[]) => {
        setLbEntries(data.map((e, idx) => ({
          rank: idx + 1,
          name: e.display_name,
          pts: e.total_points,
          streak: e.best_streak,
          isMe: e.user_id === userId,
        })))
      })
      .catch(() => {})
  }, [screen, userId])

  const startQuiz = async () => {
    haptic([20, 10, 20])
    setScreen('quiz')
    setQIdx(0)
    setAnswers(new Array(questions.length).fill(null))
    setCurStreak(0)
    setMaxStreak(0)
    setTimeElapsed(0)
    setHintUsed(false)
    try {
      const res = await fetch('/api/quiz/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: config.mode,
          systemFilter: config.system,
          difficultyFilter: config.diff,
          totalQuestions: questions.length,
        }),
      })
      if (res.ok) {
        const data = await res.json() as { sessionId: string }
        setSessionId(data.sessionId)
      }
    } catch {}
  }

  const handleQuickLaunch = ({ struct, sys }: { struct: string; sys: string; icon: string; color: string }) => {
    setFromExplorer({ struct, sys })
    setConfig(prev => ({ ...prev, system: sys }))
    setScreen('home')
    haptic([15, 10, 30])
  }

  const handleAnswer = (idx: number, val: number | string) => {
    const q = questions[idx]
    const ok = isAnswerCorrect(q, val)
    const newAnswers = [...answers]
    newAnswers[idx] = val
    setAnswers(newAnswers)
    const ns = ok ? curStreak + 1 : 0
    setCurStreak(ns)
    if (ns > maxStreak) setMaxStreak(ns)
    haptic(ok ? [40, 25, 60] : [80, 35, 80, 35, 80])

    if (sessionId) {
      const userAnswer = typeof val === 'number' ? String(val) : val
      fetch('/api/quiz/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId: q.id, userAnswer, isCorrect: ok }),
      }).catch(() => {})
    }
  }

  const handleNext = () => {
    if (qIdx + 1 >= questions.length) {
      setScreen('results')
    } else {
      setQIdx(qIdx + 1)
      setHintUsed(false)
    }
  }

  const fmtTime = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0')
    const s = String(secs % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  if (loadingQuestions) {
    return (
      <div className="quiz-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Inter,sans-serif', color: '#80786d', fontSize: 14 }}>Ładowanie pytań…</p>
      </div>
    )
  }

  return (
    <div className="quiz-shell app-shell-with-navbar">
      <AppNavbar active="quiz" displayName={displayName} isAdmin={isAdmin} />

      {/* Header */}
      <header className="quiz-header quiz-legacy-header">
        <div className="quiz-brand">
          <div className="quiz-brand-orb">✦</div>
          <div className="quiz-brand-text">
            <h1>MedApp Anatomy Studio</h1>
            <p>Interaktywny atlas anatomii 3D</p>
          </div>
        </div>

        <nav className="quiz-nav" aria-label="Główna nawigacja">
          <Link href="/" className="quiz-nav-item">
            <span className="quiz-nav-icon">▦</span>
            Explorer
          </Link>
          <Link href="/#learning" className="quiz-nav-item">
            <span className="quiz-nav-icon">☰</span>
            Nauka
          </Link>
          <span className="quiz-nav-item active">
            <span className="quiz-nav-icon">◎</span>
            Quiz
          </span>
          <div className="quiz-nav-sep" />
          <span className="quiz-nav-user">{displayName ?? 'Gość'}</span>
          {isAdmin && (
            <Link href="/admin/annotations" className="quiz-nav-badge quiz-nav-badge--admin">Admin</Link>
          )}
        </nav>
      </header>

      {/* 3-column body */}
      <div className="quiz-body">
        {/* Left panel */}
        <aside className="quiz-panel-left">
          <QuizLeftPanel
            screen={screen}
            config={config}
            onConfigChange={c => setConfig(prev => ({ ...prev, ...c }))}
            onScreenChange={setScreen}
            onQuickLaunch={handleQuickLaunch}
          />
        </aside>

        {/* Center */}
        <main className="quiz-center">
          {fromExplorer && (screen === 'home' || screen === 'quiz') && (
            <ExplorerNavBanner
              structure={fromExplorer.struct}
              system={fromExplorer.sys}
              onDismiss={() => setFromExplorer(null)}
            />
          )}

          <div className="quiz-center-inner">
            {screen === 'home' && (
              <QuizHome
                config={config}
                onConfigChange={c => setConfig(prev => ({ ...prev, ...c }))}
                onStart={startQuiz}
                onHistory={() => setScreen('history')}
                onLeaderboard={() => setScreen('leaderboard')}
              />
            )}
            {screen === 'quiz' && (
              <div key={`q-${qIdx}`} style={{ animation: 'qz-slide-in 0.32s cubic-bezier(0.16,1,0.3,1) both' }}>
                <QuizQuestionView
                  questions={questions}
                  idx={qIdx}
                  answers={answers}
                  onAnswer={handleAnswer}
                  onNext={handleNext}
                  hintUsed={hintUsed}
                  onHint={() => setHintUsed(true)}
                  config={config}
                />
              </div>
            )}
            {screen === 'results' && (
              <QuizResults
                questions={questions}
                answers={answers}
                timeStr={fmtTime(timeElapsed)}
                streak={maxStreak}
                onRestart={startQuiz}
                onHome={() => setScreen('home')}
                onHistory={() => setScreen('history')}
                onLeaderboard={() => setScreen('leaderboard')}
              />
            )}
            {screen === 'history' && (
              <QuizHistory onBack={() => setScreen('home')} entries={historyEntries} />
            )}
            {screen === 'leaderboard' && (
              <QuizLeaderboard onBack={() => setScreen('home')} entries={lbEntries} />
            )}
          </div>
        </main>

        {/* Right panel */}
        <aside className="quiz-panel-right">
          <QuizRightPanel
            screen={screen}
            questions={questions}
            idx={qIdx}
            answers={answers}
            timeElapsed={timeElapsed}
            streak={curStreak}
            hintUsed={hintUsed}
            onHint={() => setHintUsed(true)}
            config={config}
          />
        </aside>
      </div>
    </div>
  )
}
