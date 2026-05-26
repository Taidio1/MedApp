# Admin Panel — Design Spec

**Date:** 2026-05-26  
**Status:** Approved

---

## Overview

A multi-section admin panel for MedApp, accessible only to users with `role = 'admin'`. Covers three modules: Nauka (flashcards + reading materials), Quiz (questions), and the existing Annotations editor. A hub page at `/admin` links all three.

---

## Architecture

### Auth

- All `page.tsx` files are async Server Components. First instruction: `await requireAdmin()` from `lib/auth/guards.ts`. Redirects to `/` if not admin.
- All route handlers call a local `rejectNonAdmin()` helper (pattern from `app/api/admin/annotations/route.ts`) that returns `Response.json({ error }, { status })` or `null`.
- No Supabase access in client components — all mutations go through route handlers.

### File Structure

```
app/
  admin/
    page.tsx                          — hub (3 nav cards)
    nauka/page.tsx                    — thin server wrapper → AdminNaukaPanel
    quiz/page.tsx                     — thin server wrapper → AdminQuizPanel
    annotations/page.tsx              — existing, unchanged

app/api/admin/
  nauka/
    flashcards/
      route.ts                        — GET (list), POST (create)
      [id]/route.ts                   — PUT (update), DELETE (delete)
    readings/
      route.ts                        — GET (list with sections), POST (create material)
      [id]/route.ts                   — PUT (update material), DELETE (delete material)
      [id]/sections/route.ts          — POST (add section)
      [id]/sections/[sectionId]/route.ts — PUT (update section), DELETE (delete section)
  quiz/
    questions/
      route.ts                        — GET (list all incl. inactive), POST (create)
      [id]/route.ts                   — PUT (update), DELETE (delete)

components/Admin/
  AdminNaukaPanel.tsx                 — 'use client', tabs: Fiszki | Materiały
  AdminQuizPanel.tsx                  — 'use client', filter bar + question table
```

---

## Route Handlers

### Pattern

```ts
async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  return null
}
```

Each handler: `const rejected = await rejectNonAdmin(); if (rejected) return rejected`

### Nauka — Flashcards

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/admin/nauka/flashcards` | Select all from `flashcards`, order by `id` |
| POST | `/api/admin/nauka/flashcards` | Insert row; required: `question`, `answer`, `system`, `difficulty` |
| PUT | `/api/admin/nauka/flashcards/[id]` | Update by TEXT id |
| DELETE | `/api/admin/nauka/flashcards/[id]` | Delete by TEXT id |

`flashcards.id` is TEXT (not UUID). `difficulty` enum: `basic | intermediate | advanced`.

### Nauka — Reading Materials

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/admin/nauka/readings` | Select with nested `reading_sections(id, title, content, sort_order)` |
| POST | `/api/admin/nauka/readings` | Insert; required: `sys`, `title`, `read_time` |
| PUT | `/api/admin/nauka/readings/[id]` | Update material by UUID |
| DELETE | `/api/admin/nauka/readings/[id]` | Delete material by UUID (cascade deletes sections) |
| POST | `/api/admin/nauka/readings/[id]/sections` | Insert section; required: `id` (slug), `title`, `content`, `sort_order` |
| PUT | `/api/admin/nauka/readings/[id]/sections/[sectionId]` | Update section by TEXT slug |
| DELETE | `/api/admin/nauka/readings/[id]/sections/[sectionId]` | Delete section by `material_id + id` |

Route handlers define a local `DbReadingMaterialAdmin` type (with `id: string`) — no changes to `lib/supabase/nauka.ts`.

### Quiz — Questions

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/admin/quiz/questions` | Select all (including `is_active = false`), order by `sort_order` |
| POST | `/api/admin/quiz/questions` | Insert; required: `type`, `system_name`, `difficulty`, `question_text` |
| PUT | `/api/admin/quiz/questions/[id]` | Update by UUID; supports partial update incl. `is_active` toggle |
| DELETE | `/api/admin/quiz/questions/[id]` | Delete by UUID |

---

## Client Components

### AdminNaukaPanel

State:
- `tab: 'flashcards' | 'readings'`
- `flashcards: DbFlashcard[]`, `readings: DbReadingMaterialAdmin[]`
- `loading: boolean`, `error: string | null`
- `modal: null | { mode: 'add' | 'edit', type: 'flashcard' | 'material' | 'section', data?: ... }`

Flashcards tab:
- Table: columns `id`, `system`, `difficulty`, `struct`, truncated `question` (max 60 chars)
- "Dodaj fiszkę" button → modal form
- Per-row: "Edytuj" and "Usuń" (with `window.confirm`)
- Form fields: `question` (textarea), `answer` (textarea), `system` (select from `NAUKA_SYSTEMS`), `difficulty` (select: basic/intermediate/advanced), `mnemonic`, `details`, `struct`

Readings tab:
- Accordion list: each material shows `sys`, `title`, `read_time` as header; expanded shows section list
- "Dodaj materiał" + "Dodaj sekcję" buttons; per-item "Edytuj"/"Usuń"
- Material form: `sys` (select from `NAUKA_SYSTEMS`), `title`, `read_time` (number)
- Section form: `id` (slug input), `title`, `content` (textarea), `sort_order` (number)

### AdminQuizPanel

State:
- `questions: DbQuizQuestion[]` (all, including inactive)
- `filters: { type: string, system: string, difficulty: string, active: string }`
- `modal: null | { mode: 'add' | 'edit', data?: DbQuizQuestion }`
- `loading: boolean`, `error: string | null`

Filter bar: 4 selects (type, system_name, difficulty, is_active), applied client-side.

Table columns: truncated `question_text`, `type`, `system_name`, `difficulty`, `is_active` (badge).

Per-row actions: "Edytuj", "Usuń", toggle "Aktywne" (optimistic update + PUT).

Question form — conditional fields by `type`:
- `mcq`: `options` as dynamic list of text inputs (min 2, max 6) + radio buttons for `correct_index`
- `fill`: `answer` text input
- `image`: `image_target` input + `answer` input
- All types: `hint`, `explanation`, `sort_order`, `is_active` checkbox

### Hub Page (`/admin`)

Three cards:
- Nauka (`/admin/nauka`) — green accent `#2a7a60`
- Quiz (`/admin/quiz`) — purple accent `#7c3aed`
- Anotacje (`/admin/annotations`) — neutral

---

## Styling

Inline styles throughout. Design tokens:
- Card background: `#fbf7ee`, border: `rgba(91,78,60,0.14)`, radius: `10-12px`
- Nauka accent: `#2a7a60`; Quiz accent: `#7c3aed`
- Text primary: `#28231c`; text secondary: `#80786d`
- Heading font: `"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif`
- UI font: `Inter,sans-serif`

---

## Technical Requirements

1. Server Components call `await requireAdmin()` as first instruction.
2. Client Components are `'use client'`, located in `components/Admin/`.
3. All CRUD via `fetch` to route handlers — no direct Supabase in client code.
4. After every mutation: re-fetch full list (no optimistic update except `is_active` toggle).
5. `window.confirm` before delete.
6. Error state displayed inline below the form or above the list.
7. Submit buttons: `disabled` + label "Zapisywanie…" during fetch.
8. Client-side validation: required fields checked before fetch.

---

## Out of Scope

- Pagination (admin lists are expected to be manageable in size)
- Bulk operations
- Image upload for `image_target` (text input only)
- Audit log / change history
