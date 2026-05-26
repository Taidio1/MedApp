import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import assert from 'node:assert/strict'
import ts from 'typescript'

const projectRoot = process.cwd()
const sourcePath = join(projectRoot, 'components', 'Viewer3D', 'cameraFocus.ts')
const source = readFileSync(sourcePath, 'utf8')
const storeSource = readFileSync(join(projectRoot, 'lib', 'store.ts'), 'utf8')
const viewerSource = readFileSync(
  join(projectRoot, 'components', 'Viewer3D', 'Viewer3D.tsx'),
  'utf8',
)

const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
})

const module = { exports: {} }
const fn = new Function('exports', 'module', output.outputText)
fn(module.exports, module)

const { getAnnotationFocusView } = module.exports

assert.equal(typeof getAnnotationFocusView, 'function')

const sidePoint = getAnnotationFocusView([2, 0.5, 0], 1.4)
assert.deepEqual(sidePoint.target, [1.2, 0.3, 0])
assert.ok(sidePoint.position[0] > 4.5, 'camera should move toward the annotation side')
assert.ok(Math.abs(sidePoint.position[1] - 1.1) < 0.001)
assert.ok(Math.abs(sidePoint.position[2]) < 0.001)

const centerPoint = getAnnotationFocusView([0, 0, 0], 1.4)
assert.deepEqual(centerPoint.target, [0, 0, 0])
assert.deepEqual(centerPoint.position, [0, 1.2, 5])

const mobilePoint = getAnnotationFocusView([0, 0, -2], 0.6)
assert.equal(mobilePoint.position[2] < -6.5, true)

assert.match(storeSource, /activeAnnotationFocusRequest:\s*0/)
assert.match(
  storeSource,
  /activeAnnotationFocusRequest:\s*annotation[\s\S]*state\.activeAnnotationFocusRequest\s*\+\s*1/,
)
assert.match(viewerSource, /AnnotationFocusWatcher/)
assert.match(viewerSource, /controlsRef/)
assert.match(viewerSource, /getAnnotationFocusView/)

console.log('Annotation camera focus verification passed')
