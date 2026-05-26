# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional admin panel at `/admin` with CRUD management for Nauka flashcards, reading materials, and Quiz questions, protected by `requireAdmin()`.

**Architecture:** 11 route handlers check admin role via `rejectNonAdmin()`, perform Supabase operations, and return JSON. Two large client components (`AdminNaukaPanel`, `AdminQuizPanel`) manage all UI state and call these handlers via `fetch`. Three server-component pages (`/admin`, `/admin/nauka`, `/admin/quiz`) gate access with `await requireAdmin()`.

**Tech Stack:** Next.js 16 App Router, Supabase SSR, TypeScript strict, inline styles (no Tailwind).

> **Note:** No test framework is configured in this project. Verification steps use `curl` (API) and browser navigation (UI) against `npm run dev` on `http://localhost:3000`.

---

## File Map

| Action | Path |
|--------|------|
| Create | `app/admin/page.tsx` |
| Create | `app/admin/nauka/page.tsx` |
| Create | `app/admin/quiz/page.tsx` |
| Create | `app/api/admin/nauka/flashcards/route.ts` |
| Create | `app/api/admin/nauka/flashcards/[id]/route.ts` |
| Create | `app/api/admin/nauka/readings/route.ts` |
| Create | `app/api/admin/nauka/readings/[id]/route.ts` |
| Create | `app/api/admin/nauka/readings/[id]/sections/route.ts` |
| Create | `app/api/admin/nauka/readings/[id]/sections/[sectionId]/route.ts` |
| Create | `app/api/admin/quiz/questions/route.ts` |
| Create | `app/api/admin/quiz/questions/[id]/route.ts` |
| Create | `components/Admin/AdminNaukaPanel.tsx` |
| Create | `components/Admin/AdminQuizPanel.tsx` |

---

## Task 1: Admin Hub Page

**Files:**
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Create the hub page**

```tsx
// app/admin/page.tsx
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
  ]

  return (
    <main style={{ maxWidth: 900, margin: '60px auto', padding: '0 24px', fontFamily: SANS }}>
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
```

- [ ] **Step 2: Verify**

With `npm run dev` running, navigate to `http://localhost:3000/admin` while logged in as admin. Expect three cards: Nauka, Quiz, Anotacje. Non-admin users should be redirected to `/`.

- [ ] **Step 3: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat(admin): add hub page with nav cards"
```

---

## Task 2: Nauka Flashcard API

**Files:**
- Create: `app/api/admin/nauka/flashcards/route.ts`
- Create: `app/api/admin/nauka/flashcards/[id]/route.ts`

- [ ] **Step 1: Create GET/POST route**

```ts
// app/api/admin/nauka/flashcards/route.ts
import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  return null
}

