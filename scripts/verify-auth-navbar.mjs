import { readFileSync } from 'node:fs'

const checks = [
  {
    path: 'app/(gated)/quiz/page.tsx',
    patterns: ['email={profile?.email ?? null}'],
  },
  {
    path: 'app/(gated)/nauka/page.tsx',
    patterns: ['email={profile?.email ?? null}'],
  },
  {
    path: 'components/Quiz/QuizPage.tsx',
    patterns: ['email: string | null', 'email={email}'],
  },
  {
    path: 'components/Nauka/NaukaPage.tsx',
    patterns: ['email: string | null', 'email={email}'],
  },
]

let failed = false

for (const check of checks) {
  const source = readFileSync(check.path, 'utf8')

  for (const pattern of check.patterns) {
    if (!source.includes(pattern)) {
      console.error(`${check.path}: missing "${pattern}"`)
      failed = true
    }
  }
}

if (failed) {
  process.exit(1)
}

console.log('Auth navbar props are wired for quiz and nauka pages.')
