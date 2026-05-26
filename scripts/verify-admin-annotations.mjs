import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertFile(relativePath) {
  assert(fs.existsSync(path.join(root, relativePath)), `Missing ${relativePath}`)
}

assertFile('data/annotations.json')
assertFile('lib/annotationStore.ts')
assertFile('app/api/admin/annotations/route.ts')
assertFile('app/admin/annotations/page.tsx')
assertFile('components/AdminAnnotationEditor/AdminAnnotationEditor.tsx')
assertFile('components/AdminAnnotationEditor/AdminAnnotationCanvas.tsx')

const annotationsJson = read('data/annotations.json')
const parsed = JSON.parse(annotationsJson)
assert(
  parsed && typeof parsed === 'object' && !Array.isArray(parsed),
  'data/annotations.json must contain an object keyed by structure id',
)

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['verify:admin-annotations'] ===
    'node scripts/verify-admin-annotations.mjs',
  'package.json must expose verify:admin-annotations',
)

const types = read('lib/types.ts')
assert(types.includes('size?: number'), 'Annotation type must include size?: number')
assert(types.includes('visible?: boolean'), 'Annotation type must include visible?: boolean')

const store = read('lib/annotationStore.ts')
for (const expected of [
  'AnnotationStoreRecord',
  'AnnotationStore',
  'normalizeAnnotationStore',
  'mergeStructuresWithAnnotationStore',
  'getAnnotationStoreForClient',
  '0.02',
  '0.25',
]) {
  assert(store.includes(expected), `annotationStore.ts must include ${expected}`)
}

const anatomyData = read('lib/anatomyData.ts')
assert(anatomyData.includes('baseStructures'), 'anatomyData.ts must export baseStructures')
assert(anatomyData.includes('baseAnatomyTree'), 'anatomyData.ts must export baseAnatomyTree')
assert(
  anatomyData.includes('mergeStructuresWithAnnotationStore'),
  'anatomyData.ts must merge JSON-backed annotations',
)

const route = read('app/api/admin/annotations/route.ts')
assert(
  !route.includes("process.env.NODE_ENV !== 'development'"),
  'admin route must NOT use NODE_ENV guard (replaced by role-based auth)',
)
assert(
  route.includes('401') && route.includes('403'),
  'admin route must return 401 for missing session and 403 for non-admin',
)
assert(route.includes('export async function GET'), 'admin route must export GET')
assert(route.includes('export async function PUT'), 'admin route must export PUT')
assert(route.includes('writeFile'), 'admin route must write a temporary file')
assert(route.includes('rename'), 'admin route must atomically rename the temporary file')

const viewerAnnotations = read('components/Viewer3D/Annotations.tsx')
assert(
  viewerAnnotations.includes('visible !== false'),
  'viewer annotations must skip hidden annotations',
)
assert(
  viewerAnnotations.includes('annotation.size'),
  'viewer annotations must use annotation.size',
)

const adminPage = read('app/admin/annotations/page.tsx')
assert(
  adminPage.includes('requireAdmin'),
  'admin page must call requireAdmin() (role-based guard)',
)
assert(
  !adminPage.includes("NODE_ENV !== 'development'"),
  'admin page must NOT use NODE_ENV guard',
)
assert(
  adminPage.includes('AdminAnnotationEditor'),
  'admin page must render AdminAnnotationEditor',
)

console.log('Admin annotation verification passed')
