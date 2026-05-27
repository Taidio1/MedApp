'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppNavbar } from '@/components/AppNavbar/AppNavbar'
import type { NaukaCard, ReadingMaterial } from '@/lib/naukaData'
import type { UserNaukaStats } from '@/lib/supabase/nauka'
import { NaukaRightPanel } from './NaukaRightPanel'
import { NaukaHome } from './NaukaHome'
import { NaukaSession } from './NaukaSession'
import { NaukaReading } from './NaukaReading'
import { NaukaMobileHome } from './NaukaMobileHome'

interface NaukaPageProps {
  displayName: string | null
  email: string | null
  isAdmin: boolean
}

type NaukaScreen  = 'tablica' | 'sesja' | 'czytaj'
type SessionPhase = 'running' | 'done'

const POMODORO        = 25 * 60
const NOTE_DEBOUNCE   = 1500

const NK = '#2a7a60'

export function NaukaPage({ displayName, email, isAdmin }: NaukaPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [screen, setScreen]             = useState<NaukaScreen>('tablica')
  const [sessionCards, setSessionCards] = useState<NaukaCard[]>([])
  const [cardIdx, setCardIdx]           = useState(0)
  const [flipped, setFlipped]           = useState(false)
  const [results, setResults]           = useState<Record<string, boolean>>({})
  const [phase, setPhase]               = useState<SessionPhase>('running')
  const [timeLeft, setTimeLeft]         = useState<number | null>(null)
  const [isPaused, setIsPaused]         = useState(false)
  const [notes, setNotes]               = useState<Record<string, string>>({})
  const [config, setConfig]             = useState({ sys: 'Układ Krążenia', mode: 'nolimit' as 'nolimit' | 'pomodoro' })
  const [readSysKey, setReadSysKey]     = useState('Układ Krążenia')
  const [readSection, setReadSection]   = useState(0)

  // Remote data
  const [cards, setCards]       = useState<NaukaCard[]>([])
  const [readings, setReadings] = useState<ReadingMaterial[]>([])
  const [progress, setProgress] = useState<Record<string, { done: number; total: number }>>({})
  const [stats, setStats]       = useState<UserNaukaStats | null>(null)
  const [loading, setLoading]   = useState(true)

  // Session tracking
  const sessionStartedAt = useRef<string | null>(null)
  const sessionSaved     = useRef(false)
  const noteTimers       = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const urlSessionStarted = useRef(false)

  useEffect(() => {
    const timers = noteTimers.current
    return () => { Object.values(timers).forEach(clearTimeout) }
  }, [])

  // Initial data load
  useEffect(() => {
    async function load() {
      try {
        const [cardsRes, readingsRes, progressRes, statsRes, notesRes] = await Promise.all([
          fetch('/api/nauka/cards').then(r => r.json()),
          fetch('/api/nauka/readings').then(r => r.json()),
          fetch('/api/nauka/progress').then(r => r.json()),
          fetch('/api/nauka/stats').then(r => r.json()),
          fetch('/api/nauka/notes').then(r => r.json()),
        ])
        if (Array.isArray(cardsRes))   setCards(cardsRes)
        if (Array.isArray(readingsRes)) setReadings(readingsRes)
        if (progressRes && !progressRes.error) setProgress(progressRes)
        if (statsRes    && !statsRes.error)    setStats(statsRes)
        if (notesRes    && !notesRes.error)    setNotes(notesRes)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Pomodoro timer
  useEffect(() => {
    if (screen !== 'sesja' || phase !== 'running' || config.mode !== 'pomodoro' || isPaused || timeLeft === null) return
    if (timeLeft <= 0) { setPhase('done'); return }
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t === null || t <= 1) { clearInterval(iv); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [screen, phase, config.mode, isPaused]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (timeLeft === 0 && phase === 'running') setPhase('done')
  }, [timeLeft]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save session + refresh stats when done
  useEffect(() => {
    if (phase !== 'done' || sessionSaved.current || !sessionStartedAt.current || sessionCards.length === 0) return
    sessionSaved.current = true

    const knownCount = Object.values(results).filter(Boolean).length
    fetch('/api/nauka/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode:       config.mode,
        system:     config.sys,
        cardsTotal: sessionCards.length,
        cardsKnown: knownCount,
        startedAt:  sessionStartedAt.current,
        results,
      }),
    }).then(() =>
      Promise.all([
        fetch('/api/nauka/progress').then(r => r.json()),
        fetch('/api/nauka/stats').then(r => r.json()),
      ]).then(([progressRes, statsRes]) => {
        if (progressRes && !progressRes.error) setProgress(progressRes)
        if (statsRes    && !statsRes.error)    setStats(statsRes)
      }),
    )
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const startSession = useCallback((overrides?: Partial<typeof config>) => {
    const sessionConfig = { ...config, ...overrides }
    const pool     = sessionConfig.sys === 'Wszystkie układy' ? cards : cards.filter(c => c.system === sessionConfig.sys)
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    if (overrides) setConfig(sessionConfig)
    setSessionCards(shuffled)
    setCardIdx(0)
    setFlipped(false)
    setResults({})
    setPhase('running')
    setTimeLeft(sessionConfig.mode === 'pomodoro' ? POMODORO : null)
    setIsPaused(false)
    setScreen('sesja')
    sessionStartedAt.current = new Date().toISOString()
    sessionSaved.current     = false
  }, [config, cards])

  useEffect(() => {
    const startParam = searchParams.get('start')
    const shouldStartSession = startParam === 'session'
    if (!shouldStartSession || urlSessionStarted.current || loading || cards.length === 0) return

    urlSessionStarted.current = true
    const systemParam = searchParams.get('system')
    const nextSys = systemParam && (systemParam === 'Wszystkie układy' || cards.some(card => card.system === systemParam))
      ? systemParam
      : config.sys
    startSession({ sys: nextSys })
  }, [cards, config.sys, loading, searchParams, startSession])

  const handleAnswer = (knew: boolean) => {
    const card = sessionCards[cardIdx]
    if (!card) return
    const newResults = { ...results, [card.id]: knew }
    setResults(newResults)
    if (cardIdx + 1 >= sessionCards.length) {
      setPhase('done')
    } else {
      setCardIdx(idx => idx + 1)
      setFlipped(false)
    }
  }

  const handleSysSelect = (sys: string) => {
    setConfig(prev => ({ ...prev, sys }))
    if (sys !== 'Wszystkie układy') setReadSysKey(sys)
  }

  const handleRead = () => {
    const readSys = config.sys
    setReadSysKey(readSys === 'Wszystkie układy' ? 'Układ Krążenia' : readSys)
    setReadSection(0)
    router.push(`/nauka/materialy${readSys !== 'Wszystkie układy' ? `?system=${encodeURIComponent(readSys)}` : ''}`)
  }

  const handleNoteChange = (cardId: string, text: string) => {
    setNotes(prev => ({ ...prev, [cardId]: text }))
    if (noteTimers.current[cardId]) clearTimeout(noteTimers.current[cardId])
    noteTimers.current[cardId] = setTimeout(() => {
      fetch('/api/nauka/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, content: text }),
      })
    }, NOTE_DEBOUNCE)
  }

  const readingMaterial = readings.find(m => m.sys === readSysKey) ?? null
  const currentCard     = screen === 'sesja' && phase === 'running' ? (sessionCards[cardIdx] ?? null) : null

  const shellStyle: CSSProperties = {
    '--qz-accent':      NK,
    '--qz-accent-soft': '#d2ede6',
  } as CSSProperties

  if (loading) {
    return (
      <div className="quiz-shell" style={shellStyle}>
        <header className="quiz-header">
          <div className="quiz-brand">
            <div className="quiz-brand-orb" style={{ borderColor: 'rgba(42,122,96,0.3)' }}>✦</div>
            <div className="quiz-brand-text">
              <h1>MedApp Anatomy Studio</h1>
              <p>Interaktywny atlas anatomii 3D</p>
            </div>
          </div>
        </header>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <span style={{ fontSize: 14, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>Ładowanie…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-shell app-shell-with-navbar" style={shellStyle}>
      <AppNavbar active="nauka" displayName={displayName} email={email} isAdmin={isAdmin} />

      {screen === 'tablica' ? (
        <NaukaMobileHome
          configSys={config.sys}
          configMode={config.mode}
          progress={progress}
          stats={stats}
          cards={cards}
          notes={notes}
          onConfigSysChange={sys => setConfig(prev => ({ ...prev, sys }))}
          onConfigModeChange={mode => setConfig(prev => ({ ...prev, mode }))}
          onStart={() => startSession()}
          onRead={handleRead}
        />
      ) : (
        <div className="nauka-mobile-page nauka-mobile-workspace">
          <main className="nauka-mobile-main">
            <button
              type="button"
              className="reading-materials-back nauka-mobile-back"
              onClick={() => { setScreen('tablica'); setPhase('running') }}
            >
              ← Nauka
            </button>
            {screen === 'sesja' && (
              <NaukaSession
                cards={sessionCards}
                cardIdx={cardIdx}
                flipped={flipped}
                results={results}
                phase={phase}
                timeLeft={timeLeft}
                isPaused={isPaused}
                configMode={config.mode}
                onFlip={() => setFlipped(true)}
                onAnswer={handleAnswer}
                onPauseToggle={() => setIsPaused(p => !p)}
                onBackToBoard={() => { setScreen('tablica'); setPhase('running') }}
                onRepeat={() => startSession()}
              />
            )}
          </main>
        </div>
      )}

      {/* Header */}
      <header className="quiz-header nauka-legacy-header">
        <div className="quiz-brand">
          <div className="quiz-brand-orb" style={{ borderColor: 'rgba(42,122,96,0.3)' }}>✦</div>
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
          <span className="quiz-nav-item active">
            <span className="quiz-nav-icon">☰</span>
            Nauka
          </span>
          <Link href="/quiz" className="quiz-nav-item">
            <span className="quiz-nav-icon">◎</span>
            Quiz
          </Link>
          <div className="quiz-nav-sep" />
          <span className="quiz-nav-user">{displayName ?? 'Gość'}</span>
          {isAdmin && (
            <Link href="/admin/annotations" className="quiz-nav-badge quiz-nav-badge--admin">Admin</Link>
          )}
        </nav>
      </header>

      {/* 2-column body (v2 design: main + right panel) */}
      <div className="nauka-v2-body nauka-desktop-only">
        <main className="nauka-v2-main">
          {screen === 'tablica' && (
            <NaukaHome
              configSys={config.sys}
              configMode={config.mode}
              progress={progress}
              stats={stats}
              cards={cards}
              onConfigSysChange={sys => setConfig(prev => ({ ...prev, sys }))}
              onConfigModeChange={mode => setConfig(prev => ({ ...prev, mode }))}
              onStart={() => startSession()}
              onRead={handleRead}
            />
          )}
          {screen === 'sesja' && (
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <button
                type="button"
                onClick={() => { setScreen('tablica'); setPhase('running') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: 20, background: 'none', border: 'none',
                  color: '#686864', fontSize: 13, cursor: 'pointer',
                  fontFamily: "'Manrope', sans-serif", fontWeight: 600,
                }}
              >
                ← Wróć do tablicy
              </button>
              <NaukaSession
                cards={sessionCards}
                cardIdx={cardIdx}
                flipped={flipped}
                results={results}
                phase={phase}
                timeLeft={timeLeft}
                isPaused={isPaused}
                configMode={config.mode}
                onFlip={() => setFlipped(true)}
                onAnswer={handleAnswer}
                onPauseToggle={() => setIsPaused(p => !p)}
                onBackToBoard={() => { setScreen('tablica'); setPhase('running') }}
                onRepeat={() => startSession()}
              />
            </div>
          )}
          {screen === 'czytaj' && (
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <button
                type="button"
                onClick={() => setScreen('tablica')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: 20, background: 'none', border: 'none',
                  color: '#686864', fontSize: 13, cursor: 'pointer',
                  fontFamily: "'Manrope', sans-serif", fontWeight: 600,
                }}
              >
                ← Wróć do tablicy
              </button>
              <NaukaReading
                material={readingMaterial}
                sectionIdx={readSection}
                onSectionChange={setReadSection}
              />
            </div>
          )}
        </main>

        <aside className="nauka-v2-right">
          <NaukaRightPanel
            screen={screen}
            phase={phase}
            currentCard={currentCard}
            notes={notes}
            stats={stats}
            onNoteChange={handleNoteChange}
            onStart={() => startSession()}
            onRead={handleRead}
          />
        </aside>
      </div>
    </div>
  )
}