export async function GET() {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('flashcards')
      .select('id, question, answer, system, difficulty, mnemonic, details, struct')
      .order('id')
    if (error) throw new Error(error.message)
    return Response.json(data ?? [])
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 }) }
  const b = body as Record<string, unknown>
  if (!b.id || !b.question || !b.answer || !b.system || !b.difficulty) {
    return Response.json({ error: 'Wymagane pola: id, question, answer, system, difficulty' }, { status: 400 })
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        id: b.id as string,
        question: b.question as string,
        answer: b.answer as string,
        system: b.system as string,
        difficulty: b.difficulty as string,
        mnemonic: (b.mnemonic as string | undefined) ?? '',
        details: (b.details as string | undefined) ?? '',
        struct: (b.struct as string | undefined) ?? '',
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return Response.json(data, { status: 201 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create PUT/DELETE route**

```ts
// app/api/admin/nauka/flashcards/[id]/route.ts
import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  return null
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  const { id } = await params
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 }) }
  const b = body as Record<string, unknown>
  const update: Record<string, unknown> = {}
  for (const f of ['question', 'answer', 'system', 'difficulty', 'mnemonic', 'details', 'struct']) {
    if (b[f] !== undefined) update[f] = b[f]
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('flashcards')
      .update(update)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  const { id } = await params
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from('flashcards').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return new Response(null, { status: 204 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verify**

With dev server running and admin session cookie in browser, test with curl (or use the browser dev tools Network tab after Task 5 is done):

```bash
# Should return 403 without admin session
curl http://localhost:3000/api/admin/nauka/flashcards

# With valid admin cookie (copy from browser DevTools → Application → Cookies):
curl -H "Cookie: <your-session-cookie>" http://localhost:3000/api/admin/nauka/flashcards
# Expected: JSON array of flashcards
```

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/nauka/flashcards/route.ts app/api/admin/nauka/flashcards/[id]/route.ts
git commit -m "feat(admin): add flashcard CRUD API"
```

---

## Task 3: Nauka Readings API

**Files:**
- Create: `app/api/admin/nauka/readings/route.ts`
- Create: `app/api/admin/nauka/readings/[id]/route.ts`
- Create: `app/api/admin/nauka/readings/[id]/sections/route.ts`
- Create: `app/api/admin/nauka/readings/[id]/sections/[sectionId]/route.ts`

- [ ] **Step 1: Create readings GET/POST route**

```ts
// app/api/admin/nauka/readings/route.ts
import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  return null
}

export async function GET() {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('reading_materials')
      .select('id, sys, title, read_time, reading_sections(id, title, content, sort_order)')
      .order('sys')
    if (error) throw new Error(error.message)
    return Response.json(data ?? [])
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 }) }
  const b = body as Record<string, unknown>
  if (!b.sys || !b.title || b.read_time === undefined) {
    return Response.json({ error: 'Wymagane pola: sys, title, read_time' }, { status: 400 })
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('reading_materials')
      .insert({ sys: b.sys as string, title: b.title as string, read_time: b.read_time as number })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return Response.json(data, { status: 201 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create readings PUT/DELETE route**

```ts
// app/api/admin/nauka/readings/[id]/route.ts
import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  return null
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  const { id } = await params
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 }) }
  const b = body as Record<string, unknown>
  const update: Record<string, unknown> = {}
  if (b.sys !== undefined) update.sys = b.sys
  if (b.title !== undefined) update.title = b.title
  if (b.read_time !== undefined) update.read_time = b.read_time
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('reading_materials')
      .update(update)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  const { id } = await params
  try {
    const supabase = await createSupabaseServerClient()
    const { error: secErr } = await supabase.from('reading_sections').delete().eq('material_id', id)
    if (secErr) throw new Error(secErr.message)
    const { error } = await supabase.from('reading_materials').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return new Response(null, { status: 204 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create sections POST route**

```ts
// app/api/admin/nauka/readings/[id]/sections/route.ts
import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  return null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  const { id: materialId } = await params
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 }) }
  const b = body as Record<string, unknown>
  if (!b.id || !b.title || !b.content || b.sort_order === undefined) {
    return Response.json({ error: 'Wymagane pola: id, title, content, sort_order' }, { status: 400 })
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('reading_sections')
      .insert({
        id: b.id as string,
        material_id: materialId,
        title: b.title as string,
        content: b.content as string,
        sort_order: b.sort_order as number,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return Response.json(data, { status: 201 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Create sections PUT/DELETE route**

```ts
// app/api/admin/nauka/readings/[id]/sections/[sectionId]/route.ts
import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  return null
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  const { id: materialId, sectionId } = await params
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 }) }
  const b = body as Record<string, unknown>
  const update: Record<string, unknown> = {}
  if (b.title !== undefined) update.title = b.title
  if (b.content !== undefined) update.content = b.content
  if (b.sort_order !== undefined) update.sort_order = b.sort_order
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('reading_sections')
      .update(update)
      .eq('material_id', materialId)
      .eq('id', sectionId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  const { id: materialId, sectionId } = await params
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
      .from('reading_sections')
      .delete()
      .eq('material_id', materialId)
      .eq('id', sectionId)
    if (error) throw new Error(error.message)
    return new Response(null, { status: 204 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/nauka/readings/
git commit -m "feat(admin): add reading materials and sections CRUD API"
```

---

## Task 4: Quiz Questions API

**Files:**
- Create: `app/api/admin/quiz/questions/route.ts`
- Create: `app/api/admin/quiz/questions/[id]/route.ts`

- [ ] **Step 1: Create questions GET/POST route**

```ts
// app/api/admin/quiz/questions/route.ts
import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  return null
}

export async function GET() {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('id, type, structure_id, system_name, difficulty, question_text, options, correct_index, answer, image_target, hint, explanation, sort_order, is_active')
      .order('sort_order')
    if (error) throw new Error(error.message)
    return Response.json(data ?? [])
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 }) }
  const b = body as Record<string, unknown>
  if (!b.type || !b.system_name || !b.difficulty || !b.question_text) {
    return Response.json({ error: 'Wymagane pola: type, system_name, difficulty, question_text' }, { status: 400 })
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert({
        type: b.type as string,
        structure_id: (b.structure_id as string | undefined) ?? null,
        system_name: b.system_name as string,
        difficulty: b.difficulty as string,
        question_text: b.question_text as string,
        options: (b.options as string[] | undefined) ?? null,
        correct_index: (b.correct_index as number | undefined) ?? null,
        answer: (b.answer as string | undefined) ?? null,
        image_target: (b.image_target as string | undefined) ?? null,
        hint: (b.hint as string | undefined) ?? null,
        explanation: (b.explanation as string | undefined) ?? null,
        sort_order: (b.sort_order as number | undefined) ?? 0,
        is_active: (b.is_active as boolean | undefined) ?? true,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return Response.json(data, { status: 201 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create questions PUT/DELETE route**

```ts
// app/api/admin/quiz/questions/[id]/route.ts
import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  return null
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  const { id } = await params
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Nieprawidłowy JSON' }, { status: 400 }) }
  const b = body as Record<string, unknown>
  const update: Record<string, unknown> = {}
  const fields = [
    'type', 'structure_id', 'system_name', 'difficulty', 'question_text',
    'options', 'correct_index', 'answer', 'image_target',
    'hint', 'explanation', 'sort_order', 'is_active',
  ]
  for (const f of fields) { if (b[f] !== undefined) update[f] = b[f] }
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('quiz_questions')
      .update(update)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected
  const { id } = await params
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from('quiz_questions').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return new Response(null, { status: 204 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Błąd serwera' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/quiz/questions/route.ts app/api/admin/quiz/questions/[id]/route.ts
git commit -m "feat(admin): add quiz questions CRUD API"
```

---

## Task 5: AdminNaukaPanel Component

**Files:**
- Create: `components/Admin/AdminNaukaPanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/Admin/AdminNaukaPanel.tsx
'use client'

import { useEffect, useState } from 'react'
import { NAUKA_SYSTEMS } from '@/lib/naukaData'

// ── Types ──────────────────────────────────────────────────────────────────

interface DbFlashcard {
  id: string
  question: string
  answer: string
  system: string
  difficulty: 'basic' | 'intermediate' | 'advanced'
  mnemonic: string
  details: string
  struct: string
}

interface DbSection {
  id: string
  title: string
  content: string
  sort_order: number
}

interface DbReadingMaterialAdmin {
  id: string
  sys: string
  title: string
  read_time: number
  reading_sections: DbSection[]
}

// ── Constants ──────────────────────────────────────────────────────────────

const NK = '#2a7a60'
const CARD_BG = '#fbf7ee'
const CARD_BORDER = 'rgba(91,78,60,0.14)'
const TEXT_MAIN = '#28231c'
const TEXT_MID = '#80786d'
const SERIF = '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif'
const SANS = 'Inter,sans-serif'
const SYSTEMS = NAUKA_SYSTEMS.filter(s => s.name !== 'Wszystkie układy').map(s => s.name)

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7,
  border: `1.5px solid ${CARD_BORDER}`, fontFamily: SANS,
  fontSize: 13.5, color: TEXT_MAIN, background: '#fafafa', boxSizing: 'border-box',
}
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 80, resize: 'vertical' }
const actionBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 13, fontFamily: SANS, fontWeight: 600, padding: '2px 6px',
}

// ── Helpers ────────────────────────────────────────────────────────────────

const blankFC = (): Partial<DbFlashcard> => ({
  id: '', question: '', answer: '', system: SYSTEMS[0],
  difficulty: 'basic', mnemonic: '', details: '', struct: '',
})
const blankMaterial = () => ({ sys: SYSTEMS[0], title: '', read_time: 5 })
const blankSection = () => ({ id: '', title: '', content: '', sort_order: 0 })

// ── Shared UI ──────────────────────────────────────────────────────────────

function Overlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, cursor: 'pointer' }}
    />
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <Overlay onClose={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', borderRadius: 12, padding: 28, width: 520,
        maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto',
        zIndex: 101, boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontFamily: SERIF, fontSize: 20, color: TEXT_MAIN }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: TEXT_MID }}>×</button>
        </div>
        {children}
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: TEXT_MID, fontFamily: SANS, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

function Btn({ children, onClick, disabled, variant = 'primary' }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' | 'danger'
}) {
  const bg = variant === 'danger' ? '#e05252' : variant === 'ghost' ? 'transparent' : NK
  const color = variant === 'ghost' ? TEXT_MID : '#fff'
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      style={{
        padding: '7px 16px', borderRadius: 7, background: bg, color,
        border: variant === 'ghost' ? `1.5px solid ${CARD_BORDER}` : 'none',
        fontFamily: SANS, fontSize: 13, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div style={{ color: '#c0392b', background: '#fdecea', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13.5 }}>
      {msg}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function AdminNaukaPanel() {
  const [tab, setTab] = useState<'flashcards' | 'readings'>('flashcards')

  // Flashcards state
  const [flashcards, setFlashcards] = useState<DbFlashcard[]>([])
  const [loadingFC, setLoadingFC] = useState(false)
  const [errorFC, setErrorFC] = useState<string | null>(null)
  const [fcModal, setFcModal] = useState<'add' | 'edit' | null>(null)
  const [editingFC, setEditingFC] = useState<DbFlashcard | null>(null)
  const [fcForm, setFcForm] = useState<Partial<DbFlashcard>>(blankFC())
  const [savingFC, setSavingFC] = useState(false)
  const [formErrFC, setFormErrFC] = useState<string | null>(null)

  // Readings state
  const [readings, setReadings] = useState<DbReadingMaterialAdmin[]>([])
  const [loadingRM, setLoadingRM] = useState(false)
  const [errorRM, setErrorRM] = useState<string | null>(null)
  const [expandedRM, setExpandedRM] = useState<Set<string>>(new Set())
  const [rmModal, setRmModal] = useState<'add' | 'edit' | null>(null)
  const [editingRM, setEditingRM] = useState<DbReadingMaterialAdmin | null>(null)
  const [rmForm, setRmForm] = useState(blankMaterial())
  const [savingRM, setSavingRM] = useState(false)
  const [formErrRM, setFormErrRM] = useState<string | null>(null)
  const [secModal, setSecModal] = useState<{ materialId: string; mode: 'add' | 'edit' } | null>(null)
  const [editingSec, setEditingSec] = useState<DbSection | null>(null)
  const [secForm, setSecForm] = useState(blankSection())
  const [savingSec, setSavingSec] = useState(false)
  const [formErrSec, setFormErrSec] = useState<string | null>(null)

  async function loadFlashcards() {
    setLoadingFC(true); setErrorFC(null)
    try {
      const res = await fetch('/api/admin/nauka/flashcards')
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      setFlashcards(await res.json())
    } catch (e) { setErrorFC(e instanceof Error ? e.message : 'Błąd') }
    finally { setLoadingFC(false) }
  }

  async function loadReadings() {
    setLoadingRM(true); setErrorRM(null)
    try {
      const res = await fetch('/api/admin/nauka/readings')
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      setReadings(await res.json())
    } catch (e) { setErrorRM(e instanceof Error ? e.message : 'Błąd') }
    finally { setLoadingRM(false) }
  }

  useEffect(() => { loadFlashcards() }, [])
  useEffect(() => { if (tab === 'readings') loadReadings() }, [tab])

  // ── Flashcard CRUD ──

  function openAddFC() { setEditingFC(null); setFcForm(blankFC()); setFormErrFC(null); setFcModal('add') }
  function openEditFC(fc: DbFlashcard) { setEditingFC(fc); setFcForm({ ...fc }); setFormErrFC(null); setFcModal('edit') }

  async function saveFC() {
    if (!fcForm.id?.trim() || !fcForm.question?.trim() || !fcForm.answer?.trim()) {
      setFormErrFC('Pola id, pytanie i odpowiedź są wymagane'); return
    }
    setSavingFC(true); setFormErrFC(null)
    try {
      const url = fcModal === 'edit' ? `/api/admin/nauka/flashcards/${editingFC!.id}` : '/api/admin/nauka/flashcards'
      const res = await fetch(url, {
        method: fcModal === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fcForm),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      setFcModal(null); await loadFlashcards()
    } catch (e) { setFormErrFC(e instanceof Error ? e.message : 'Błąd') }
    finally { setSavingFC(false) }
  }

  async function deleteFC(id: string) {
    if (!window.confirm('Usunąć tę fiszkę?')) return
    try {
      const res = await fetch(`/api/admin/nauka/flashcards/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      await loadFlashcards()
    } catch (e) { setErrorFC(e instanceof Error ? e.message : 'Błąd') }
  }

  // ── Reading CRUD ──

  function openAddRM() { setEditingRM(null); setRmForm(blankMaterial()); setFormErrRM(null); setRmModal('add') }
  function openEditRM(rm: DbReadingMaterialAdmin) {
    setEditingRM(rm); setRmForm({ sys: rm.sys, title: rm.title, read_time: rm.read_time })
    setFormErrRM(null); setRmModal('edit')
  }

  async function saveRM() {
    if (!rmForm.title.trim()) { setFormErrRM('Tytuł jest wymagany'); return }
    setSavingRM(true); setFormErrRM(null)
    try {
      const url = rmModal === 'edit' ? `/api/admin/nauka/readings/${editingRM!.id}` : '/api/admin/nauka/readings'
      const res = await fetch(url, {
        method: rmModal === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rmForm),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      setRmModal(null); await loadReadings()
    } catch (e) { setFormErrRM(e instanceof Error ? e.message : 'Błąd') }
    finally { setSavingRM(false) }
  }

  async function deleteRM(id: string) {
    if (!window.confirm('Usunąć ten materiał i wszystkie jego sekcje?')) return
    try {
      const res = await fetch(`/api/admin/nauka/readings/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      await loadReadings()
    } catch (e) { setErrorRM(e instanceof Error ? e.message : 'Błąd') }
  }

  function toggleExpandRM(id: string) {
    setExpandedRM(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // ── Section CRUD ──

  function openAddSec(materialId: string) {
    setEditingSec(null); setSecForm(blankSection()); setFormErrSec(null)
    setSecModal({ materialId, mode: 'add' })
  }
  function openEditSec(materialId: string, sec: DbSection) {
    setEditingSec(sec)
    setSecForm({ id: sec.id, title: sec.title, content: sec.content, sort_order: sec.sort_order })
    setFormErrSec(null); setSecModal({ materialId, mode: 'edit' })
  }

  async function saveSec() {
    if (!secForm.id.trim() || !secForm.title.trim() || !secForm.content.trim()) {
      setFormErrSec('Pola id, tytuł i treść są wymagane'); return
    }
    setSavingSec(true); setFormErrSec(null)
    const { materialId, mode } = secModal!
    try {
      const url = mode === 'edit'
        ? `/api/admin/nauka/readings/${materialId}/sections/${editingSec!.id}`
        : `/api/admin/nauka/readings/${materialId}/sections`
      const res = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secForm),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      setSecModal(null); await loadReadings()
    } catch (e) { setFormErrSec(e instanceof Error ? e.message : 'Błąd') }
    finally { setSavingSec(false) }
  }

  async function deleteSec(materialId: string, sectionId: string) {
    if (!window.confirm('Usunąć tę sekcję?')) return
    try {
      const res = await fetch(`/api/admin/nauka/readings/${materialId}/sections/${sectionId}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      await loadReadings()
    } catch (e) { setErrorRM(e instanceof Error ? e.message : 'Błąd') }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', fontFamily: SANS }}>
      <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: TEXT_MAIN, margin: '0 0 8px' }}>
        Nauka — Panel admina
      </h1>
      <a href="/admin" style={{ fontSize: 13, color: NK, textDecoration: 'none', display: 'inline-block', marginBottom: 28 }}>
        ← Panel admina
      </a>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${CARD_BORDER}`, marginBottom: 28 }}>
        {(['flashcards', 'readings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: SANS, fontSize: 14, fontWeight: 600,
            color: tab === t ? NK : TEXT_MID,
            borderBottom: tab === t ? `2.5px solid ${NK}` : '2.5px solid transparent',
            marginBottom: -2,
          }}>
            {t === 'flashcards' ? 'Fiszki' : 'Materiały'}
          </button>
        ))}
      </div>

      {/* ── Flashcards Tab ── */}
      {tab === 'flashcards' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 20, color: TEXT_MAIN }}>Fiszki</h2>
            <Btn onClick={openAddFC}>+ Dodaj fiszkę</Btn>
          </div>
          {errorFC && <ErrorBanner msg={errorFC} />}
          {loadingFC ? (
            <p style={{ color: TEXT_MID }}>Ładowanie…</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${CARD_BORDER}` }}>
                    {['ID', 'System', 'Poziom', 'Struktura', 'Pytanie', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: TEXT_MID, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flashcards.map(fc => (
                    <tr key={fc.id} style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
                      <td style={{ padding: '8px 10px', color: TEXT_MID, fontFamily: 'monospace', fontSize: 12 }}>{fc.id}</td>
                      <td style={{ padding: '8px 10px' }}>{fc.system}</td>
                      <td style={{ padding: '8px 10px' }}>{fc.difficulty}</td>
                      <td style={{ padding: '8px 10px', color: TEXT_MID }}>{fc.struct || '—'}</td>
                      <td style={{ padding: '8px 10px', maxWidth: 280 }} title={fc.question}>
                        {fc.question.length > 60 ? fc.question.slice(0, 60) + '…' : fc.question}
                      </td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        <button onClick={() => openEditFC(fc)} style={{ ...actionBtnStyle, color: NK }}>Edytuj</button>
                        <button onClick={() => deleteFC(fc.id)} style={{ ...actionBtnStyle, color: '#e05252', marginLeft: 6 }}>Usuń</button>
                      </td>
                    </tr>
                  ))}
                  {!flashcards.length && (
                    <tr><td colSpan={6} style={{ padding: '24px 10px', color: TEXT_MID, textAlign: 'center' }}>Brak fiszek</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Readings Tab ── */}
      {tab === 'readings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 20, color: TEXT_MAIN }}>Materiały do czytania</h2>
            <Btn onClick={openAddRM}>+ Dodaj materiał</Btn>
          </div>
          {errorRM && <ErrorBanner msg={errorRM} />}
          {loadingRM ? (
            <p style={{ color: TEXT_MID }}>Ładowanie…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {readings.map(rm => (
                <div key={rm.id} style={{ background: CARD_BG, border: `1.5px solid ${CARD_BORDER}`, borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
                    <button onClick={() => toggleExpandRM(rm.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: TEXT_MID }}>
                      {expandedRM.has(rm.id) ? '▼' : '▶'}
                    </button>
                    <span style={{ flex: 1, fontWeight: 600, color: TEXT_MAIN, fontSize: 14 }}>{rm.title}</span>
                    <span style={{ fontSize: 12.5, color: TEXT_MID }}>{rm.sys} · {rm.read_time} min</span>
                    <button onClick={() => openEditRM(rm)} style={{ ...actionBtnStyle, color: NK }}>Edytuj</button>
                    <button onClick={() => deleteRM(rm.id)} style={{ ...actionBtnStyle, color: '#e05252' }}>Usuń</button>
                  </div>
                  {expandedRM.has(rm.id) && (
                    <div style={{ borderTop: `1px solid ${CARD_BORDER}`, padding: '12px 16px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_MID }}>Sekcje ({rm.reading_sections.length})</span>
                        <button onClick={() => openAddSec(rm.id)} style={{ ...actionBtnStyle, color: NK, fontWeight: 700 }}>+ Dodaj sekcję</button>
                      </div>
                      {[...rm.reading_sections].sort((a, b) => a.sort_order - b.sort_order).map(sec => (
                        <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${CARD_BORDER}` }}>
                          <span style={{ flex: 1, fontSize: 13, color: TEXT_MAIN }}>{sec.title}</span>
                          <span style={{ fontSize: 12, color: TEXT_MID }}>#{sec.sort_order}</span>
                          <button onClick={() => openEditSec(rm.id, sec)} style={{ ...actionBtnStyle, color: NK }}>Edytuj</button>
                          <button onClick={() => deleteSec(rm.id, sec.id)} style={{ ...actionBtnStyle, color: '#e05252' }}>Usuń</button>
                        </div>
                      ))}
                      {!rm.reading_sections.length && <p style={{ fontSize: 13, color: TEXT_MID, margin: 0 }}>Brak sekcji</p>}
                    </div>
                  )}
                </div>
              ))}
              {!readings.length && <p style={{ color: TEXT_MID }}>Brak materiałów</p>}
            </div>
          )}
        </div>
      )}

      {/* ── Flashcard Modal ── */}
      {fcModal && (
        <Modal title={fcModal === 'add' ? 'Dodaj fiszkę' : 'Edytuj fiszkę'} onClose={() => setFcModal(null)}>
          {formErrFC && <ErrorBanner msg={formErrFC} />}
          <Field label="ID *">
            <input style={inputStyle} value={fcForm.id ?? ''} disabled={fcModal === 'edit'}
              onChange={e => setFcForm(f => ({ ...f, id: e.target.value }))} />
          </Field>
          <Field label="System *">
            <select style={inputStyle} value={fcForm.system ?? SYSTEMS[0]}
              onChange={e => setFcForm(f => ({ ...f, system: e.target.value }))}>
              {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Poziom trudności *">
            <select style={inputStyle} value={fcForm.difficulty ?? 'basic'}
              onChange={e => setFcForm(f => ({ ...f, difficulty: e.target.value as DbFlashcard['difficulty'] }))}>
              <option value="basic">Podstawowy</option>
              <option value="intermediate">Średniozaawansowany</option>
              <option value="advanced">Zaawansowany</option>
            </select>
          </Field>
          <Field label="Struktura">
            <input style={inputStyle} value={fcForm.struct ?? ''}
              onChange={e => setFcForm(f => ({ ...f, struct: e.target.value }))} />
          </Field>
          <Field label="Pytanie *">
            <textarea style={textareaStyle} value={fcForm.question ?? ''}
              onChange={e => setFcForm(f => ({ ...f, question: e.target.value }))} />
          </Field>
          <Field label="Odpowiedź *">
            <textarea style={textareaStyle} value={fcForm.answer ?? ''}
              onChange={e => setFcForm(f => ({ ...f, answer: e.target.value }))} />
          </Field>
          <Field label="Mnemonic">
            <textarea style={textareaStyle} value={fcForm.mnemonic ?? ''}
              onChange={e => setFcForm(f => ({ ...f, mnemonic: e.target.value }))} />
          </Field>
          <Field label="Szczegóły">
            <textarea style={textareaStyle} value={fcForm.details ?? ''}
              onChange={e => setFcForm(f => ({ ...f, details: e.target.value }))} />
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setFcModal(null)}>Anuluj</Btn>
            <Btn onClick={saveFC} disabled={savingFC}>{savingFC ? 'Zapisywanie…' : 'Zapisz'}</Btn>
          </div>
        </Modal>
      )}

      {/* ── Reading Material Modal ── */}
      {rmModal && (
        <Modal title={rmModal === 'add' ? 'Dodaj materiał' : 'Edytuj materiał'} onClose={() => setRmModal(null)}>
          {formErrRM && <ErrorBanner msg={formErrRM} />}
          <Field label="Układ *">
            <select style={inputStyle} value={rmForm.sys}
              onChange={e => setRmForm(f => ({ ...f, sys: e.target.value }))}>
              {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Tytuł *">
            <input style={inputStyle} value={rmForm.title}
              onChange={e => setRmForm(f => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Czas czytania (min) *">
            <input style={inputStyle} type="number" min={1} value={rmForm.read_time}
              onChange={e => setRmForm(f => ({ ...f, read_time: Number(e.target.value) }))} />
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setRmModal(null)}>Anuluj</Btn>
            <Btn onClick={saveRM} disabled={savingRM}>{savingRM ? 'Zapisywanie…' : 'Zapisz'}</Btn>
          </div>
        </Modal>
      )}

      {/* ── Section Modal ── */}
      {secModal && (
        <Modal title={secModal.mode === 'add' ? 'Dodaj sekcję' : 'Edytuj sekcję'} onClose={() => setSecModal(null)}>
          {formErrSec && <ErrorBanner msg={formErrSec} />}
          <Field label="ID (slug) *">
            <input style={inputStyle} value={secForm.id} disabled={secModal.mode === 'edit'}
              onChange={e => setSecForm(f => ({ ...f, id: e.target.value }))} />
          </Field>
          <Field label="Tytuł *">
            <input style={inputStyle} value={secForm.title}
              onChange={e => setSecForm(f => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Treść *">
            <textarea style={{ ...textareaStyle, minHeight: 160 }} value={secForm.content}
              onChange={e => setSecForm(f => ({ ...f, content: e.target.value }))} />
          </Field>
          <Field label="Kolejność">
            <input style={inputStyle} type="number" value={secForm.sort_order}
              onChange={e => setSecForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setSecModal(null)}>Anuluj</Btn>
            <Btn onClick={saveSec} disabled={savingSec}>{savingSec ? 'Zapisywanie…' : 'Zapisz'}</Btn>
          </div>
        </Modal>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Admin/AdminNaukaPanel.tsx
git commit -m "feat(admin): add AdminNaukaPanel client component"
```

---

## Task 6: Nauka Admin Page

**Files:**
- Create: `app/admin/nauka/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/admin/nauka/page.tsx
import { requireAdmin } from '@/lib/auth/guards'
import { AdminNaukaPanel } from '@/components/Admin/AdminNaukaPanel'

export default async function AdminNaukaPage() {
  await requireAdmin()
  return <AdminNaukaPanel />
}
```

- [ ] **Step 2: Verify**

Navigate to `http://localhost:3000/admin/nauka` as admin. Expect:
- "Nauka — Panel admina" heading with "← Panel admina" back link
- Two tabs: Fiszki | Materiały
- Fiszki tab loads and shows table of flashcards
- "Dodaj fiszkę" opens modal; filling required fields and saving creates a new row
- Edit and Usuń buttons work per row (Usuń asks for confirmation)
- Switching to Materiały tab loads reading materials accordion
- Expanding a material shows its sections with add/edit/delete controls

- [ ] **Step 3: Commit**

```bash
git add app/admin/nauka/page.tsx
git commit -m "feat(admin): add Nauka admin page"
```

---

## Task 7: AdminQuizPanel Component

**Files:**
- Create: `components/Admin/AdminQuizPanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/Admin/AdminQuizPanel.tsx
'use client'

import { useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

interface DbQuizQuestion {
  id: string
  type: 'mcq' | 'fill' | 'image'
  structure_id: string | null
  system_name: string
  difficulty: 'łatwy' | 'średni' | 'trudny'
  question_text: string
  options: string[] | null
  correct_index: number | null
  answer: string | null
  image_target: string | null
  hint: string | null
  explanation: string | null
  sort_order: number
  is_active: boolean
}

interface QForm {
  type: 'mcq' | 'fill' | 'image'
  system_name: string
  difficulty: 'łatwy' | 'średni' | 'trudny'
  question_text: string
  options: string[]
  correct_index: number | null
  answer: string
  image_target: string
  hint: string
  explanation: string
  sort_order: number
  is_active: boolean
}

// ── Constants ──────────────────────────────────────────────────────────────

const QZ = '#7c3aed'
const CARD_BORDER = 'rgba(91,78,60,0.14)'
const TEXT_MAIN = '#28231c'
const TEXT_MID = '#80786d'
const SERIF = '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif'
const SANS = 'Inter,sans-serif'

const QUIZ_SYSTEMS = ['Układ Krążenia', 'Układ Oddechowy', 'Układ Pokarmowy', 'OUN', 'Układ Moczowy', 'Wszystkie']

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7,
  border: `1.5px solid ${CARD_BORDER}`, fontFamily: SANS,
  fontSize: 13.5, color: TEXT_MAIN, background: '#fafafa', boxSizing: 'border-box',
}
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 80, resize: 'vertical' }
const actionBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 13, fontFamily: SANS, fontWeight: 600, padding: '2px 6px',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function blankForm(): QForm {
  return {
    type: 'mcq', system_name: QUIZ_SYSTEMS[0], difficulty: 'łatwy',
    question_text: '', options: ['', ''], correct_index: 0,
    answer: '', image_target: '', hint: '', explanation: '',
    sort_order: 0, is_active: true,
  }
}

function formFromQuestion(q: DbQuizQuestion): QForm {
  return {
    type: q.type, system_name: q.system_name, difficulty: q.difficulty,
    question_text: q.question_text, options: q.options ?? ['', ''],
    correct_index: q.correct_index, answer: q.answer ?? '',
    image_target: q.image_target ?? '', hint: q.hint ?? '',
    explanation: q.explanation ?? '', sort_order: q.sort_order, is_active: q.is_active,
  }
}

// ── Shared UI ──────────────────────────────────────────────────────────────

function Overlay({ onClose }: { onClose: () => void }) {
  return <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, cursor: 'pointer' }} />
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <Overlay onClose={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', borderRadius: 12, padding: 28, width: 560,
        maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto',
        zIndex: 101, boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontFamily: SERIF, fontSize: 20, color: TEXT_MAIN }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: TEXT_MID }}>×</button>
        </div>
        {children}
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: TEXT_MID, fontFamily: SANS, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

function Btn({ children, onClick, disabled, variant = 'primary' }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'ghost'
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      padding: '7px 16px', borderRadius: 7,
      background: variant === 'ghost' ? 'transparent' : QZ,
      color: variant === 'ghost' ? TEXT_MID : '#fff',
      border: variant === 'ghost' ? `1.5px solid ${CARD_BORDER}` : 'none',
      fontFamily: SANS, fontSize: 13, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
    }}>
      {children}
    </button>
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return <div style={{ color: '#c0392b', background: '#fdecea', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13.5 }}>{msg}</div>
}

// ── Main Component ─────────────────────────────────────────────────────────

export function AdminQuizPanel() {
  const [questions, setQuestions] = useState<DbQuizQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editingQ, setEditingQ] = useState<DbQuizQuestion | null>(null)
  const [form, setForm] = useState<QForm>(blankForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [filters, setFilters] = useState({ type: '', system: '', difficulty: '', active: '' })

  async function loadQuestions() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/quiz/questions')
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      setQuestions(await res.json())
    } catch (e) { setError(e instanceof Error ? e.message : 'Błąd') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadQuestions() }, [])

  function openAdd() { setEditingQ(null); setForm(blankForm()); setFormError(null); setModal('add') }
  function openEdit(q: DbQuizQuestion) { setEditingQ(q); setForm(formFromQuestion(q)); setFormError(null); setModal('edit') }

  async function save() {
    if (!form.question_text.trim()) { setFormError('Treść pytania jest wymagana'); return }
    if (form.type === 'mcq') {
      if (form.options.some(o => !o.trim())) { setFormError('Wszystkie opcje MCQ muszą być wypełnione'); return }
      if (form.correct_index === null) { setFormError('Wybierz poprawną odpowiedź'); return }
    }
    if ((form.type === 'fill' || form.type === 'image') && !form.answer.trim()) {
      setFormError('Pole odpowiedź jest wymagane'); return
    }
    setSaving(true); setFormError(null)
    try {
      const url = modal === 'edit' ? `/api/admin/quiz/questions/${editingQ!.id}` : '/api/admin/quiz/questions'
      const body: Record<string, unknown> = {
        type: form.type, system_name: form.system_name, difficulty: form.difficulty,
        question_text: form.question_text, hint: form.hint || null,
        explanation: form.explanation || null, sort_order: form.sort_order, is_active: form.is_active,
        options: form.type === 'mcq' ? form.options : null,
        correct_index: form.type === 'mcq' ? form.correct_index : null,
        answer: (form.type === 'fill' || form.type === 'image') ? form.answer : null,
        image_target: form.type === 'image' ? form.image_target || null : null,
      }
      const res = await fetch(url, {
        method: modal === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      setModal(null); await loadQuestions()
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Błąd') }
    finally { setSaving(false) }
  }

  async function deleteQ(id: string) {
    if (!window.confirm('Usunąć to pytanie?')) return
    try {
      const res = await fetch(`/api/admin/quiz/questions/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      await loadQuestions()
    } catch (e) { setError(e instanceof Error ? e.message : 'Błąd') }
  }

  async function toggleActive(q: DbQuizQuestion) {
    const next = !q.is_active
    setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, is_active: next } : x))
    try {
      const res = await fetch(`/api/admin/quiz/questions/${q.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      })
      if (!res.ok) {
        setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, is_active: q.is_active } : x))
        const d = await res.json(); setError(d.error ?? 'Błąd przy zmianie statusu')
      }
    } catch (e) {
      setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, is_active: q.is_active } : x))
      setError(e instanceof Error ? e.message : 'Błąd')
    }
  }

  const filtered = questions.filter(q => {
    if (filters.type && q.type !== filters.type) return false
    if (filters.system && q.system_name !== filters.system) return false
    if (filters.difficulty && q.difficulty !== filters.difficulty) return false
    if (filters.active === 'active' && !q.is_active) return false
    if (filters.active === 'inactive' && q.is_active) return false
    return true
  })

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', fontFamily: SANS }}>
      <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: TEXT_MAIN, margin: '0 0 8px' }}>
        Quiz — Panel admina
      </h1>
      <a href="/admin" style={{ fontSize: 13, color: QZ, textDecoration: 'none', display: 'inline-block', marginBottom: 28 }}>
        ← Panel admina
      </a>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <select style={{ ...inputStyle, width: 'auto' }} value={filters.type}
          onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
          <option value="">Wszystkie typy</option>
          <option value="mcq">MCQ</option>
          <option value="fill">Uzupełnij</option>
          <option value="image">Obraz</option>
        </select>
        <select style={{ ...inputStyle, width: 'auto' }} value={filters.system}
          onChange={e => setFilters(f => ({ ...f, system: e.target.value }))}>
          <option value="">Wszystkie układy</option>
          {QUIZ_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={{ ...inputStyle, width: 'auto' }} value={filters.difficulty}
          onChange={e => setFilters(f => ({ ...f, difficulty: e.target.value }))}>
          <option value="">Wszystkie poziomy</option>
          <option value="łatwy">Łatwy</option>
          <option value="średni">Średni</option>
          <option value="trudny">Trudny</option>
        </select>
        <select style={{ ...inputStyle, width: 'auto' }} value={filters.active}
          onChange={e => setFilters(f => ({ ...f, active: e.target.value }))}>
          <option value="">Wszystkie statusy</option>
          <option value="active">Aktywne</option>
          <option value="inactive">Nieaktywne</option>
        </select>
        <div style={{ flex: 1 }} />
        <Btn onClick={openAdd}>+ Dodaj pytanie</Btn>
      </div>

      {error && <ErrorBanner msg={error} />}

      {loading ? <p style={{ color: TEXT_MID }}>Ładowanie…</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${CARD_BORDER}` }}>
                {['Pytanie', 'Typ', 'Układ', 'Poziom', 'Status', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: TEXT_MID, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id} style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
                  <td style={{ padding: '8px 10px', maxWidth: 300 }} title={q.question_text}>
                    {q.question_text.length > 70 ? q.question_text.slice(0, 70) + '…' : q.question_text}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ background: '#ede8ff', color: QZ, borderRadius: 5, padding: '2px 7px', fontSize: 12, fontWeight: 600 }}>{q.type}</span>
                  </td>
                  <td style={{ padding: '8px 10px', color: TEXT_MID, fontSize: 12.5 }}>{q.system_name}</td>
                  <td style={{ padding: '8px 10px', color: TEXT_MID }}>{q.difficulty}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{
                      background: q.is_active ? '#d4f5e9' : '#f0f0f0',
                      color: q.is_active ? '#1a7a52' : TEXT_MID,
                      borderRadius: 5, padding: '2px 7px', fontSize: 12, fontWeight: 600,
                    }}>
                      {q.is_active ? 'Aktywne' : 'Nieaktywne'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => toggleActive(q)} style={{ ...actionBtnStyle, color: q.is_active ? TEXT_MID : '#1a7a52' }}>
                      {q.is_active ? 'Dezaktywuj' : 'Aktywuj'}
                    </button>
                    <button onClick={() => openEdit(q)} style={{ ...actionBtnStyle, color: QZ, marginLeft: 4 }}>Edytuj</button>
                    <button onClick={() => deleteQ(q.id)} style={{ ...actionBtnStyle, color: '#e05252', marginLeft: 4 }}>Usuń</button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={6} style={{ padding: '24px 10px', color: TEXT_MID, textAlign: 'center' }}>Brak pytań</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Question Modal ── */}
      {modal && (
        <Modal title={modal === 'add' ? 'Dodaj pytanie' : 'Edytuj pytanie'} onClose={() => setModal(null)}>
          {formError && <ErrorBanner msg={formError} />}
          <Field label="Typ *">
            <select style={inputStyle} value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as QForm['type'], options: ['', ''], correct_index: 0 }))}>
              <option value="mcq">MCQ (wybór)</option>
              <option value="fill">Uzupełnij lukę</option>
              <option value="image">Obraz</option>
            </select>
          </Field>
          <Field label="Układ anatomiczny *">
            <select style={inputStyle} value={form.system_name}
              onChange={e => setForm(f => ({ ...f, system_name: e.target.value }))}>
              {QUIZ_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Poziom trudności *">
            <select style={inputStyle} value={form.difficulty}
              onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as QForm['difficulty'] }))}>
              <option value="łatwy">Łatwy</option>
              <option value="średni">Średni</option>
              <option value="trudny">Trudny</option>
            </select>
          </Field>
          <Field label="Treść pytania *">
            <textarea style={textareaStyle} value={form.question_text}
              onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} />
          </Field>

          {form.type === 'mcq' && (
            <Field label="Opcje odpowiedzi * (zaznacz poprawną)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {form.options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="radio" name="correct_index" title="Poprawna odpowiedź"
                      checked={form.correct_index === i}
                      onChange={() => setForm(f => ({ ...f, correct_index: i }))}
                      style={{ flexShrink: 0 }} />
                    <input style={{ ...inputStyle, flex: 1 }} value={opt} placeholder={`Opcja ${i + 1}`}
                      onChange={e => {
                        const opts = [...form.options]; opts[i] = e.target.value
                        setForm(f => ({ ...f, options: opts }))
                      }} />
                    {form.options.length > 2 && (
                      <button type="button" onClick={() => {
                        const opts = form.options.filter((_, j) => j !== i)
                        const ci = form.correct_index !== null && form.correct_index >= opts.length
                          ? opts.length - 1 : form.correct_index
                        setForm(f => ({ ...f, options: opts, correct_index: ci }))
                      }} style={{ background: 'none', border: 'none', color: '#e05252', cursor: 'pointer', fontSize: 18 }}>×</button>
                    )}
                  </div>
                ))}
                {form.options.length < 6 && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, options: [...f.options, ''] }))}
                    style={{ alignSelf: 'flex-start', background: 'none', border: `1.5px dashed ${CARD_BORDER}`, borderRadius: 7, padding: '5px 12px', color: TEXT_MID, cursor: 'pointer', fontSize: 13 }}>
                    + Dodaj opcję
                  </button>
                )}
              </div>
            </Field>
          )}

          {(form.type === 'fill' || form.type === 'image') && (
            <Field label="Odpowiedź *">
              <input style={inputStyle} value={form.answer}
                onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} />
            </Field>
          )}
          {form.type === 'image' && (
            <Field label="Cel obrazu (image_target)">
              <input style={inputStyle} value={form.image_target}
                onChange={e => setForm(f => ({ ...f, image_target: e.target.value }))} />
            </Field>
          )}

          <Field label="Podpowiedź (opcjonalne)">
            <input style={inputStyle} value={form.hint}
              onChange={e => setForm(f => ({ ...f, hint: e.target.value }))} />
          </Field>
          <Field label="Wyjaśnienie (opcjonalne)">
            <textarea style={textareaStyle} value={form.explanation}
              onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} />
          </Field>
          <Field label="Kolejność">
            <input style={inputStyle} type="number" value={form.sort_order}
              onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
          </Field>
          <Field label="Aktywne">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <span style={{ fontSize: 13.5, color: TEXT_MAIN }}>Pytanie aktywne</span>
            </label>
          </Field>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Anuluj</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? 'Zapisywanie…' : 'Zapisz'}</Btn>
          </div>
        </Modal>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Admin/AdminQuizPanel.tsx
