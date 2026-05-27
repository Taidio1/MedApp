# Auth Gating — Publiczny dostęp z blurowanym overlay

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Umożliwić niezalogowanym użytkownikom dostęp do strony Atlas (`/`), a strony Nauka/Quiz/Profil zabezpieczyć pełnoekranowym blur-overlayem z przyciskami logowania — z możliwością wyłączenia przez admina.

**Architecture:** Route group `app/(gated)/` z jednym `layout.tsx`, który czyta profil usera i flagę `require_login` z Supabase. Jeśli logowanie wymagane i brak sesji — renderuje `AuthGateOverlay` zamiast children. Strona Atlas przeniesiona do `app/(public)/` i dostępna bez logowania.

**Tech Stack:** Next.js 16 App Router (route groups), Supabase (tabela `app_settings`), React `cache()`, inline styles (spójne z istniejącym kodem)

---

## File Map

| Akcja | Ścieżka | Odpowiedzialność |
|-------|---------|-----------------|
| CREATE | `supabase/app-settings-migration.sql` | SQL: tabela app_settings + RLS |
| MODIFY | `lib/auth/guards.ts` | Dodaj `getRequireLoginSetting()` |
| CREATE | `components/AuthGate/AuthGateOverlay.tsx` | Pełnoekranowy blur overlay |
| CREATE | `app/(gated)/layout.tsx` | Gate logic: sprawdza auth + flagę |
| CREATE | `app/(gated)/quiz/layout.tsx` | Przeniesiony z `app/quiz/layout.tsx` |
| CREATE | `app/(gated)/quiz/page.tsx` | Przeniesiony, `requireUser` → optional |
| CREATE | `app/(gated)/nauka/page.tsx` | Przeniesiony, `requireUser` → optional |
| CREATE | `app/(gated)/nauka/materialy/page.tsx` | Przeniesiony, `requireUser` → optional |
| CREATE | `app/(gated)/profil/page.tsx` | Przeniesiony, null-safe profile fetching |
| DELETE | `app/quiz/page.tsx` | Zastąpiony przez (gated) |
| DELETE | `app/quiz/layout.tsx` | Zastąpiony przez (gated) |
| DELETE | `app/nauka/page.tsx` | Zastąpiony przez (gated) |
| DELETE | `app/nauka/materialy/page.tsx` | Zastąpiony przez (gated) |
| DELETE | `app/profil/page.tsx` | Zastąpiony przez (gated) |
| CREATE | `app/(public)/page.tsx` | Przeniesiony z `app/page.tsx`, optional auth |
| DELETE | `app/page.tsx` | Zastąpiony przez (public) |
| MODIFY | `components/AppShell/AppShell.tsx` | Przyjmuje `email?: string \| null` |
| MODIFY | `components/AppNavbar/AppNavbar.tsx` | Wariant gościa gdy brak email |
| CREATE | `app/admin/settings/page.tsx` | Strona ustawień admina |
| CREATE | `components/Admin/AdminSettingsPanel.tsx` | Toggle require_login |
| CREATE | `app/api/admin/settings/route.ts` | PUT endpoint dla app_settings |
| MODIFY | `app/admin/page.tsx` | Dodaj kartę "Ustawienia" |

---

## Task 1: SQL Migration — tabela app_settings

**Files:**
- Create: `supabase/app-settings-migration.sql`

- [ ] **Step 1: Napisz plik migracji**

```sql
-- supabase/app-settings-migration.sql
-- Run in Supabase SQL Editor

create table if not exists public.app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('require_login', 'true')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

-- Anon + authenticated mogą czytać ustawienia (potrzebne przed zalogowaniem)
create policy "app_settings_public_read"
  on public.app_settings for select
  to anon, authenticated
  using (true);

-- Tylko admin może zapisywać
create policy "app_settings_admin_write"
  on public.app_settings
  for all
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
```

- [ ] **Step 2: Uruchom migrację w Supabase**

W Supabase Dashboard → SQL Editor → wklej zawartość `supabase/app-settings-migration.sql` i uruchom.

Weryfikacja — uruchom w SQL Editorze:
```sql
select * from public.app_settings;
```
Oczekiwany wynik: jeden wiersz `key=require_login, value=true`.

- [ ] **Step 3: Commit**

```bash
git add supabase/app-settings-migration.sql
git commit -m "feat: add app_settings table migration"
```

---

## Task 2: `getRequireLoginSetting()` w guards.ts

**Files:**
- Modify: `lib/auth/guards.ts`

