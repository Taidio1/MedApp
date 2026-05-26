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
