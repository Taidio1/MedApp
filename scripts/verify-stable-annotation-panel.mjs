import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const store = readFileSync(join(root, 'lib', 'store.ts'), 'utf8')
const annotations = readFileSync(
  join(root, 'components', 'Viewer3D', 'Annotations.tsx'),
  'utf8',
)
const viewer = readFileSync(
  join(root, 'components', 'Viewer3D', 'Viewer3D.tsx'),
  'utf8',
)

const checks = [
  {
    name: 'store exposes a persistent active annotation',
    pass:
      store.includes('activeAnnotation: Annotation | null') &&
      store.includes('setActiveAnnotation: (annotation: Annotation | null) => void'),
  },
  {
    name: 'hovering a point stores the annotation instead of local-only tooltip state',
    pass: annotations.includes('setActiveAnnotation(annotation)'),
  },
  {
    name: 'annotation bubbles are no longer rendered next to the 3D point',
    pass: !annotations.includes('<Html'),
  },
  {
    name: 'viewer renders the fixed right-side annotation panel',
    pass: viewer.includes('AnnotationDetailPanel'),
  },
]

const failures = checks.filter((check) => !check.pass)

if (failures.length > 0) {
  console.error('Stabilny panel anotacji nie spelnia kontraktu:')
  for (const failure of failures) {
    console.error(`- ${failure.name}`)
  }
  process.exit(1)
}

console.log('Stabilny panel anotacji OK.')
