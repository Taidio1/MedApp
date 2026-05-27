import { readFile } from 'node:fs/promises'

const callbackRoute = await readFile('app/auth/callback/route.ts', 'utf8')
const loginForm = await readFile('app/login/LoginForm.tsx', 'utf8')
const siteUrlHelper = await readFile('lib/site-url.ts', 'utf8').catch(() => '')
const envExample = await readFile('.env.local.example', 'utf8')

const checks = [
  {
    name: 'OAuth callback uses a public origin helper for redirects',
    passed: callbackRoute.includes('getRequestPublicOrigin(request)'),
  },
  {
    name: 'OAuth callback no longer redirects against requestUrl.origin',
    passed: !/NextResponse\.redirect\(new URL\([^)]*,\s*requestUrl\.origin\)\)/s.test(callbackRoute),
  },
  {
    name: 'LoginForm uses a public origin helper for OAuth redirectTo',
    passed: loginForm.includes('getBrowserPublicOrigin()'),
  },
  {
    name: 'Public origin helper prefers NEXT_PUBLIC_SITE_URL',
    passed: /NEXT_PUBLIC_SITE_URL/.test(siteUrlHelper),
  },
  {
    name: 'Environment example documents NEXT_PUBLIC_SITE_URL',
    passed: /NEXT_PUBLIC_SITE_URL/.test(envExample),
  },
]

const failed = checks.filter((item) => !item.passed)

for (const item of checks) {
  console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}`)
}

if (failed.length > 0) {
  process.exitCode = 1
}