git commit -m "feat(admin): add AdminQuizPanel client component"
```

---

## Task 8: Quiz Admin Page

**Files:**
- Create: `app/admin/quiz/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/admin/quiz/page.tsx
import { requireAdmin } from '@/lib/auth/guards'
import { AdminQuizPanel } from '@/components/Admin/AdminQuizPanel'

export default async function AdminQuizPage() {
  await requireAdmin()
  return <AdminQuizPanel />
}
```

- [ ] **Step 2: Verify**

Navigate to `http://localhost:3000/admin/quiz` as admin. Expect:
- "Quiz — Panel admina" heading with back link
- Filter bar with 4 selects (type, system, difficulty, status)
- Table of all quiz questions including inactive ones
- Filters apply client-side, reducing visible rows
- "Dezaktywuj/Aktywuj" toggle updates the status badge optimistically
- "Dodaj pytanie" opens modal; switching type changes conditional fields:
  - MCQ: shows option list with radio buttons and "+" / "×" controls
  - Fill: shows answer input only
  - Image: shows answer + image_target inputs
- Edit and Usuń work per row

- [ ] **Step 3: Commit**

```bash
git add app/admin/quiz/page.tsx
git commit -m "feat(admin): add Quiz admin page"
```

---

## Done

All 13 files created. Final sanity check:
- `http://localhost:3000/admin` shows hub with 3 cards
- `http://localhost:3000/admin/nauka` — flashcards CRUD + readings CRUD with sections
- `http://localhost:3000/admin/quiz` — questions CRUD with filters and type-conditional form
- Accessing any `/admin/*` route as non-admin redirects to `/`
- All API routes return 403 for non-admin sessions
