import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const checks = []

function check(name, condition) {
  checks.push({ name, passed: Boolean(condition) })
}

const loginForm = await readFile('app/login/LoginForm.tsx', 'utf8')
const proxy = await readFile('proxy.ts', 'utf8')
const callbackPath = 'app/auth/callback/route.ts'
const callbackExists = existsSync(callbackPath)
const callbackRoute = callbackExists ? await readFile(callbackPath, 'utf8') : ''

check('LoginForm has no merge conflict markers', !/<<<<<<<|=======|>>>>>>>/.test(loginForm))
check('Google button starts Supabase OAuth', /signInWithOAuth\s*\(/.test(loginForm) && /provider:\s*['"]google['"]/.test(loginForm))
check('Google OAuth redirects to /auth/callback', /redirectTo:.*\/auth\/callback/s.test(loginForm))
check('X button starts Supabase OAuth 2.0 provider', /provider:\s*['"]x['"]/.test(loginForm))
check('X OAuth redirects to /auth/callback', /provider:\s*['"]x['"][\s\S]*redirectTo:.*\/auth\/callback/.test(loginForm))
check('LoginForm no longer shows Apple social login', !/Kontynuuj z Apple|>Apple<|appleLogo/.test(loginForm))
check('OAuth callback route exists', callbackExists)
check('OAuth callback exchanges auth code for session', /exchangeCodeForSession\s*\(/.test(callbackRoute))
check('OAuth callback redirects failed exchanges to login error', /\/login\?error=oauth/.test(callbackRoute))
check('Proxy allows auth callback routes', proxy.includes("'/auth/'") || proxy.includes('"/auth/"'))

const failed = checks.filter((item) => !item.passed)

for (const item of checks) {
  console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}`)
}

if (failed.length > 0) {
  process.exitCode = 1
}
