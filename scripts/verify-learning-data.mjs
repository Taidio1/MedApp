import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = process.cwd()
const allowedPointLayers = new Set([
  'organ',
  'vessels',
  'nerves',
  'clinical',
  'topography',
])
const allowedDifficulties = new Set(['basic', 'intermediate', 'exam'])

function read(path) {
  return readFileSync(join(projectRoot, path), 'utf8')
}

function extractArrayValues(source, propertyName) {
  const matches = [...source.matchAll(new RegExp(`${propertyName}:\\s*\\[([^\\]]*)\\]`, 'g'))]
  return matches.flatMap((match) =>
    match[1]
      .split(',')
      .map((value) => value.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean),
  )
}

const typeSource = read('lib/types.ts')
const learningSource = read('lib/learning.ts')
const schemaSource = read('supabase/schema-v0.2.sql')

const typeLayers = extractArrayValues(typeSource, 'annotationPointLayers')
const invalidTypeLayers = typeLayers.filter((layerId) => !allowedPointLayers.has(layerId))

if (invalidTypeLayers.length > 0) {
  console.error(
    `Nieprawidlowe warstwy punktow w lib/types.ts: ${invalidTypeLayers.join(', ')}`,
  )
  process.exit(1)
}

const typeDifficulties = extractArrayValues(typeSource, 'annotationDifficulties')
const invalidDifficulties = typeDifficulties.filter(
  (difficulty) => !allowedDifficulties.has(difficulty),
)

if (invalidDifficulties.length > 0) {
  console.error(
    `Nieprawidlowe poziomy trudnosci w lib/types.ts: ${invalidDifficulties.join(', ')}`,
  )
  process.exit(1)
}

for (const layerId of allowedPointLayers) {
  if (!learningSource.includes(`${layerId}:`)) {
    console.error(`Brak etykiety warstwy punktow w lib/learning.ts: ${layerId}`)
    process.exit(1)
  }
}

const learningColumns = [
  'layer_ids',
  'quiz_prompt',
  'accepted_answers',
  'difficulty',
]
const presentLearningColumns = learningColumns.filter((column) =>
  schemaSource.includes(column),
)

if (
  presentLearningColumns.length > 0 &&
  presentLearningColumns.length !== learningColumns.length
) {
  console.error(
    'Schemat Supabase zawiera tylko czesc kolumn metadanych nauki.',
  )
  process.exit(1)
}

console.log('Dane edukacyjne OK: metadane nauki i warstwy punktow sa spojne.')
