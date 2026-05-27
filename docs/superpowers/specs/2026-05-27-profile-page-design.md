# Profile Page Design

## Goal

Create a shared `/profil` page for both learner and admin users. The page should make the navbar's "Profil" destination meaningful for every authenticated user: learners see their account, learning progress, quiz activity, and account controls; admins see the same personal profile plus a compact administrative overview with shortcuts to content tools.

## Context

The app uses Next.js 16 App Router, Supabase auth, and role data from `public.users`. Current auth helpers are in `lib/auth/guards.ts`; `requireUser()` returns the authenticated user's profile and redirects unauthenticated users to `/login`.

`components/AppNavbar/AppNavbar.tsx` already includes a `profil` nav item, but it currently links admins to `/admin` and learners to `/`. This design changes that behavior so `Profil` always links to `/profil`. Admin tooling remains available through `UserMenu` and the admin-only profile section.

The visual direction must follow `UI-Design.md`: warm paper background, low-contrast borders, 8px cards, serif headings, concise note-style panel labels, lucide icons, and restrained role/status accents. The profile page is an application surface, not a marketing page.

## Route And Authorization

Add `app/profil/page.tsx`.

The page is a Server Component. It calls `requireUser()` close to the route and redirects to `/login` if needed. It renders role-specific UI based on `profile.role === 'admin'`; this is display logic only. Existing admin routes and API handlers keep their own authorization checks.

Use one route for both roles:

- `/profil` for learner and admin profile.
- `/admin/nauka`, `/admin/quiz`, and `/admin/annotations` remain admin tool destinations.
- `/admin` can continue to exist as the admin dashboard, but `AppNavbar` should not use it as the profile target.

## Data

Use existing server-side helpers where possible:

- `requireUser()` for `id`, `email`, `displayName`, `avatarUrl`, and `role`.
- `fetchUserStats(profile.id)` for learning totals.
- `fetchUserQuizHistory(profile.id)` for recent quiz attempts.

Add a focused helper in `lib/supabase/quiz.ts` if needed:

- `fetchUserQuizSummary(userId)` returns completed quiz session count, average score percentage, best streak, and total quiz time.

The page should tolerate missing or empty activity data by rendering zero-state values rather than failing. Supabase query errors for optional summaries should not expose stack traces to the UI.

## Learner Experience

The learner profile includes:

- Account card: avatar/initials, display name or email, email, role label, and short learning status.
- Learning progress card: total cards, known cards, review count, sessions this week, study minutes, and progress percentage.
- Quiz card: completed sessions, average score, best streak, total time, and recent attempts.
- Settings/account card: non-destructive account information and a visible sign-out action through the existing `UserMenu` behavior or a profile-local sign-out control if it fits existing patterns.
- Primary actions: continue learning (`/nauka`), start quiz (`/quiz`), open atlas (`/`).

The learner page should feel like a personal study desk: dense enough to scan quickly, but not a SaaS dashboard full of decorative widgets.

## Admin Experience

Admins see everything from the learner profile plus an admin-only section:

- Admin overview card with role badge and a concise message that this account has content-management access.
- Three tool cards linking to:
  - `/admin/nauka` for flashcards and reading material.
  - `/admin/quiz` for quiz questions.
  - `/admin/annotations` for 3D annotation points.

Admin tool cards use lucide icons, paper styling, and role-appropriate accent colors. They should be shortcuts, not replacements for the existing admin pages.

## Layout

Desktop:

- Use `AppNavbar active="profil"` at the top.
- Use a profile shell consistent with `medapp-shell` / `quiz-shell` visual tokens.
- Main content max-width around 1180-1280px.
- Top profile summary spans the width.
- Below it, use a two-column grid: progress and quiz summaries on the left/center, account/admin actions on the right.

Tablet/mobile:

- Collapse to one column.
- Keep account identity first, then learning, quiz, actions, and admin tools.
- Avoid horizontal overflow. Button labels must fit.

Cards:

- `border-radius: 8px`.
- `border: 1px solid var(--line)`.
- `background: linear-gradient(...) + var(--paper)`.
- `box-shadow: var(--shadow-soft)`.
- No nested decorative cards. Repeated metric tiles can be compact blocks inside a parent card.

## Components

Create focused components rather than putting all JSX into the route:

- `components/Profile/ProfilePage.tsx`: presentational composition for the full profile page.
- `components/Profile/ProfileMetricGrid.tsx`: small reusable metric tiles.
- `components/Profile/AdminToolsPanel.tsx`: admin-only shortcuts.

Keep the page data-fetching in `app/profil/page.tsx` and pass serializable props into components.

## Errors And Empty States

- If learning stats are unavailable, show zero-like values and a muted note: "Brak zapisanych sesji nauki".
- If quiz history is empty, show "Brak ukończonych quizów" and keep the CTA to `/quiz`.
- Do not block the profile page because optional activity summaries fail.
- Auth failure is handled by `requireUser()` redirecting to `/login`.

## Testing And Verification

Minimum verification:

- `npm run build`.
- Existing focused scripts that are likely affected: `npm run verify:auth-admin` and `npm run verify:ui-design`.
- Manual browser check for `/profil` at desktop and mobile widths if a dev server is available.

Behavior checks:

- Learner clicking "Profil" in `AppNavbar` goes to `/profil`.
- Admin clicking "Profil" in `AppNavbar` also goes to `/profil`.
- Admin profile includes links to `/admin/nauka`, `/admin/quiz`, `/admin/annotations`.
- Non-admin profile does not render admin tools.

## Out Of Scope

- Editing profile fields.
- Avatar upload.
- Password or email change flows.
- New database tables.
- Replacing the existing `/admin` dashboard.

## Self-Review

- No open-ended requirements remain.
- Scope is one route plus small supporting helpers/components.
- Authorization is kept server-side and existing admin routes remain protected.
- UI direction follows `UI-Design.md` rather than introducing a separate profile theme.
