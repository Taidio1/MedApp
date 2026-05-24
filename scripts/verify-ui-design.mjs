import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = process.cwd()

function read(path) {
  return readFileSync(join(projectRoot, path), 'utf8')
}

const checks = [
  {
    path: 'components/AppShell/AppShell.tsx',
    patterns: [
      'medapp-shell',
      '--accent',
      '--accent-soft',
      'selectedStructure',
      'MedApp Anatomy Studio',
      'PanelLeft',
      'Viewer3D',
    ],
  },
  {
    path: 'app/page.tsx',
    patterns: ['AppShell', 'requireUser'],
  },
  {
    path: 'app/globals.css',
    patterns: ['--paper: #fbf7ee', '.medapp-grid', '.stage-panel', '.atlas-panel'],
  },
  {
    path: 'components/Viewer3D/Viewer3D.tsx',
    patterns: ['stage-panel', 'viewer-toolbar', 'Wycinek', 'Reset'],
  },
  {
    path: 'components/PanelLeft/PanelLeft.tsx',
    patterns: ['atlas-panel', 'structure-row', 'mini-structure'],
  },
  {
    path: 'components/PanelRight/PanelRight.tsx',
    patterns: ['details-panel', 'ai-tutor-card', 'structure-orb'],
  },
  {
    path: 'components/PanelBottom/PanelBottom.tsx',
    patterns: ['bottom-grid', 'learning-map-panel', 'compare-panel'],
  },
]

const failures = []

for (const check of checks) {
  let source
  try {
    source = read(check.path)
  } catch {
    failures.push(`${check.path} missing`)
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

console.log('UI design wiring OK.')
