import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = process.cwd()

function read(path) {
  const fullPath = join(projectRoot, path)
  if (!existsSync(fullPath)) {
    throw new Error(`${path} missing`)
  }
  return readFileSync(fullPath, 'utf8')
}

const checks = [
  {
    path: 'app/(gated)/profil/page.tsx',
    patterns: ['getCurrentUserProfile', 'fetchUserStats', 'fetchUserQuizHistory', 'fetchUserQuizSummary', '<ProfilePage'],
  },
  {
    path: 'components/Profile/ProfilePage.tsx',
    patterns: ['profile-shell', 'AppNavbar', 'active="profil"', 'AdminToolsPanel', 'SignOutButton', 'profile-sign-out-button'],
  },
  {
    path: 'components/UserMenu/SignOutButton.tsx',
    patterns: ['createSupabaseBrowserClient', 'supabase.auth.signOut', "router.push('/login')"],
  },
  {
    path: 'components/Profile/ProfileMetricGrid.tsx',
    patterns: ['profile-metric-grid', 'profile-metric'],
  },
  {
    path: 'components/Profile/AdminToolsPanel.tsx',
    patterns: ['/admin/nauka', '/admin/quiz', '/admin/annotations', 'profile-admin-tools'],
  },
  {
    path: 'components/AppNavbar/AppNavbar.tsx',
    patterns: ["{ id: 'profil', label: 'Profil', href: '/profil'", "const href = item.href"],
  },
  {
    path: 'lib/supabase/quiz.ts',
    patterns: ['export interface UserQuizSummary', 'fetchUserQuizSummary', 'averageScorePercent'],
  },
  {
    path: 'app/globals.css',
    patterns: ['.profile-shell', '.profile-card', '.profile-admin-tools', '.profile-metric-grid', '.profile-sign-out-button'],
  },
]

const failures = []

for (const check of checks) {
  let source
  try {
    source = read(check.path)
  } catch (error) {
    failures.push(error instanceof Error ? error.message : `${check.path} missing`)
    continue
  }

  for (const pattern of check.patterns) {
    if (!source.includes(pattern)) {
      failures.push(`${check.path} missing ${pattern}`)
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Profile page wiring OK.')
