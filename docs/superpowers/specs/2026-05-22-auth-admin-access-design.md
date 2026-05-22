# Design: Authentication And Admin Access

**Date:** 2026-05-22
**Scope:** Require login for the application and protect admin routes with the `admin` role. The `premiumUser` role remains defined for future work but has no special behavior in this phase.

---

## Goal

Every user must sign in before using Anatomy Studio. Regular users can access the main anatomy explorer. Admin users can also access the admin panel, including the annotation editor. Unauthenticated users are redirected to login, and authenticated non-admin users are blocked from admin pages and admin APIs.

The implementation should build on the existing Supabase schema in `supabase/schema-v0.2.sql`, where Supabase Auth stores credentials and `public.users` stores the application profile and `role`.

---

## Decisions

- Use Supabase Auth for login and session management.
- Use `public.users.role` as the app authorization source.
- Support only two effective roles now: `user` and `admin`.
- Keep `premiumUser` in database types and TypeScript unions where useful, but do not add premium access behavior yet.
- Require authentication for the main app route `/`.
- Require `admin` role for `/admin/*` routes and `/api/admin/*` route handlers.
- Add a login route at `app/login/page.tsx`.
- Use Next.js 16 `proxy.ts` only as an optimistic redirect layer, not as the sole authorization mechanism.
- Perform authoritative session and role checks in server components, server helpers, and route handlers.

---

## Architecture

### Supabase Client Helpers

Add a small auth layer under `lib/auth/`:

- Browser client for client components that need login/logout actions.
- Server client for reading the current session from request cookies.
- Profile helpers for reading `public.users` for the current Supabase Auth user.
- Guard helpers:
  - `getCurrentUserProfile()`
  - `requireUser()`
  - `requireAdmin()`

The profile shape should include:

- `id`
- `email`
- `displayName`
- `avatarUrl`
- `role: 'user' | 'admin' | 'premiumUser'`

For this phase, `premiumUser` is treated like `user`.

### Route Protection

`proxy.ts` should run for protected app routes and redirect obvious unauthenticated requests to `/login`. It should avoid slow database lookups. It can check for Supabase session cookies, but the final decision must happen server-side.

Server-side guards should protect:

- `app/page.tsx`: calls `requireUser()`.
- `app/admin/**/page.tsx`: calls `requireAdmin()`.
- `app/api/admin/**/route.ts`: calls `requireAdmin()` or a route-specific admin guard.

If the user is not authenticated, redirect to `/login`. If the user is authenticated but not an admin, redirect to `/` or return `403` for APIs.

### Login Flow

`app/login/page.tsx` renders a focused login screen with email/password fields. It should redirect already-authenticated users to `/`.

Supported actions:

- Sign in with email and password.
- Sign up with email and password if open registration is enabled.
- Sign out from the app shell.

Open registration can remain enabled in the UI if Supabase project settings allow it. New users default to `role = 'user'` through the existing database trigger.

The first admin is promoted manually in Supabase using the existing note in `supabase/schema-v0.2.sql`:

```sql
update public.users set role = 'admin' where email = 'twoj-email@example.com';
```

### App Shell

The main app header should show:

- Current user email or display name.
- Sign out action.
- Link to the admin panel only when `role === 'admin'`.

The header should not expose premium UI yet.

### Admin Panel

The existing `/admin/annotations` panel should become a production-capable admin-only surface instead of development-only. The old `NODE_ENV === 'development'` guard should be replaced by the admin role guard.

The annotation API should also stop relying on the development-only guard. It must reject non-admin users with `403` and keep existing validation and atomic JSON persistence.

JSON-backed annotation persistence remains acceptable for this phase. Moving admin content editing into Supabase is out of scope.

---

## Data Flow

1. User visits `/`.
2. `proxy.ts` redirects to `/login` if there is no obvious session cookie.
3. `app/page.tsx` calls `requireUser()`.
4. `requireUser()` reads the Supabase session and profile.
5. The main app renders with user context.
6. Admin links render only for `role === 'admin'`.
7. Admin pages and APIs call `requireAdmin()` before returning content or mutating data.

---

## Error Handling

- Invalid login: show a Polish error message on the login form.
- Missing session on page routes: redirect to `/login`.
- Missing session on API routes: return `401`.
- Non-admin on admin page routes: redirect to `/`.
- Non-admin on admin API routes: return `403`.
- Supabase profile missing after login: show a clear error and ask the user to retry or contact admin. The database trigger should normally prevent this.

---

## Environment Variables

Frontend auth needs:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only admin profile checks should not require `SUPABASE_SERVICE_ROLE_KEY`; role reads should work through RLS for the authenticated user. If an API needs service-role behavior later, it must be isolated to server-only modules.

---

## Testing And Verification

Implementation should verify:

- A source-level auth/admin verification script for key guards.
- `npx tsc --noEmit`
- `npm run build`
- Manual browser checks:
  - Unauthenticated `/` redirects to `/login`.
  - User can sign up or sign in and access `/`.
  - Non-admin user cannot access `/admin/annotations`.
  - Admin user can access `/admin/annotations`.
  - Non-admin requests to `/api/admin/annotations` return `403`.
  - Admin requests to `/api/admin/annotations` work.
  - Sign out returns the user to `/login`.

---

## Out Of Scope

- Premium-user gating.
- Paid plans or subscription state.
- Social login providers.
- Password reset flow.
- Multi-factor authentication.
- Moving annotation storage from JSON to Supabase.
- Admin user-management UI.

---

## Future Extensions

- Add password reset.
- Add admin user-management page for role changes.
- Add premium content access using `premiumUser` and `premium_until`.
- Move annotation authoring persistence into Supabase tables.
- Add audit logs for admin changes.
