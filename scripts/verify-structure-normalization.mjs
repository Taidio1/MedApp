import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const projectRoot = process.cwd()
const sourcePath = join(projectRoot, 'lib', 'structureNormalization.ts')

if (!existsSync(sourcePath)) {
  console.error('Missing lib/structureNormalization.ts')
  process.exit(1)
}

const tempDir = mkdtempSync(join(tmpdir(), 'medapp-structure-normalization-'))
const compiledPath = join(tempDir, 'structureNormalization.mjs')

try {
  const source = readFileSync(sourcePath, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  })

  writeFileSync(compiledPath, compiled.outputText)
  const { normalizeStructuresPayload } = await import(pathToFileURL(compiledPath))

  const normalized = normalizeStructuresPayload({
    serce: {
      id: 'serce',
      namePL: 'Serce',
      nameLAT: 'Cor',
      system: 'Uklad Krazenia',
      description: '',
      biologicalNotes: '',
      annotations: [
        undefined,
        null,
        {
          id: 'ann-serce-1',
          label: 'Koniuszek serca',
          position: [0, 0, 0],
        },
        {
          id: 'ann-serce-2',
          label: 'Podstawa serca',
          position: [0, 1, 0],
          structureId: 'serce',
        },
      ],
    },
    lung: {
      id: 'lung',
      namePL: 'Pluco',
      nameLAT: 'Pulmo',
      system: 'Uklad Oddechowy',
      description: '',
      biologicalNotes: '',
    },
  })

  const heartAnnotations = normalized.serce.annotations
  if (heartAnnotations.length !== 2) {
    console.error(`Expected 2 valid annotations, got ${heartAnnotations.length}`)
    process.exit(1)
  }

  if (!heartAnnotations.every((annotation) => annotation.structureId === 'serce')) {
    console.error('Valid annotations must have the owning structureId')
    process.exit(1)
  }

  if (!Array.isArray(normalized.lung.annotations) || normalized.lung.annotations.length !== 0) {
    console.error('Missing annotations must normalize to an empty array')
    process.exit(1)
  }

  console.log('Structure normalization OK: malformed annotations are filtered.')
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}
