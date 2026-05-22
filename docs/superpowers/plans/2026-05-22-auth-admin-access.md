# Auth & Admin Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase Auth login to protect the whole app and expose `/admin/*` only to users with `role = 'admin'` in `public.users`.

**Architecture:** Next.js 16 proxy.ts performs a fast, optimistic session-cookie check and redirects unauthenticated users to `/login`. Authoritative decisions live server-side: `requireUser()` in the main page, `requireAdmin()` in every admin page and API route. The Supabase `@supabase/ssr` package provides typed cookie-based clients for both browser and server.

**Tech Stack:** Next.js 16 App Router, TypeScript, `@supabase/supabase-js`, `@supabase/ssr`, Tailwind CSS, Zustand (unchanged)

**Spec:** `docs/superpowers/specs/2026-05-22-auth-admin-access-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| CREATE | `lib/auth/types.ts` | `AppRole`, `UserProfile` TypeScript types |
| CREATE | `lib/auth/browser.ts` | `createSupabaseBrowserClient()` — client components |
| CREATE | `lib/auth/server.ts` | `createSupabaseServerClient()` — server components & route handlers |
| CREATE | `lib/auth/guards.ts` | `getCurrentUserProfile()`, `requireUser()`, `requireAdmin()` |
| CREATE | `proxy.ts` | Next.js 16 Proxy — optimistic cookie redirect to `/login` |
| CREATE | `.env.local.example` | Documents required env vars |
| CREATE | `app/login/LoginForm.tsx` | `'use client'` email/password form |
| CREATE | `app/login/page.tsx` | Server component — redirects authenticated users, renders LoginForm |
| CREATE | `components/UserMenu/UserMenu.tsx` | `'use client'` — user email + sign-out + admin link |
| CREATE | `scripts/verify-auth-admin.mjs` | Source-level guard verification (RED→GREEN) |
| MODIFY | `app/page.tsx` | Call `requireUser()`, add `UserMenu` to header |
| MODIFY | `app/admin/annotations/page.tsx` | Replace `NODE_ENV` guard with `requireAdmin()` |
| MODIFY | `app/api/admin/annotations/route.ts` | Replace `NODE_ENV` guard with 401/403 auth checks |
| MODIFY | `scripts/verify-admin-annotations.mjs` | Fix stale `NODE_ENV` assertions |
| MODIFY | `package.json` | Add `@supabase/*` deps + `verify:auth-admin` script |

---

## Task 1: Install Supabase packages + env example

**Files:**
- Modify: `package.json`
- Create: `.env.local.example`

- [ ] **Step 1: Install Supabase SSR packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Expected: both packages added under `"dependencies"` in `package.json` and installed in `node_modules/`.

- [ ] **Step 2: Add verify:auth-admin script to package.json**

In `package.json`, add the new script to the `"scripts"` section:

```json
"verify:auth-admin": "node scripts/verify-auth-admin.mjs"
```

The final scripts block should look like:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "verify:learning-data": "node scripts/verify-learning-data.mjs",
  "verify:annotation-panel": "node scripts/verify-stable-annotation-panel.mjs",
  "verify:admin-annotations": "node scripts/verify-admin-annotations.mjs",
  "verify:auth-admin": "node scripts/verify-auth-admin.mjs",
  "start": "next start"
}
```

- [ ] **Step 3: Create .env.local.example**

Create `.env.local.example` at the project root:

```bash
# Supabase project credentials — get from: https://app.supabase.com → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend FastAPI URL (optional, defaults to http://localhost:8000)
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase service role key (server-only, optional — needed if you add service-role operations)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.local.example
git commit -m "chore: add @supabase/supabase-js and @supabase/ssr"
```

---

## Task 2: Write RED verify-auth-admin.mjs and confirm it fails

**Files:**
- Create: `scripts/verify-auth-admin.mjs`

- [ ] **Step 1: Create the verification script**

Create `scripts/verify-auth-admin.mjs`:

```js
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertFile(relativePath) {
  assert(
    fs.existsSync(path.join(root, relativePath)),
    `Missing file: ${relativePath}`,
  )
}

// ── Required files ────────────────────────────────────────────────────────────
assertFile('lib/auth/types.ts')
assertFile('lib/auth/browser.ts')
assertFile('lib/auth/server.ts')
assertFile('lib/auth/guards.ts')
assertFile('proxy.ts')
assertFile('app/login/page.tsx')
assertFile('app/login/LoginForm.tsx')
assertFile('components/UserMenu/UserMenu.tsx')

// ── lib/auth/types.ts ─────────────────────────────────────────────────────────
const types = read('lib/auth/types.ts')
assert(types.includes('UserProfile'), 'auth/types.ts must export UserProfile')
assert(types.includes('AppRole'), 'auth/types.ts must export AppRole')
assert(types.includes("'user'"), "AppRole must include 'user'")
assert(types.includes("'admin'"), "AppRole must include 'admin'")
assert(types.includes("'premiumUser'"), "AppRole must include 'premiumUser'")

// ── lib/auth/browser.ts ───────────────────────────────────────────────────────
const browser = read('lib/auth/browser.ts')
assert(
  browser.includes('createSupabaseBrowserClient'),
  'auth/browser.ts must export createSupabaseBrowserClient',
)
assert(
  browser.includes('@supabase/ssr'),
  'auth/browser.ts must import from @supabase/ssr',
)

// ── lib/auth/server.ts ────────────────────────────────────────────────────────
const server = read('lib/auth/server.ts')
assert(
  server.includes('createSupabaseServerClient'),
  'auth/server.ts must export createSupabaseServerClient',
)
assert(
  server.includes('@supabase/ssr'),
  'auth/server.ts must import from @supabase/ssr',
)
assert(
  server.includes('cookies'),
  'auth/server.ts must import cookies from next/headers',
)

// ── lib/auth/guards.ts ────────────────────────────────────────────────────────
const guards = read('lib/auth/guards.ts')
assert(guards.includes('getCurrentUserProfile'), 'guards.ts must export getCurrentUserProfile')
assert(guards.includes('requireUser'), 'guards.ts must export requireUser')
assert(guards.includes('requireAdmin'), 'guards.ts must export requireAdmin')
assert(
  guards.includes("redirect('/login')"),
  "guards.ts must redirect('/login') when there is no session",
)
assert(
  guards.includes("redirect('/')"),
  "guards.ts must redirect('/') when user is not admin",
)

// ── proxy.ts ──────────────────────────────────────────────────────────────────
const proxy = read('proxy.ts')
assert(
  proxy.includes('export function proxy') || proxy.includes('export default function proxy'),
  'proxy.ts must export a proxy function',
)
assert(proxy.includes('matcher'), 'proxy.ts must export a matcher config')
assert(
  proxy.includes('/login'),
  'proxy.ts must redirect to /login when there is no session',
)

// ── app/page.tsx ──────────────────────────────────────────────────────────────
const mainPage = read('app/page.tsx')
assert(
  mainPage.includes('requireUser'),
  'app/page.tsx must call requireUser()',
)
assert(
  mainPage.includes('UserMenu'),
  'app/page.tsx must render UserMenu in the header',
)

// ── app/admin/annotations/page.tsx ────────────────────────────────────────────
const adminPage = read('app/admin/annotations/page.tsx')
assert(
  adminPage.includes('requireAdmin'),
  'admin/annotations/page.tsx must call requireAdmin()',
)
assert(
  !adminPage.includes("NODE_ENV !== 'development'"),
  'admin/annotations/page.tsx must NOT use NODE_ENV guard',
)

// ── app/api/admin/annotations/route.ts ────────────────────────────────────────
const route = read('app/api/admin/annotations/route.ts')
assert(
  !route.includes("NODE_ENV !== 'development'"),
  'admin annotations route must NOT use NODE_ENV guard',
)
assert(
  route.includes('401'),
  'admin annotations route must return 401 for missing session',
)
assert(
  route.includes('403'),
  'admin annotations route must return 403 for non-admin user',
)
assert(
  route.includes('getCurrentUserProfile') || route.includes('requireAdmin'),
  'admin annotations route must use auth helpers',
)

// ── package.json ──────────────────────────────────────────────────────────────
const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['verify:auth-admin'] === 'node scripts/verify-auth-admin.mjs',
  'package.json must expose verify:auth-admin',
)
assert(
  '@supabase/supabase-js' in (pkg.dependencies ?? {}),
  'package.json must list @supabase/supabase-js in dependencies',
)
assert(
  '@supabase/ssr' in (pkg.dependencies ?? {}),
  'package.json must list @supabase/ssr in dependencies',
)

console.log('✓ Auth/admin verification passed')
```

- [ ] **Step 2: Run it to confirm RED**

```bash
npm run verify:auth-admin
```

Expected: script fails with `Missing file: lib/auth/types.ts` or similar. This confirms the test is real.

- [ ] **Step 3: Commit the script**

```bash
git add scripts/verify-auth-admin.mjs
git commit -m "test(auth): add RED verify-auth-admin verification script"
```

---

## Task 3: Create lib/auth/ layer

**Files:**
- Create: `lib/auth/types.ts`
- Create: `lib/auth/browser.ts`
- Create: `lib/auth/server.ts`
- Create: `lib/auth/guards.ts`

- [ ] **Step 1: Create lib/auth/types.ts**

```typescript
export type AppRole = 'user' | 'admin' | 'premiumUser'

export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  role: AppRole
}
```

- [ ] **Step 2: Create lib/auth/browser.ts**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 3: Create lib/auth/server.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Component — cookies are read-only here; the browser client handles writes
          }
        },
      },
    },
  )
}
```

- [ ] **Step 4: Create lib/auth/guards.ts**

```typescript
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from './server'
import type { UserProfile } from './types'

interface UsersRow {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin' | 'premiumUser'
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data, error: profileError } = await supabase
    .from('users')
    .select('id, email, display_name, avatar_url, role')
    .eq('id', user.id)
    .single()

  if (profileError || !data) return null

  const row = data as UsersRow

  return {
    id: row.id,
    email: row.email ?? user.email ?? '',
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
  }
}

export async function requireUser(): Promise<UserProfile> {
  const profile = await getCurrentUserProfile()
  if (!profile) redirect('/login')
  return profile
}

export async function requireAdmin(): Promise<UserProfile> {
  const profile = await getCurrentUserProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/')
  return profile
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/auth/types.ts lib/auth/browser.ts lib/auth/server.ts lib/auth/guards.ts
git commit -m "feat(auth): add lib/auth/ Supabase helpers (browser, server, guards)"
```

---

## Task 4: Create proxy.ts

**Files:**
- Create: `proxy.ts` (at project root, same level as `app/`)

- [ ] **Step 1: Create proxy.ts**

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PREFIXES = ['/login', '/api/', '/_next/', '/favicon']

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

function hasSupabaseSession(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'),
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  if (!hasSupabaseSession(request)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (Next.js static files)
     * - _next/image  (Next.js image optimisation)
     * - Files with extensions (e.g. .png, .svg, .glb)
     */
    '/((?!_next/static|_next/image|.*\\..*).*)',
  ],
}
```

**Note:** The proxy is optimistic — it checks only for the presence of a Supabase session cookie. If the cookie is present but the session is expired/invalid, the server-side `requireUser()` / `requireAdmin()` guards redirect again. This two-layer approach keeps the proxy fast (no database calls).

- [ ] **Step 2: Commit**

```bash
git add proxy.ts
git commit -m "feat(auth): add proxy.ts optimistic session redirect"
```

---

## Task 5: Create login page

**Files:**
- Create: `app/login/LoginForm.tsx`
- Create: `app/login/page.tsx`

- [ ] **Step 1: Create app/login/LoginForm.tsx**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/auth/browser'

function translateError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Nieprawidłowy email lub hasło.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Potwierdź adres email przed zalogowaniem.'
  }
  return 'Nie udało się zalogować. Spróbuj ponownie.'
}

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(translateError(signInError.message))
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-xs text-gray-400 uppercase tracking-wide">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="rounded-md bg-[#1e1e3a] border border-[#2a2a4e] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          placeholder="you@example.com"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-xs text-gray-400 uppercase tracking-wide">
          Hasło
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="rounded-md bg-[#1e1e3a] border border-[#2a2a4e] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-md bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Logowanie…' : 'Zaloguj się'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create app/login/page.tsx**

```typescript
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/auth/guards'
import { LoginForm } from './LoginForm'

