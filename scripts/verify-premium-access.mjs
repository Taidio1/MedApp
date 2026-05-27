import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const projectRoot = process.cwd()
const sourcePath = path.join(projectRoot, 'lib', 'premiumAccess.ts')

function loadTypeScriptModule(filePath) {
  const source = fs.readFileSync(filePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText

  const module = { exports: {} }
  vm.runInNewContext(transpiled, {
    exports: module.exports,
    module,
    require,
    console,
  }, { filename: filePath })

  return module.exports
}

const premium = loadTypeScriptModule(sourcePath)
const now = new Date('2026-05-27T12:00:00.000Z')

assert.equal(premium.isPremiumStructureId('lung'), true)
assert.equal(premium.isPremiumStructureId('serce'), false)

assert.equal(
  premium.canAccessPremiumContent({ role: 'admin', premiumUntil: null }, now),
  true,
)
assert.equal(
  premium.canAccessPremiumContent({ role: 'premiumUser', premiumUntil: '2026-06-01T00:00:00.000Z' }, now),
  true,
)
assert.equal(
  premium.canAccessPremiumContent({ role: 'premiumUser', premiumUntil: '2026-05-01T00:00:00.000Z' }, now),
  false,
)
assert.equal(
  premium.canAccessPremiumContent({ role: 'user', premiumUntil: null }, now),
  false,
)

assert.equal(
  JSON.stringify(premium.toPublicAccess({ id: 'lung', isPremium: true }, { role: 'user', premiumUntil: null }, now)),
  JSON.stringify({ isPremium: true, isLocked: true }),
)
assert.equal(
  JSON.stringify(premium.toPublicAccess({ id: 'lung', isPremium: true }, { role: 'premiumUser', premiumUntil: null }, now)),
  JSON.stringify({ isPremium: true, isLocked: false }),
)

console.log('premium access checks passed')
