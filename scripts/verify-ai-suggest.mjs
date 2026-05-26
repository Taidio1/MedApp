import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
function read(p) { return fs.readFileSync(path.join(root, p), 'utf8') }
function assert(cond, msg) { if (!cond) throw new Error(msg) }
function assertFile(p) { assert(fs.existsSync(path.join(root, p)), `Missing ${p}`) }

assertFile('app/api/admin/suggest-annotation/route.ts')

const route = read('app/api/admin/suggest-annotation/route.ts')
assert(route.includes('export async function POST'), 'route must export POST')
assert(route.includes('claude-sonnet-4-6'), 'route must use claude-sonnet-4-6')
assert(route.includes('clamp'), 'route must clamp coordinates')
assert(route.includes('401') && route.includes('403'), 'route must check auth')
assert(route.includes('callClaude'), 'route must have retry logic via callClaude')

const canvas = read('components/AdminAnnotationEditor/AdminAnnotationCanvas.tsx')
assert(canvas.includes('AdminAnnotationCanvasHandle'), 'canvas must export handle interface')
assert(canvas.includes('captureViews'), 'canvas must expose captureViews')
assert(canvas.includes('forwardRef'), 'canvas must use forwardRef')
assert(canvas.includes('snapToGrid'), 'canvas must have snapToGrid')

const editor = read('components/AdminAnnotationEditor/AdminAnnotationEditor.tsx')
assert(editor.includes('suggestPosition'), 'editor must have suggestPosition handler')
assert(editor.includes('canvasRef'), 'editor must hold canvasRef')
assert(editor.includes('Zasugeruj pozycję'), 'editor must render suggest button label')
assert(editor.includes('snapEnabled'), 'editor must have snapEnabled state')
assert(editor.includes('odległość od centrum'), 'editor must show distance label')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['verify:ai-suggest'] === 'node scripts/verify-ai-suggest.mjs',
  'package.json must expose verify:ai-suggest'
)

console.log('AI suggest verification passed ✓')
