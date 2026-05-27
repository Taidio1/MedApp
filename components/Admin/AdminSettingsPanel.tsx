'use client'

import { useState } from 'react'

const SERIF = '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif'
const SANS = 'Inter,sans-serif'
const TEXT_MAIN = '#28231c'
const TEXT_MID = '#80786d'
const CARD_BG = '#fbf7ee'
const CARD_BORDER = 'rgba(91,78,60,0.14)'

interface AdminSettingsPanelProps {
  initialRequireLogin: boolean
}

export function AdminSettingsPanel({ initialRequireLogin }: AdminSettingsPanelProps) {
  const [requireLogin, setRequireLogin] = useState(initialRequireLogin)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    const next = !requireLogin
    setRequireLogin(next)
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'require_login', value: next ? 'true' : 'false' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Błąd serwera')
      }
    } catch (err) {
      setRequireLogin(!next)
      setError(err instanceof Error ? err.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div
        style={{
          background: CARD_BG,
          border: `1.5px solid ${CARD_BORDER}`,
          borderRadius: 12,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, color: TEXT_MAIN, marginBottom: 6 }}>
            Wymagaj logowania
          </div>
          <div style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_MID, lineHeight: 1.55 }}>
            Gdy wyłączone, wszyscy odwiedzający mają pełny dostęp bez konta (tryb prezentacyjny).
            Panel admina zawsze wymaga roli admin.
          </div>
          {error && (
            <div style={{ marginTop: 10, color: '#c0392b', fontFamily: SANS, fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>
        <button
          onClick={handleToggle}
          disabled={saving}
          aria-label={requireLogin ? 'Wyłącz wymóg logowania' : 'Włącz wymóg logowania'}
          style={{
            flexShrink: 0,
            width: 52,
            height: 28,
            borderRadius: 14,
            border: 'none',
            background: requireLogin ? '#2a7a60' : '#c0b8a8',
            cursor: saving ? 'not-allowed' : 'pointer',
            position: 'relative',
            transition: 'background 0.2s',
            opacity: saving ? 0.7 : 1,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: requireLogin ? 26 : 3,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          />
        </button>
      </div>
    </div>
  )
}