- [ ] **Step 1: Dodaj import cache z React i funkcję getRequireLoginSetting**

Otwórz `lib/auth/guards.ts`. Na górze pliku dodaj import `cache`:

```ts
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from './server'
import type { UserProfile } from './types'
```

Na końcu pliku, po `requireAdmin`, dodaj:

```ts
export const getRequireLoginSetting = cache(async (): Promise<boolean> => {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'require_login')
      .single()
    return data?.value !== 'false'
  } catch {
    return true
  }
})
```

- [ ] **Step 2: Sprawdź TypeScript**

```bash
npx tsc --noEmit
```
Oczekiwany wynik: zero błędów.

- [ ] **Step 3: Commit**

```bash
git add lib/auth/guards.ts
git commit -m "feat: add getRequireLoginSetting to auth guards"
```

---

## Task 3: Komponent AuthGateOverlay

**Files:**
- Create: `components/AuthGate/AuthGateOverlay.tsx`

- [ ] **Step 1: Utwórz katalog i komponent**

Utwórz plik `components/AuthGate/AuthGateOverlay.tsx`:

```tsx
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
```

- [ ] **Step 2: Sprawdź TypeScript**

```bash
npx tsc --noEmit
```
Oczekiwany wynik: zero błędów.

- [ ] **Step 3: Commit**

```bash
git add components/AuthGate/AuthGateOverlay.tsx
git commit -m "feat: add AuthGateOverlay blur component"
```

---

## Task 4: Gated layout — `app/(gated)/layout.tsx`

**Files:**
- Create: `app/(gated)/layout.tsx`

- [ ] **Step 1: Utwórz katalog i layout**

Utwórz `app/(gated)/layout.tsx`:

```tsx
import { getCurrentUserProfile, getRequireLoginSetting } from '@/lib/auth/guards'
import { AuthGateOverlay } from '@/components/AuthGate/AuthGateOverlay'

export default async function GatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, requireLogin] = await Promise.all([
    getCurrentUserProfile(),
    getRequireLoginSetting(),
  ])

  if (requireLogin && !profile) {
    return (
      <>
        {children}
        <AuthGateOverlay />
      </>
    )
  }

  return <>{children}</>
}
```

Uwaga: `{children}` jest renderowany nawet gdy wyświetlamy overlay — żeby treść strony była widoczna przez blur. Overlay jest nałożony na wierzch pozycją `fixed`.

- [ ] **Step 2: Sprawdź TypeScript**

```bash
npx tsc --noEmit
```
Oczekiwany wynik: zero błędów.

- [ ] **Step 3: Commit**

```bash
git add "app/(gated)/layout.tsx"
git commit -m "feat: add (gated) route group layout with auth gate"
```

---

## Task 5: Przeniesienie strony Quiz

**Files:**
- Create: `app/(gated)/quiz/page.tsx`
- Create: `app/(gated)/quiz/layout.tsx`
- Delete: `app/quiz/page.tsx`
- Delete: `app/quiz/layout.tsx`

- [ ] **Step 1: Utwórz `app/(gated)/quiz/layout.tsx`**

```tsx
import { Libre_Baskerville } from 'next/font/google'
import type { ReactNode } from 'react'

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-libre-baskerville',
  display: 'swap',
})

export default function QuizLayout({ children }: { children: ReactNode }) {
  return (
    <div className={libreBaskerville.variable} style={{ fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' }}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Utwórz `app/(gated)/quiz/page.tsx`**

```tsx
import { getCurrentUserProfile } from '@/lib/auth/guards'
import { QuizPage } from '@/components/Quiz/QuizPage'

export const metadata = {
  title: 'Quiz anatomiczny — MedApp Anatomy Studio',
}

export default async function QuizRoute() {
  const profile = await getCurrentUserProfile()

  return (
    <QuizPage
      displayName={profile?.displayName ?? null}
      isAdmin={profile?.role === 'admin'}
      userId={profile?.id ?? ''}
    />
  )
}
```

- [ ] **Step 3: Usuń stare pliki**

```bash
rm "app/quiz/page.tsx"
rm "app/quiz/layout.tsx"
```

(W PowerShell: `Remove-Item "app/quiz/page.tsx"` i `Remove-Item "app/quiz/layout.tsx"`)

- [ ] **Step 4: Sprawdź TypeScript i build**

```bash
npx tsc --noEmit
```
Oczekiwany wynik: zero błędów.

- [ ] **Step 5: Commit**

```bash
git add "app/(gated)/quiz/page.tsx" "app/(gated)/quiz/layout.tsx"
git rm app/quiz/page.tsx app/quiz/layout.tsx
git commit -m "feat: move quiz route to (gated) group"
```

---

## Task 6: Przeniesienie stron Nauka

**Files:**
- Create: `app/(gated)/nauka/page.tsx`
- Create: `app/(gated)/nauka/materialy/page.tsx`
- Delete: `app/nauka/page.tsx`
- Delete: `app/nauka/materialy/page.tsx`

- [ ] **Step 1: Utwórz `app/(gated)/nauka/page.tsx`**

```tsx
import { getCurrentUserProfile } from '@/lib/auth/guards'
import { NaukaPage } from '@/components/Nauka/NaukaPage'

