# Design: Auth Gating — Publiczny dostęp z blurowanym overlay

**Date:** 2026-05-27  
**Status:** Approved

---

## Cel

Umożliwić niezalogowanym użytkownikom przeglądanie strony Atlas (`/`). Strony Nauka, Quiz i Profil pozostają dostępne wizualnie, ale ich treść jest zasłonięta pełnoekranowym overlay z blur efektem i przyciskami "Zaloguj się" / "Zarejestruj się". Admin może wyłączyć wymóg logowania globalnie (tryb prezentacyjny) przez panel administracyjny — wtedy wszystkie strony są w pełni dostępne bez konta. Panel admina nadal zawsze wymaga roli `admin`.

---

## Zmiany w bazie danych

### Nowa tabela `app_settings`

```sql
create table if not exists public.app_settings (
  key   text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('require_login', 'true')
on conflict (key) do nothing;
```

RLS:
- SELECT: dostępny dla `anon` i `authenticated` — ustawienia są nieczułe i muszą być odczytywalne przed logowaniem
- INSERT/UPDATE/DELETE: tylko przez service role (route handlery używają `SUPABASE_SERVICE_ROLE_KEY`)

```sql
alter table public.app_settings enable row level security;

create policy "app_settings_public_read"
  on public.app_settings for select
  to anon, authenticated
  using (true);
```

Ustawienie `require_login` przyjmuje wartości `'true'` / `'false'` (text, żeby tabela była generyczna).

---

## Architektura

### Reorganizacja routeów — Route Groups

```
app/
  (public)/
    page.tsx               ← Atlas + Explorer 3D — dostępny bez logowania
  (gated)/
    layout.tsx             ← NOWY: server component, gate logic
    quiz/
      page.tsx             ← przeniesiony
      layout.tsx           ← bez zmian
    nauka/
      page.tsx             ← przeniesiony
      materialy/
        page.tsx           ← przeniesiony
    profil/
      page.tsx             ← przeniesiony
  admin/                   ← bez zmian, requireAdmin() jak dotąd
  login/                   ← bez zmian
  api/                     ← bez zmian
  layout.tsx               ← root layout, bez zmian
  globals.css
```

Route groups `(public)` i `(gated)` nie wpływają na URL-e — `/quiz` pozostaje `/quiz`.

---

## Nowe/zmienione moduły

### `lib/auth/guards.ts` — dodanie `getRequireLoginSetting`

```ts
import { cache } from 'react'

export const getRequireLoginSetting = cache(async (): Promise<boolean> => {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'require_login')
    .single()
  return data?.value !== 'false'
})
```

`cache()` z Reacta zapewnia deduplication per-request (wielokrotne wywołanie w jednym renderze = jedno zapytanie do bazy).

### `app/(gated)/layout.tsx`

Server component. Pobiera równolegle profil usera i flagę `require_login`. Jeśli logowanie wymagane i user niezalogowany — renderuje `<AuthGateOverlay pageName={...} />` zamiast `children`.

```tsx
export default async function GatedLayout({ children }: { children: React.ReactNode }) {
  const [profile, requireLogin] = await Promise.all([
    getCurrentUserProfile(),
    getRequireLoginSetting(),
  ])

  if (requireLogin && !profile) {
    return <AuthGateOverlay />
  }

  return <>{children}</>
}
```

Strony wewnątrz grupy `(gated)` zmieniają `requireUser()` → `getCurrentUserProfile()` (już eksportowana). Profil przekazują do swoich komponentów normalnie; komponent może obsłużyć `null` jako "gość" (jeśli tryb prezentacyjny).

### `app/(public)/page.tsx`

Zmiana `requireUser()` → `getCurrentUserProfile()`. Profil może być `null`. `<AppShell>` otrzymuje `profile | null` — gdy `null`, navbar pokazuje przycisk "Zaloguj się" zamiast user menu.

---

## Komponenty UI

### `components/AuthGate/AuthGateOverlay.tsx`

Client component (`'use client'`):

- `position: fixed; inset: 0; z-index: 50` — pokrywa cały viewport ponad treścią
- `backdrop-filter: blur(8px)` + tło `rgba(0,0,0,0.35)` — treść strony widoczna przez mgłę
- `overflow: hidden` na `<body>` przez `useEffect` — blokuje scroll
- Karta pośrodku (max-width 360px):
  - Ikona kłódki
  - Tytuł: "Zaloguj się, aby kontynuować"
  - Podtytuł: "Ta sekcja wymaga konta MedApp"
  - Przycisk primary: "Zaloguj się" → `href="/login"`
  - Przycisk secondary (outline): "Zarejestruj się" → `href="/login?tab=register"`
- Styl spójny z appką: tło karty `#fbf7ee`, serif font dla tytułu, akcent `#5b4e3c`

### `components/AppNavbar/AppNavbar.tsx` — wariant gościa

Gdy `email` jest `null/undefined` (brak zalogowanego usera), navbar po prawej stronie zamiast dzwonka i awatara pokazuje:
- Link "Zaloguj się" (outline button)

