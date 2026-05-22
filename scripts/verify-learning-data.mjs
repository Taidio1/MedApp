import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = process.cwd()
const anatomySource = readFileSync(
  join(projectRoot, 'lib', 'anatomyData.ts'),
  'utf8',
)
const modelIds = readdirSync(join(projectRoot, 'public', 'models'))
  .filter((fileName) => fileName.endsWith('.glb'))
  .map((fileName) => fileName.replace(/\.glb$/, ''))

function findStructureBlock(source, id) {
  const quotedKeys = [`'${id}'`, `"${id}"`, id]
  const keyIndex = quotedKeys
    .map((key) => source.indexOf(`${key}: {`))
    .find((index) => index >= 0)

  if (keyIndex == null) return null

  const start = source.indexOf('{', keyIndex)
  let depth = 0
  let inString = null
  let escaped = false

  for (let index = start; index < source.length; index += 1) {
    const char = source[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === inString) {
        inString = null
      }
      continue
    }

    if (char === "'" || char === '"' || char === '`') {
      inString = char
    } else if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(start, index + 1)
    }
  }

  return null
}

const missing = modelIds.filter((id) => {
  const block = findStructureBlock(anatomySource, id)

  if (!block) return true

  const annotationCount = (block.match(/id:\s*['"]ann-/g) ?? []).length
  return annotationCount < 3
})

if (missing.length > 0) {
  console.error(
    `Modele 3D bez minimum 3 anotacji edukacyjnych: ${missing.join(', ')}`,
  )
  process.exit(1)
}

console.log('Dane edukacyjne OK: kazdy dostepny model ma minimum 3 anotacje.')