export const metadata = {
  title: 'Nauka — MedApp Anatomy Studio',
}

export default async function NaukaRoute() {
  const profile = await getCurrentUserProfile()

  return (
    <NaukaPage
      displayName={profile?.displayName ?? null}
      isAdmin={profile?.role === 'admin'}
    />
  )
}
```

- [ ] **Step 2: Utwórz katalog materialy i `app/(gated)/nauka/materialy/page.tsx`**

```tsx
import { AppNavbar } from '@/components/AppNavbar/AppNavbar'
import { NaukaMaterialsPage } from '@/components/Nauka/NaukaMaterialsPage'
import { getCurrentUserProfile } from '@/lib/auth/guards'
import { fetchReadingMaterials } from '@/lib/supabase/nauka'

export const metadata = {
  title: 'Materiały do czytania — MedApp Anatomy Studio',
}

interface NaukaMaterialsRouteProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function NaukaMaterialsRoute({ searchParams }: NaukaMaterialsRouteProps) {
  const profile = await getCurrentUserProfile()
  const params = await searchParams
  const systemParam = Array.isArray(params.system) ? params.system[0] : params.system
  const readings = await fetchReadingMaterials()

  return (
    <div className="quiz-shell app-shell-with-navbar reading-materials-page">
      <AppNavbar
        active="nauka"
        displayName={profile?.displayName ?? null}
        isAdmin={profile?.role === 'admin'}
        email={profile?.email}
      />
      <NaukaMaterialsPage readings={readings} selectedSystem={systemParam ?? null} />
    </div>
  )
}
```

- [ ] **Step 3: Usuń stare pliki**

```bash
git rm app/nauka/page.tsx "app/nauka/materialy/page.tsx"
```

- [ ] **Step 4: Sprawdź TypeScript**

```bash
npx tsc --noEmit
```
Oczekiwany wynik: zero błędów.

- [ ] **Step 5: Commit**

```bash
git add "app/(gated)/nauka/page.tsx" "app/(gated)/nauka/materialy/page.tsx"
git commit -m "feat: move nauka routes to (gated) group"
```

---

## Task 7: Przeniesienie strony Profil

**Files:**
- Create: `app/(gated)/profil/page.tsx`
- Delete: `app/profil/page.tsx`

- [ ] **Step 1: Utwórz `app/(gated)/profil/page.tsx`**

Gdy profil jest null (tryb prezentacyjny), strona pokazuje puste statystyki zamiast crashować.

```tsx
import { ProfilePage } from '@/components/Profile/ProfilePage'
import { getCurrentUserProfile } from '@/lib/auth/guards'
import { fetchUserStats } from '@/lib/supabase/nauka'
import { fetchUserQuizHistory, fetchUserQuizSummary } from '@/lib/supabase/quiz'
import type { UserNaukaStats } from '@/lib/supabase/nauka'
import type { QuizHistoryEntry } from '@/components/Quiz/quizData'
import type { UserQuizSummary } from '@/lib/supabase/quiz'

export const metadata = {
  title: 'Profil — MedApp Anatomy Studio',
}

const EMPTY_QUIZ_SUMMARY: UserQuizSummary = {
  completedSessions: 0,
  averageScorePercent: 0,
  bestStreak: 0,
  totalTimeSeconds: 0,
}

async function optionalData<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch {
    return fallback
  }
}

