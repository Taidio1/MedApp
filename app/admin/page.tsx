import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/guards'

const SERIF = '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif'
const SANS = 'Inter,sans-serif'
const TEXT_MAIN = '#28231c'
const TEXT_MID = '#80786d'
const CARD_BORDER = 'rgba(91,78,60,0.14)'

export default async function AdminPage() {
  await requireAdmin()

  const cards = [
    { href: '/admin/nauka', title: 'Nauka', desc: 'Fiszki i materiały do czytania', accent: '#2a7a60', bg: '#edf9f5' },
    { href: '/admin/quiz', title: 'Quiz', desc: 'Pytania quizowe', accent: '#7c3aed', bg: '#f5f0ff' },
    { href: '/admin/annotations', title: 'Anotacje', desc: 'Punkty anotacji 3D', accent: '#5b4e3c', bg: '#fbf7ee' },
    { href: '/admin/settings', title: 'Ustawienia', desc: 'Tryb prezentacyjny i dostęp', accent: '#64748b', bg: '#f8fafc' },
  ]

  return (
    <main style={{ maxWidth: 900, margin: '60px auto', padding: '0 24px', fontFamily: SANS }}>
      <Link href="/" style={{ fontSize: 13, color: TEXT_MID, textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
        ← Wróć do learnera
      </Link>
      <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 500, color: TEXT_MAIN, marginBottom: 8 }}>
        Panel admina
      </h1>
      <p style={{ color: TEXT_MID, fontSize: 14, marginBottom: 36 }}>
        Zarządzaj zawartością aplikacji MedApp
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {cards.map(c => (
          <a
            key={c.href}
            href={c.href}
            style={{
              display: 'block', padding: '24px 28px',
              background: c.bg, border: `1.5px solid ${c.accent}28`,
              borderRadius: 12, textDecoration: 'none',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600, color: c.accent, fontFamily: SERIF, marginBottom: 6 }}>
              {c.title}
            </div>
            <div style={{ fontSize: 13.5, color: TEXT_MID, fontFamily: SANS }}>{c.desc}</div>
          </a>
        ))}
      </div>
    </main>
  )
}