export default async function LoginPage() {
  const profile = await getCurrentUserProfile()
  if (profile) redirect('/')

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#7c3aed] flex items-center justify-center">
            <span className="text-white text-lg font-bold">A</span>
          </div>
          <div className="text-center">
            <h1 className="text-white font-semibold text-lg tracking-wide">
              Anatomy Studio
            </h1>
            <p className="text-gray-500 text-xs mt-1">
              Interaktywny eksplorator anatomii 3D
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-xl bg-[#12122a] border border-[#2a2a4e] p-6">
          <h2 className="text-white text-sm font-semibold mb-4">Logowanie</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx app/login/LoginForm.tsx
git commit -m "feat(auth): add /login page with email/password form"
```

---

## Task 6: Create UserMenu + update app/page.tsx

**Files:**
- Create: `components/UserMenu/UserMenu.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create components/UserMenu/UserMenu.tsx**

```typescript
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/auth/browser'

interface UserMenuProps {
  email: string
  displayName: string | null
  isAdmin: boolean
}

export function UserMenu({ email, displayName, isAdmin }: UserMenuProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 max-w-[160px] truncate">
        {displayName ?? email}
      </span>

      {isAdmin && (
        <Link
          href="/admin/annotations"
          className="px-2 py-1 text-xs rounded bg-[#2a2a4e] text-[#a78bfa] hover:bg-[#3a3a6e] transition-colors"
        >
          Admin
        </Link>
      )}

      <button
        onClick={handleSignOut}
        className="px-2 py-1 text-xs rounded bg-[#2a2a4e] text-gray-400 hover:text-white hover:bg-[#3a3a6e] transition-colors"
      >
        Wyloguj
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Replace app/page.tsx**

Replace the full content of `app/page.tsx` with:

```typescript
import { requireUser } from '@/lib/auth/guards'
import { PanelLeft } from '@/components/PanelLeft/PanelLeft'
import { Viewer3D } from '@/components/Viewer3D/Viewer3D'
import { PanelRight } from '@/components/PanelRight/PanelRight'
import { PanelBottom } from '@/components/PanelBottom/PanelBottom'
import { UserMenu } from '@/components/UserMenu/UserMenu'

export default async function HomePage() {
  const profile = await requireUser()

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ===== HEADER ===== */}
      <header className="flex-shrink-0 h-12 bg-[#12122a] border-b border-[#2a2a4e] flex items-center px-6 gap-4 z-10">
        {/* Logo i nazwa aplikacji */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#7c3aed] flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">
            Anatomy Studio
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-[#2a2a4e]" />

        {/* Nawigacja główna */}
        <nav className="flex items-center gap-1">
          {['Explorer', 'Compare', 'Exam Mode'].map((item) => (
            <button
              key={item}
              className="px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-[#2a2a4e] rounded transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Prawa część headera — user menu */}
        <div className="ml-auto flex items-center gap-2">
          <UserMenu
            email={profile.email}
            displayName={profile.displayName}
            isAdmin={profile.role === 'admin'}
          />
        </div>
      </header>

      {/* ===== GŁÓWNA ZAWARTOŚĆ ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ===== LEWY PANEL (280px) ===== */}
        <PanelLeft />

        {/* ===== PRAWA STRONA (viewer + prawy panel + dolny pasek) ===== */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Środkowy rząd: viewer 3D + prawy panel */}
          <div className="flex flex-1 overflow-hidden">
            {/* ===== CENTRALNY VIEWER 3D ===== */}
            <main className="flex-1 relative overflow-hidden">
              <Viewer3D />
            </main>

            {/* ===== PRAWY PANEL (320px) ===== */}
            <PanelRight />
          </div>

          {/* ===== DOLNY PASEK (120px) ===== */}
          <PanelBottom />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/UserMenu/UserMenu.tsx app/page.tsx
git commit -m "feat(auth): add UserMenu component and require login on main page"
```

---

## Task 7: Replace NODE_ENV guards with admin role guards

**Files:**
- Modify: `app/admin/annotations/page.tsx`
- Modify: `app/api/admin/annotations/route.ts`

- [ ] **Step 1: Update app/admin/annotations/page.tsx**

Replace the full content of `app/admin/annotations/page.tsx` with:

```typescript
import { requireAdmin } from '@/lib/auth/guards'
import { AdminAnnotationEditor } from '@/components/AdminAnnotationEditor/AdminAnnotationEditor'

export default async function AdminAnnotationsPage() {
  await requireAdmin()
  return <AdminAnnotationEditor />
}
```

- [ ] **Step 2: Update app/api/admin/annotations/route.ts**

Replace the `rejectOutsideDevelopment` function and its usages with an async admin check. The new route file is:

```typescript
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { baseStructures } from '@/lib/anatomyData'
import {
  AnnotationStore,
  AnnotationStoreRecord,
  normalizeAnnotationStore,
} from '@/lib/annotationStore'
import { getCurrentUserProfile } from '@/lib/auth/guards'

const dataDirectory = path.join(process.cwd(), 'data')
const annotationsPath = path.join(dataDirectory, 'annotations.json')

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) {
    return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  }
  if (profile.role !== 'admin') {
    return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  }
  return null
}

async function readAnnotationStore(): Promise<AnnotationStore> {
  try {
    const raw = await readFile(annotationsPath, 'utf8')
    return normalizeAnnotationStore(JSON.parse(raw), Object.keys(baseStructures))
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return {}
    }

    throw error
  }
}

async function writeAnnotationStore(store: AnnotationStore) {
  await mkdir(dataDirectory, { recursive: true })

  const tmpPath = `${annotationsPath}.${Date.now()}.tmp`
  const content = `${JSON.stringify(store, null, 2)}\n`

  await writeFile(tmpPath, content, 'utf8')
  await rename(tmpPath, annotationsPath)
}

function compactStructures() {
  return Object.values(baseStructures).map((structure) => ({
    id: structure.id,
    namePL: structure.namePL,
    nameLAT: structure.nameLAT,
    system: structure.system,
    hasLayers: Boolean(structure.layers?.length),
  }))
}

export async function GET() {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected

  try {
    return Response.json({
      structures: compactStructures(),
      annotations: await readAnnotationStore(),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Nie udało się odczytać anotacji'

    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected

  let body: {
    structureId?: unknown
    annotations?: unknown
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Nieprawidłowy format JSON' }, { status: 400 })
  }

  if (typeof body.structureId !== 'string') {
    return Response.json({ error: 'Pole structureId jest wymagane' }, { status: 400 })
  }

  if (!Array.isArray(body.annotations)) {
    return Response.json({ error: 'Pole annotations musi być tablicą' }, { status: 400 })
  }

  try {
    const currentStore = await readAnnotationStore()
    const nextRawStore = {
      ...currentStore,
      [body.structureId]: body.annotations as AnnotationStoreRecord[],
    }
    const nextStore = normalizeAnnotationStore(nextRawStore, Object.keys(baseStructures))

    await writeAnnotationStore(nextStore)

    return Response.json({
      structureId: body.structureId,
      annotations: nextStore[body.structureId] ?? [],
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Nie udało się zapisać anotacji'

    return Response.json({ error: message }, { status: 400 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/annotations/page.tsx app/api/admin/annotations/route.ts
git commit -m "feat(auth): protect admin page and API with role=admin guard (replaces NODE_ENV)"
```

---

## Task 8: Update verify-admin-annotations.mjs for new guards

**Files:**
- Modify: `scripts/verify-admin-annotations.mjs`

The existing script checks that `process.env.NODE_ENV !== 'development'` appears in the route and that `notFound` appears in the admin page. Both are now false — we must update these assertions.

- [ ] **Step 1: Replace stale assertions in verify-admin-annotations.mjs**

In `scripts/verify-admin-annotations.mjs`, replace this block:

```js
const route = read('app/api/admin/annotations/route.ts')
assert(
  route.includes("process.env.NODE_ENV !== 'development'"),
  'admin route must reject non-development environments',
)
assert(route.includes('export async function GET'), 'admin route must export GET')
assert(route.includes('export async function PUT'), 'admin route must export PUT')
assert(route.includes('writeFile'), 'admin route must write a temporary file')
assert(route.includes('rename'), 'admin route must atomically rename the temporary file')

const viewerAnnotations = read('components/Viewer3D/Annotations.tsx')
assert(
  viewerAnnotations.includes('visible !== false'),
  'viewer annotations must skip hidden annotations',
)
assert(
  viewerAnnotations.includes('annotation.size'),
  'viewer annotations must use annotation.size',
)

const adminPage = read('app/admin/annotations/page.tsx')
assert(adminPage.includes('notFound'), 'admin page must hide outside development')
assert(
  adminPage.includes('AdminAnnotationEditor'),
  'admin page must render AdminAnnotationEditor in development',
)
```

with:

```js
const route = read('app/api/admin/annotations/route.ts')
assert(
  !route.includes("process.env.NODE_ENV !== 'development'"),
  'admin route must NOT use NODE_ENV guard (replaced by role-based auth)',
)
assert(
  route.includes('401') && route.includes('403'),
  'admin route must return 401 for missing session and 403 for non-admin',
)
assert(route.includes('export async function GET'), 'admin route must export GET')
assert(route.includes('export async function PUT'), 'admin route must export PUT')
assert(route.includes('writeFile'), 'admin route must write a temporary file')
assert(route.includes('rename'), 'admin route must atomically rename the temporary file')

const viewerAnnotations = read('components/Viewer3D/Annotations.tsx')
assert(
  viewerAnnotations.includes('visible !== false'),
  'viewer annotations must skip hidden annotations',
)
assert(
  viewerAnnotations.includes('annotation.size'),
  'viewer annotations must use annotation.size',
)

const adminPage = read('app/admin/annotations/page.tsx')
assert(
  adminPage.includes('requireAdmin'),
  'admin page must call requireAdmin() (role-based guard)',
)
assert(
  !adminPage.includes("NODE_ENV !== 'development'"),
  'admin page must NOT use NODE_ENV guard',
)
assert(
  adminPage.includes('AdminAnnotationEditor'),
  'admin page must render AdminAnnotationEditor',
)
```

- [ ] **Step 2: Commit**

```bash
git add scripts/verify-admin-annotations.mjs
git commit -m "test(auth): update verify-admin-annotations to check role guard instead of NODE_ENV"
```

---

## Task 9: GREEN — run all verifications + tsc + build

**Files:** None (verification only)

- [ ] **Step 1: Run verify:auth-admin**

```bash
npm run verify:auth-admin
```

Expected output: `✓ Auth/admin verification passed`

If it fails, read the error message and fix the specific file/assertion indicated.

- [ ] **Step 2: Run verify:admin-annotations**

```bash
npm run verify:admin-annotations
```

Expected output: `Admin annotation verification passed`

- [ ] **Step 3: TypeScript type-check**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors). Common issues to fix:
- Missing `NEXT_PUBLIC_SUPABASE_URL` type (it's a string, the `!` non-null assertion is intentional)
- Import path aliases (`@/lib/auth/...`) — these work if `tsconfig.json` has `paths` configured with `@/*`

If `@/*` paths aren't configured in `tsconfig.json`, check the existing imports in `app/page.tsx` — the project already uses `@/` aliases, so they are configured.

- [ ] **Step 4: Production build**

```bash
npm run build
```

Expected: successful build with no TypeScript or ESLint errors. Dynamic server-side usage (cookies, redirect) is expected and causes pages to be marked as dynamic — this is correct.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(auth): complete auth & admin access implementation"
```

---

## Manual Browser Verification Checklist

After running the dev server (`npm run dev`) with a real Supabase project in `.env.local`:

- [ ] Unauthenticated `/` redirects to `/login`
- [ ] Login form signs in a user and redirects to `/`
- [ ] Logged-in user sees their email/name in the header
- [ ] Non-admin user does NOT see the Admin link in the header
- [ ] Admin user sees the Admin link in the header
- [ ] Non-admin navigating to `/admin/annotations` is redirected to `/`
- [ ] Admin can reach `/admin/annotations` and use the annotation editor
- [ ] `GET /api/admin/annotations` as non-admin returns `403`
- [ ] `GET /api/admin/annotations` as unauthenticated returns `401`
- [ ] `GET /api/admin/annotations` as admin returns data
- [ ] Sign out button redirects to `/login` and clears session

---

## Known Limitations

- **No real Supabase project needed for build/tsc** — the build succeeds without `NEXT_PUBLIC_SUPABASE_URL` set because env vars are only read at runtime. Manual browser verification requires a real Supabase project.
- **Proxy is optimistic** — if a Supabase session cookie is present but expired, the proxy lets the request through. The server-side `requireUser()` then calls `getUser()` (which validates the JWT server-side via Supabase) and redirects to `/login`. No stale session reaches a protected page.
- **Cookie chunking** — `@supabase/ssr` may chunk large session tokens across multiple cookies, all named `sb-*-auth-token-*`. The proxy's cookie check `endsWith('-auth-token')` won't match chunks; if this causes false-redirects, expand the check to `c.name.includes('-auth-token')`.