export default async function ProfileRoute() {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    return (
      <ProfilePage
        profile={{ id: '', email: '', displayName: null, avatarUrl: null, role: 'user' }}
        learningStats={null}
        quizHistory={[]}
        quizSummary={EMPTY_QUIZ_SUMMARY}
      />
    )
  }

  const [learningStats, quizHistory, quizSummary] = await Promise.all([
    optionalData<UserNaukaStats | null>(() => fetchUserStats(profile.id), null),
    optionalData<QuizHistoryEntry[]>(() => fetchUserQuizHistory(profile.id), []),
    optionalData<UserQuizSummary>(() => fetchUserQuizSummary(profile.id), EMPTY_QUIZ_SUMMARY),
  ])

  return (
    <ProfilePage
      profile={profile}
      learningStats={learningStats}
      quizHistory={quizHistory}
      quizSummary={quizSummary}
    />
  )
}
```

- [ ] **Step 2: Usuń stary plik**

```bash
git rm app/profil/page.tsx
```

- [ ] **Step 3: Sprawdź TypeScript**

```bash
npx tsc --noEmit
```
Oczekiwany wynik: zero błędów.

- [ ] **Step 4: Commit**

```bash
git add "app/(gated)/profil/page.tsx"
git commit -m "feat: move profil route to (gated) group with null-safe guest handling"
```

---

## Task 8: Strona główna jako publiczna + AppShell/AppNavbar dla gościa

**Files:**
- Create: `app/(public)/page.tsx`
- Delete: `app/page.tsx`
- Modify: `components/AppShell/AppShell.tsx`
- Modify: `components/AppNavbar/AppNavbar.tsx`

- [ ] **Step 1: Zaktualizuj `components/AppNavbar/AppNavbar.tsx`**

Zmień props — `email` staje się opcjonalne. Gdy brak emaila, pokaż przycisk "Zaloguj się":

```tsx
'use client'

