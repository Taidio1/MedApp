import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = process.cwd()

function read(path) {
  return readFileSync(join(projectRoot, path), 'utf8')
}

const checks = [
  {
    path: 'components/PanelBottom/PanelBottom.tsx',
    patterns: ['filterAnnotationsByLayers', 'AnnotationLayerFilter', 'QuizModePanel'],
  },
  {
    path: 'components/Viewer3D/Annotations.tsx',
    patterns: ['filterAnnotationsByLayers', 'activeAnnotationPointLayers'],
  },
  {
    path: 'lib/store.ts',
    patterns: ['activeLearningTab', 'activeAnnotationPointLayers', 'quizScore'],
  },
]

const failures = []

for (const check of checks) {
  const source = read(check.path)
  for (const pattern of check.patterns) {
    if (!source.includes(pattern)) failures.push(`${check.path} missing ${pattern}`)
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Learning UI wiring OK.')
