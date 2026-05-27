'use client'

import Link from 'next/link'
import { useEffect } from 'react'

const SERIF = '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif'
const SANS = 'Inter,sans-serif'

export function AuthGateOverlay() {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(0,0,0,0.35)',
      }}
    >
      <div
        style={{
          background: '#fbf7ee',
          border: '1.5px solid rgba(91,78,60,0.16)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(78,66,48,0.18)',
          padding: '40px 36px',
          maxWidth: 360,
          width: '90%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 16 }}>🔒</div>
        <h2
          style={{
            fontFamily: SERIF,
            fontSize: 22,
            fontWeight: 500,
            color: '#28231c',
            margin: '0 0 10px',
          }}
        >
          Zaloguj się, aby kontynuować
        </h2>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14,
            color: '#80786d',
            margin: '0 0 28px',
            lineHeight: 1.5,
          }}
        >
          Ta sekcja wymaga konta MedApp
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link
            href="/login"
            style={{
              display: 'block',
              padding: '11px 0',
              borderRadius: 9,
              background: '#5b4e3c',
              color: '#fbf7ee',
              fontFamily: SANS,
              fontSize: 14.5,
              fontWeight: 600,
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Zaloguj się
          </Link>
          <Link
            href="/login?tab=register"
            style={{
              display: 'block',
              padding: '11px 0',
              borderRadius: 9,
              border: '1.5px solid rgba(91,78,60,0.28)',
              background: 'transparent',
              color: '#5b4e3c',
              fontFamily: SANS,
              fontSize: 14.5,
              fontWeight: 500,
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Zarejestruj się
          </Link>
        </div>
      </div>
    </div>
  )
}