import Link from 'next/link'
import {
  Bell,
  Box,
  CircleQuestionMark,
  GraduationCap,
  House,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { UserMenu } from '@/components/UserMenu/UserMenu'

export type AppNavId = 'atlas' | 'explorer' | 'quiz' | 'nauka' | 'profil'

interface AppNavbarProps {
  active: AppNavId
  displayName?: string | null
  email?: string | null
  isAdmin?: boolean
}

const navItems: { id: AppNavId; label: string; href: string; icon: LucideIcon }[] = [
  { id: 'atlas', label: 'Atlas', href: '/', icon: House },
  { id: 'explorer', label: 'Explorer 3D', href: '/#explorer', icon: Box },
  { id: 'quiz', label: 'Quiz', href: '/quiz', icon: CircleQuestionMark },
  { id: 'nauka', label: 'Nauka', href: '/nauka', icon: GraduationCap },
  { id: 'profil', label: 'Profil', href: '/profil', icon: UserRound },
]

const SANS = 'Inter,sans-serif'

export function AppNavbar({ active, displayName, email, isAdmin = false }: AppNavbarProps) {
  return (
    <div className="app-navbar">
      <Link href="/" className="app-navbar-brand" aria-label="MedApp Anatomy Studio">
        <strong>MedApp</strong>
        <span>Anatomy Studio</span>
      </Link>

      <nav className="app-navbar-nav" aria-label="Główna nawigacja">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          const href = item.href
          const content = (
            <>
              <Icon size={22} strokeWidth={1.8} />
              <span>{item.label}</span>
            </>
          )

          if (isActive) {
            return (
              <span key={item.id} className="app-navbar-nav-item is-active">
                {content}
              </span>
            )
          }

          return (
            <Link key={item.id} href={href} className="app-navbar-nav-item">
              {content}
            </Link>
          )
        })}
      </nav>

      <div className="app-navbar-actions">
        {email ? (
          <>
            <button className="app-navbar-icon-button" aria-label="Powiadomienia" type="button">
              <Bell size={20} strokeWidth={2} />
              <span aria-hidden="true" />
            </button>
            <div className="app-navbar-user">
              <UserMenu email={email} displayName={displayName ?? null} isAdmin={isAdmin} />
            </div>
          </>
        ) : (
          <Link
            href="/login"
            style={{
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 500,
              color: '#5b4e3c',
              padding: '7px 16px',
              border: '1.5px solid rgba(91,78,60,0.28)',
              borderRadius: 8,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Zaloguj się
          </Link>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Zaktualizuj `components/AppShell/AppShell.tsx`**

Zmień props żeby `email` było opcjonalne:

```tsx
interface AppShellProps {
  email?: string | null
  displayName?: string | null
  isAdmin?: boolean
}
```

Oraz w samym JSX — zmień linię z `AppNavbar`:
```tsx
<AppNavbar active="atlas" email={email} displayName={displayName ?? null} isAdmin={isAdmin ?? false} />
```

- [ ] **Step 3: Utwórz `app/(public)/page.tsx`**

```tsx
import { getCurrentUserProfile } from '@/lib/auth/guards'
import { AppShell } from '@/components/AppShell/AppShell'

export default async function HomePage() {
  const profile = await getCurrentUserProfile()

  return (
    <AppShell
      email={profile?.email ?? null}
      displayName={profile?.displayName ?? null}
      isAdmin={profile?.role === 'admin'}
    />
  )
}
```

- [ ] **Step 4: Usuń stary `app/page.tsx`**

```bash
git rm app/page.tsx
```

- [ ] **Step 5: Sprawdź TypeScript**

```bash
npx tsc --noEmit
```
Oczekiwany wynik: zero błędów.

- [ ] **Step 6: Commit**

```bash
git add "app/(public)/page.tsx" components/AppShell/AppShell.tsx components/AppNavbar/AppNavbar.tsx
git commit -m "feat: make Atlas page public, add guest navbar variant"
```

---

## Task 9: Admin settings panel + API endpoint

**Files:**
- Create: `app/admin/settings/page.tsx`
- Create: `components/Admin/AdminSettingsPanel.tsx`
- Create: `app/api/admin/settings/route.ts`
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Utwórz `app/api/admin/settings/route.ts`**

```ts
import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  return null
}

export async function PUT(req: Request) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  if (b.key !== 'require_login') {
    return Response.json({ error: 'Nieznany klucz ustawień' }, { status: 400 })
  }
  if (b.value !== 'true' && b.value !== 'false') {
    return Response.json({ error: 'Wartość musi być "true" lub "false"' }, { status: 400 })
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: b.key, value: b.value, updated_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Błąd serwera' },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2: Utwórz `components/Admin/AdminSettingsPanel.tsx`**

```tsx
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
```

- [ ] **Step 3: Utwórz `app/admin/settings/page.tsx`**

```tsx
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
```

- [ ] **Step 4: Dodaj kartę "Ustawienia" do `app/admin/page.tsx`**

Znajdź tablicę `cards` i dodaj nową kartę:

```ts
const cards = [
  { href: '/admin/nauka', title: 'Nauka', desc: 'Fiszki i materiały do czytania', accent: '#2a7a60', bg: '#edf9f5' },
  { href: '/admin/quiz', title: 'Quiz', desc: 'Pytania quizowe', accent: '#7c3aed', bg: '#f5f0ff' },
  { href: '/admin/annotations', title: 'Anotacje', desc: 'Punkty anotacji 3D', accent: '#5b4e3c', bg: '#fbf7ee' },
  { href: '/admin/settings', title: 'Ustawienia', desc: 'Tryb prezentacyjny i dostęp', accent: '#64748b', bg: '#f8fafc' },
]
```

- [ ] **Step 5: Sprawdź TypeScript**

```bash
npx tsc --noEmit
```
Oczekiwany wynik: zero błędów.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/settings/route.ts components/Admin/AdminSettingsPanel.tsx app/admin/settings/page.tsx app/admin/page.tsx
git commit -m "feat: add admin settings panel with require_login toggle"
```

---

## Task 10: Weryfikacja końcowa

- [ ] **Step 1: Pełny build**

```bash
npm run build
```
Oczekiwany wynik: build przechodzi bez błędów.

- [ ] **Step 2: Uruchom dev server**

```bash
npm run dev
```

- [ ] **Step 3: Testy manualne (wyloguj się z aplikacji)**

Sprawdź każdy scenariusz:

| Scenariusz | Oczekiwany wynik |
|------------|-----------------|
| Niezalogowany odwiedza `/` | Strona Atlas działa, navbar z przyciskiem "Zaloguj się" |
| Niezalogowany odwiedza `/quiz` | Strona widoczna przez blur, overlay z przyciskami, scroll zablokowany |
| Niezalogowany odwiedza `/nauka` | Overlay z bluriem |
| Niezalogowany odwiedza `/nauka/materialy` | Overlay z bluriem |
| Niezalogowany odwiedza `/profil` | Overlay z bluriem |
| Zalogowany user odwiedza `/quiz` | Strona działa normalnie |
| Admin włącza tryb prezentacyjny w `/admin/settings` | Toggle zmienia się, zapis idzie do Supabase |
| Po wyłączeniu require_login: niezalogowany `/quiz` | Pełna strona bez overlay |
| Po włączeniu require_login: niezalogowany `/quiz` | Overlay wraca |
| Niezalogowany próbuje wejść na `/admin/settings` | Redirect (requireAdmin) |

- [ ] **Step 4: Final commit jeśli wszystko OK**

```bash
git add -A
git commit -m "chore: verify auth gating feature complete"
```