Zmiana dotyczy sekcji `app-navbar-actions` — `email && <UserMenu ...>` pozostaje, dodaje się fallback `!email && <GuestActions />`.

---

## Panel admina — nowa sekcja Ustawienia

### `app/admin/settings/page.tsx`

Server component. `await requireAdmin()` jako pierwsze wywołanie. Renderuje `<AdminSettingsPanel initialRequireLogin={...} />`.

### `components/Admin/AdminSettingsPanel.tsx`

Client component (`'use client'`). Toggle "Wymagaj logowania":

- `PUT /api/admin/settings` z body `{ key: 'require_login', value: string }`
- Stan lokalny + optimistic update dla natychmiastowego feedbacku
- Informacja: "Gdy wyłączone, wszyscy odwiedzający mają pełny dostęp (tryb prezentacyjny). Panel admina zawsze wymaga roli admin."

### `app/api/admin/settings/route.ts`

```ts
export async function PUT(req: Request) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected

  const { key, value } = await req.json()
  // walidacja: key musi być 'require_login', value musi być 'true' lub 'false'
  const supabase = createSupabaseServerClientWithServiceRole()
  await supabase.from('app_settings').upsert({ key, value, updated_at: new Date() })
  return Response.json({ ok: true })
}
```

### Hub `/admin` — nowa karta

Dodana karta "Ustawienia" (`/admin/settings`) z akcentem `#64748b` i szarym tłem `#f8fafc`.

---

## Przepływ danych

### Niezalogowany użytkownik odwiedza `/quiz`

1. Request trafia do `app/(gated)/layout.tsx`
2. Layout wywołuje równolegle `getCurrentUserProfile()` → `null` i `getRequireLoginSetting()` → `true`
3. Layout renderuje `<AuthGateOverlay />`
4. Overlay blokuje scroll, pokazuje kartę z przyciskami
5. User klika "Zaloguj się" → `/login`

### Admin wyłącza tryb logowania

1. Admin toggle w `/admin/settings` → `PUT /api/admin/settings` z `{ key: 'require_login', value: 'false' }`
2. Route handler aktualizuje `app_settings` w Supabase
3. Od następnego requestu `getRequireLoginSetting()` zwraca `false`
4. Gated layout przepuszcza niezalogowanych użytkowników do `children`

### Niezalogowany użytkownik odwiedza `/` (Atlas)

1. `app/(public)/page.tsx` wywołuje `getCurrentUserProfile()` → `null`
2. Profil `null` przekazywany do `<AppShell profile={null} />`
3. Navbar renderuje przycisk "Zaloguj się" zamiast user menu
4. Całość działa normalnie

---

## Obsługa błędów

- Brak rekordu `require_login` w `app_settings`: funkcja domyślnie zwraca `true` (bezpieczny fallback)
- Błąd Supabase przy odczycie `app_settings`: j.w., fail-safe do `true`
- `PUT /api/admin/settings` z nieprawidłowymi danymi: `400` z komunikatem błędu
- Niezalogowany user na stronie gated gdy `require_login = false`: strona renderuje się normalnie, ale komponenty wymagające `userId` mogą pokazać stan "gość" (obsługa w każdym komponencie osobno, w zakresie pracy prezentacyjnej)

---

## Zakres prac

### W zakresie

1. Migracja SQL: tabela `app_settings` z domyślnym `require_login = true`
2. `getRequireLoginSetting()` w `lib/auth/guards.ts`
3. Route group `app/(gated)/` z `layout.tsx` jako gate
4. Przeniesienie `quiz`, `nauka`, `nauka/materialy`, `profil` do `(gated)/`
5. Strona `(public)/page.tsx` — dostęp bez logowania
6. Komponent `AuthGateOverlay`
7. Navbar — wariant gościa (przycisk "Zaloguj się")
8. `app/admin/settings/page.tsx` + `AdminSettingsPanel` + API endpoint
9. Nowa karta "Ustawienia" na hubie `/admin`

### Poza zakresem

- Obsługa stanu "gość" w komponentach Quiz/Nauka/Profil gdy `require_login = false` i user = null (dane personalnie itp.) — to osobne zadanie
- Premium gating
- Rejestracja przez osobną stronę (na razie `/login?tab=register`)
- Wielojęzyczność overlay

---

## Weryfikacja

- `npx tsc --noEmit` — zero błędów TypeScript
- `npm run build` — build przechodzi
- Ręczne sprawdzenie:
  - Niezalogowany `/` — działa, navbar z "Zaloguj się"
  - Niezalogowany `/quiz` — overlay z bluriem, brak scrollu
  - Niezalogowany `/nauka` — overlay
  - Niezalogowany `/profil` — overlay
  - Zalogowany user — wszystkie strony działają normalnie
  - Admin toggle OFF → niezalogowany `/quiz` — działa bez overlay
  - Admin toggle ON → blur wraca
  - `/admin/settings` niedostępny dla nie-admina
