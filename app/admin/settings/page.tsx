import Link from 'next/link'
import { requireAdmin, getRequireLoginSetting } from '@/lib/auth/guards'
import { AdminSettingsPanel } from '@/components/Admin/AdminSettingsPanel'

const SERIF = '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif'
const SANS = 'Inter,sans-serif'
const TEXT_MAIN = '#28231c'
const TEXT_MID = '#80786d'

export const metadata = {
  title: 'Ustawienia — Panel admina',
}

export default async function AdminSettingsPage() {
  await requireAdmin()
  const requireLogin = await getRequireLoginSetting()

  return (
    <main style={{ maxWidth: 700, margin: '60px auto', padding: '0 24px', fontFamily: SANS }}>
      <Link
        href="/admin"
        style={{ fontSize: 13, color: TEXT_MID, textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}
      >
        ← Wróć do panelu
      </Link>
      <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: TEXT_MAIN, marginBottom: 8 }}>
        Ustawienia aplikacji
      </h1>
      <p style={{ color: TEXT_MID, fontSize: 14, marginBottom: 32 }}>
        Globalne ustawienia aplikacji MedApp
      </p>
      <AdminSettingsPanel initialRequireLogin={requireLogin} />
    </main>
  )
}
