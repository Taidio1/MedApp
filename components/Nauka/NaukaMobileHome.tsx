'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Activity,
  Bell,
  Bone,
  BookOpen,
  Box,
  Brain,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleQuestionMark,
  Copy,
  Dumbbell,
  Flame,
  GraduationCap,
  Heart,
  House,
  Infinity,
  NotebookTabs,
  Play,
  Timer,
  TrendingUp,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NAUKA_SYSTEMS } from '@/lib/naukaData'
import type { NaukaCard } from '@/lib/naukaData'
import type { UserNaukaStats } from '@/lib/supabase/nauka'

interface NaukaMobileHomeProps {
  configSys: string
  configMode: 'nolimit' | 'pomodoro'
  progress: Record<string, { done: number; total: number }>
  stats: UserNaukaStats | null
  cards: NaukaCard[]
  notes: Record<string, string>
  onConfigSysChange: (sys: string) => void
  onConfigModeChange: (mode: 'nolimit' | 'pomodoro') => void
  onStart: () => void
  onRead: () => void
}

const NK = '#2a7a60'

const systemIcons: Record<string, LucideIcon> = {
  'Układ Krążenia': Heart,
  'Układ Oddechowy': Activity,
  'Układ Pokarmowy': Activity,
  OUN: Brain,
  'Układ Moczowy': Activity,
}

