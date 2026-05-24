const response = await fetch('http://localhost:3000/api/structures')
const bodyText = await response.text()

if (!response.ok) {
  console.error(`GET /api/structures failed: ${response.status} ${bodyText}`)
  process.exit(1)
}

let body
try {
  body = JSON.parse(bodyText)
} catch {
  console.error(`GET /api/structures returned non-JSON body: ${bodyText}`)
  process.exit(1)
}

const structureIds = Object.keys(body)
if (structureIds.length === 0) {
  console.error('GET /api/structures returned no structures')
  process.exit(1)
}

console.log(`Structures API OK: ${structureIds.length} structures loaded.`)
