'use client'

import { useState, useEffect } from 'react'

const SESSION_KEY = 'medapp_welcome_shown'

const slides = [
  {
    icon: '✧',
    title: 'Witaj w MedApp',
    subtitle: 'Interaktywny atlas anatomii 3D',
    body: 'Eksploruj struktury ciała ludzkiego w trójwymiarze — od układu krążenia po układ pokarmowy.',
  },
  {
    icon: '▦',
    title: 'Wybierz strukturę',
    subtitle: 'Panel po lewej stronie',
    body: 'Rozwiń kategorię w lewym panelu i kliknij wybraną strukturę, aby załadować jej model 3D.',
  },
  {
    icon: '◎',
    title: 'Ucz się i ćwicz',
    subtitle: 'Tryby nauki i quizy',
    body: 'Przeglądaj punkty anatomiczne, zaznaczaj zapamiętane struktury i sprawdzaj wiedzę w trybie quizu.',
  },
]

interface WelcomeScreenProps {
  onDismiss: () => void
}

export function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  const [slide, setSlide] = useState(0)
  const [exiting, setExiting] = useState(false)

  const isLast = slide === slides.length - 1

  const handleNext = () => {
    if (isLast) {
      handleDismiss()
    } else {
      setSlide((s) => s + 1)
    }
  }

  const handleDismiss = () => {
    setExiting(true)
    sessionStorage.setItem(SESSION_KEY, '1')
    setTimeout(onDismiss, 340)
  }

  return (
    <div
      className={`welcome-overlay${exiting ? ' is-exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Ekran powitalny"
    >
      <div className="welcome-card">
        <button
          className="welcome-skip"
          onClick={handleDismiss}
          aria-label="Pomiń"
        >
          Pomiń
        </button>

        <div className="welcome-slides">
          {slides.map((s, i) => (
            <div
              key={i}
              className={`welcome-slide${i === slide ? ' is-active' : ''}`}
              aria-hidden={i !== slide}
            >
              <div className="welcome-orb" aria-hidden="true">
                <span>{s.icon}</span>
              </div>
              <h2 className="welcome-title">{s.title}</h2>
              <p className="welcome-subtitle">{s.subtitle}</p>
              <p className="welcome-body">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="welcome-dots" role="tablist" aria-label="Slajdy">
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === slide}
              aria-label={`Slajd ${i + 1}`}
              className={`welcome-dot${i === slide ? ' is-active' : ''}`}
              onClick={() => setSlide(i)}
            />
          ))}
        </div>

        <div className="welcome-actions">
          {slide > 0 && (
            <button className="welcome-btn-secondary" onClick={() => setSlide((s) => s - 1)}>
              Wstecz
            </button>
          )}
          <button className="welcome-btn-primary" onClick={handleNext}>
            {isLast ? 'Zaczynamy ✧' : 'Dalej'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function useWelcomeScreen() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setShow(true)
    }
  }, [])

  return { show, dismiss: () => setShow(false) }
}
