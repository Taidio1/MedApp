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
    path: 'app/nauka/materialy/page.tsx',
    patterns: ['fetchReadingMaterials', 'searchParams', 'NaukaMaterialsPage'],
  },
  {
    path: 'components/Nauka/NaukaMaterialsPage.tsx',
    patterns: ['reading-materials-shell', 'illustrationUrl', 'activeReading.sections.map', '/nauka?start=session'],
  },
  {
    path: 'components/Nauka/NaukaPage.tsx',
    patterns: ['useSearchParams', "startParam === 'session'", '/nauka/materialy'],
  },
  {
    path: 'lib/naukaData.ts',
    patterns: ['illustrationUrl'],
  },
  {
    path: 'lib/supabase/nauka.ts',
    patterns: ['illustration_url', 'illustrationUrl'],
  },
  {
    path: 'app/api/admin/nauka/readings/route.ts',
    patterns: ['illustration_url'],
  },
  {
    path: 'app/api/admin/nauka/readings/[id]/route.ts',
    patterns: ['illustration_url'],
  },
  {
    path: 'components/Admin/AdminNaukaPanel.tsx',
    patterns: ['illustration_url', 'URL ilustracji'],
  },
  {
    path: 'supabase/schema-v0.2.sql',
    patterns: ['illustration_url'],
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

console.log('Nauka materials wiring OK.')