function formatMinutes(minutes?: number) {
  if (minutes === undefined) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function getSystemIcon(system: string) {
  if (system.includes('Mięś')) return Dumbbell
  if (system.includes('kost')) return Bone
  return systemIcons[system] ?? Activity
}

/* ── Pull-to-reveal constants ─────────────────────────────── */
const PULL_THRESHOLD = 100   // px needed to fully reveal
const PULL_MAX = 140         // max pull distance (with resistance)
const REVEAL_DURATION = 2800 // ms to keep visible after release

export function NaukaMobileHome({
  configSys,
  configMode,
  progress,
  stats,
  cards,
  notes,
  onConfigSysChange,
  onConfigModeChange,
  onStart,
  onRead,
}: NaukaMobileHomeProps) {
  const totalDone = Object.values(progress).reduce((sum, item) => sum + item.done, 0)
  const totalCards = Object.values(progress).reduce((sum, item) => sum + item.total, 0)
  const learned = stats?.knownCards ?? totalDone
  const isActiveAll = configSys === 'Wszystkie układy'
  const activeProgress = isActiveAll
    ? { done: totalDone, total: totalCards }
    : progress[configSys] || { done: 0, total: 0 }

  const systemCards = isActiveAll ? cards : cards.filter((c) => c.system === configSys)
  const [browseIdx, setBrowseIdx] = useState(0)
  const [cardFlipped, setCardFlipped] = useState(false)

  // Reset when system changes
  useEffect(() => {
    setBrowseIdx(0)
    setCardFlipped(false)
  }, [configSys])

  const activeCard = systemCards[browseIdx] ?? cards[0]
  const activeDone = activeProgress.done
  const activeTotal = activeProgress.total || systemCards.length
  const correctPct = totalCards > 0 ? Math.round((learned / totalCards) * 100) : 0
  const noteCount = Object.values(notes).filter((note) => note.trim().length > 0).length

  const handlePrev = useCallback(() => {
    setCardFlipped(false)
    setTimeout(() => setBrowseIdx(i => (i - 1 + Math.max(systemCards.length, 1)) % Math.max(systemCards.length, 1)), 60)
  }, [systemCards.length])

  const handleNext = useCallback(() => {
    setCardFlipped(false)
    setTimeout(() => setBrowseIdx(i => (i + 1) % Math.max(systemCards.length, 1)), 60)
  }, [systemCards.length])

  /* ── Pull-to-reveal state ───────────────────────────────── */
  const [pullDistance, setPullDistance] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [settling, setSettling] = useState(false)
  const touchStartY = useRef(0)
  const isPulling = useRef(false)
  const mainRef = useRef<HTMLElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0 || revealed) return
    touchStartY.current = e.touches[0].clientY
    isPulling.current = true
  }, [revealed])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return
    const dy = e.touches[0].clientY - touchStartY.current
    if (dy < 0) { isPulling.current = false; setPullDistance(0); return }
    // Apply resistance curve for natural feel
    const resisted = Math.min(dy * 0.55, PULL_MAX)
    setPullDistance(resisted)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current && pullDistance === 0) return
    isPulling.current = false
    if (pullDistance >= PULL_THRESHOLD) {
      // Fully reveal the easter egg
      setRevealed(true)
      setSettling(true)
      setPullDistance(0)
      // Auto-hide after a short time
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => {
        setSettling(false)
        setRevealed(false)
      }, REVEAL_DURATION)
    } else {
      // Snap back
      setSettling(true)
      setPullDistance(0)
      setTimeout(() => setSettling(false), 320)
    }
  }, [pullDistance])

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1)
  const showTitle = revealed || pullDistance > 0

  return (
    <div className="nauka-mobile-page">
      <header className="nauka-mobile-header">
        <div className="nauka-mobile-brand">
          <span className="nauka-mobile-logo" aria-hidden="true">♡</span>
          <div>
            <strong>MedApp</strong>
          </div>
        </div>
        <button className="nauka-mobile-icon-button" aria-label="Powiadomienia">
          <Bell size={22} strokeWidth={1.9} />
          <span aria-hidden="true" />
        </button>
      </header>

      <nav className="nauka-mobile-nav" aria-label="Główna nawigacja">
        <Link href="/" className="nauka-mobile-nav-item">
          <House size={28} strokeWidth={1.75} />
          <span>Atlas</span>
        </Link>
        <Link href="/" className="nauka-mobile-nav-item">
          <Box size={28} strokeWidth={1.75} />
          <span>Explorer 3D</span>
        </Link>
        <Link href="/quiz" className="nauka-mobile-nav-item">
          <CircleQuestionMark size={28} strokeWidth={1.75} />
          <span>Quiz</span>
        </Link>
        <span className="nauka-mobile-nav-item is-active">
          <GraduationCap size={30} strokeWidth={1.8} />
          <span>Nauka</span>
        </span>
        <Link href="/profil" className="nauka-mobile-nav-item">
          <UserRound size={28} strokeWidth={1.75} />
          <span>Profil</span>
        </Link>
      </nav>

      <main
        className="nauka-mobile-main"
        ref={mainRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-down hint indicator */}
        <div
          className={`nauka-pull-hint${pullDistance > 0 ? ' is-pulling' : ''}${revealed ? ' is-hidden' : ''}`}
          style={{ opacity: pullDistance > 0 ? 0 : 1 }}
          aria-hidden="true"
        >
          <ChevronDown size={18} />
        </div>

        {/* Easter egg title — revealed on pull */}
        <section
          className={`nauka-mobile-title nauka-easter-egg${showTitle ? ' is-visible' : ''}${revealed ? ' is-revealed' : ''}${settling ? ' is-settling' : ''}`}
          style={
            !revealed && pullDistance > 0
              ? {
                  maxHeight: `${pullDistance}px`,
                  opacity: pullProgress,
                  transform: `translateY(${-20 + pullProgress * 20}px) scale(${0.92 + pullProgress * 0.08})`,
                }
              : undefined
          }
          aria-hidden={!revealed}
        >
          <p>Ucz się systematycznie i zapamiętuj na dłużej.</p>
        </section>

        <section className="nauka-mobile-card nauka-mobile-stats" aria-label="Podsumowanie nauki">
          <div className="nauka-mobile-stat">
            <div className="nauka-mobile-stat-main">
              <span className="nauka-mobile-stat-icon"><Flame size={29} /></span>
              <strong>{stats?.sessionsThisWeek ?? 0}</strong>
            </div>
            <small>Strike</small>
          </div>
          <div className="nauka-mobile-stat">
            <div className="nauka-mobile-stat-main">
              <span className="nauka-mobile-stat-icon"><Copy size={29} /></span>
              <strong>{learned}</strong>
            </div>
            <span>Przerobione fiszki</span>
          </div>
        </section>

        <section className="nauka-mobile-card nauka-mobile-system-card">
          <div className="nauka-mobile-section-head">
            <h2>System</h2>
            <button type="button">Zarządzaj</button>
          </div>
          <div className="nauka-mobile-system-scroll" role="list" aria-label="Układy anatomiczne">
            {NAUKA_SYSTEMS.map((system) => {
              const Icon = getSystemIcon(system.name)
              const active = system.name === configSys
              return (
                <button
                  key={system.name}
                  type="button"
                  className={active ? 'is-active' : ''}
                  onClick={() => onConfigSysChange(system.name)}
                  role="listitem"
                >
                  {system.name === 'Wszystkie układy' ? <Infinity size={22} /> : <Icon size={22} />}
                  <span>{system.name}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="nauka-mobile-card nauka-mobile-feature-card">
          <div className="nauka-mobile-feature-top">
            <span>Fiszki</span>
            <strong>{browseIdx + 1} / {systemCards.length || activeDone + '/' + (activeTotal || 0)}</strong>
          </div>
          {/* FRONT */}
          <div
            className="nauka-mobile-feature-body"
            style={{ cursor: 'pointer', display: cardFlipped ? 'none' : undefined }}
            onClick={() => setCardFlipped(true)}
          >
            <div className="nauka-mobile-anatomy-visual">
              <Image src="/nauka-heart.png" alt="" width={320} height={320} priority />
            </div>
            <div className="nauka-mobile-feature-copy">
              <h2>{activeCard?.struct ?? 'Mięsień sercowy'}</h2>
              <em>{activeCard?.system ?? ''}</em>
              <p>{activeCard?.question ?? 'Pytanie o strukturę anatomiczną.'}</p>
              <button type="button" onClick={e => { e.stopPropagation(); setCardFlipped(true) }}>
                Pokaż odpowiedź
                <ChevronRight size={19} />
              </button>
            </div>
          </div>

          {/* BACK */}
          {cardFlipped && (
            <div
              style={{
                cursor: 'pointer',
                padding: '12px 0 4px',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}
              onClick={() => setCardFlipped(false)}
            >
              <span style={{
                fontSize: 10, fontWeight: 700, color: NK,
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                {activeCard?.struct} — odpowiedź
              </span>
              <p style={{
                margin: 0, fontSize: 15, lineHeight: 1.68,
                color: '#1B1B19', borderTop: '1px solid rgba(91,78,60,0.14)',
                paddingTop: 12,
              }}>
                {activeCard?.answer}
              </p>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setCardFlipped(false) }}
                style={{
                  alignSelf: 'flex-start', color: NK, background: 'none',
                  border: `1px solid ${NK}`, borderRadius: 8,
                  padding: '6px 14px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                ← Wróć do pytania
              </button>
            </div>
          )}
          {/* Navigation between cards */}
          {systemCards.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px 0' }}>
              <button
                type="button"
                onClick={handlePrev}
                style={{ background: 'none', border: 'none', color: NK, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ‹ Poprzednia
              </button>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{browseIdx + 1} / {systemCards.length}</span>
              <button
                type="button"
                onClick={handleNext}
                style={{ background: 'none', border: 'none', color: NK, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Następna ›
              </button>
            </div>
          )}

          <div className="nauka-mobile-mode-panel">
            <div className="nauka-mobile-mode-title">
              <Brain size={25} />
              <strong>Tryb nauki</strong>
            </div>
            <div className="nauka-mobile-mode-grid">
              <button
                type="button"
                className={configMode === 'nolimit' ? 'is-active' : ''}
                onClick={() => onConfigModeChange('nolimit')}
              >
                <Circle size={23} />
                <Infinity size={28} />
                <span>
                  <strong>Bez limitu</strong>
                  <small>Ucz się bez ograniczeń</small>
                </span>
              </button>
              <button
                type="button"
                className={configMode === 'pomodoro' ? 'is-active' : ''}
                onClick={() => onConfigModeChange('pomodoro')}
              >
                <Circle size={23} />
                <Timer size={28} />
                <span>
                  <strong>Pomodoro</strong>
                  <small>25 min skupienia</small>
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="nauka-mobile-card nauka-mobile-list-card" aria-label="Materiały i notatki">
          <button type="button" onClick={onRead}>
            <span className="nauka-mobile-list-icon is-green"><BookOpen size={28} /></span>
            <span>
              <strong>Materiały do czytania</strong>
              <small>Artykuły i opracowania</small>
            </span>
            <ChevronRight size={25} />
          </button>
          <button type="button">
            <span className="nauka-mobile-list-icon is-purple"><NotebookTabs size={28} /></span>
            <span>
              <strong>Notatki</strong>
              <small>Twoje notatki i najważniejsze informacje</small>
            </span>
            <em>{noteCount}</em>
            <ChevronRight size={25} />
          </button>
        </section>

        <section className="nauka-mobile-card nauka-mobile-progress-card">
          <div className="nauka-mobile-progress-head">
            <span className="nauka-mobile-list-icon is-green"><TrendingUp size={28} /></span>
            <div>
              <h2>Ostatni postęp</h2>
              <p>Dzisiaj</p>
            </div>
            <button type="button">
              Zobacz wszystkie
              <ChevronRight size={21} />
            </button>
          </div>
          <div className="nauka-mobile-progress-grid">
            <div>
              <span>Nauczone dzisiaj</span>
              <strong>{stats?.newCardsToday ?? 0}</strong>
              <small>fiszki</small>
            </div>
            <div>
              <span>Poprawne odpowiedzi</span>
              <strong>{correctPct}%</strong>
              <i style={{ width: `${Math.max(correctPct, 8)}%` }} />
            </div>
            <div>
              <span>Czas nauki</span>
              <strong>{formatMinutes(stats?.totalStudyMinutes)}</strong>
            </div>
          </div>
        </section>

        <div className="nauka-mobile-actions">
          <button type="button" className="nauka-mobile-primary" onClick={onStart}>
            <Play size={24} fill="currentColor" />
            Rozpocznij sesję
          </button>
          <button type="button" className="nauka-mobile-secondary" onClick={onRead}>
            <BookOpen size={27} />
            Czytaj materiał
          </button>
        </div>
      </main>
    </div>
  )
}
