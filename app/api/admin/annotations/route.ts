import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { baseStructures } from '@/lib/anatomyData'
import {
  AnnotationStore,
  AnnotationStoreRecord,
  normalizeAnnotationStore,
} from '@/lib/annotationStore'
import { getCurrentUserProfile } from '@/lib/auth/guards'

const dataDirectory = path.join(process.cwd(), 'data')
const annotationsPath = path.join(dataDirectory, 'annotations.json')

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) {
    return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  }
  if (profile.role !== 'admin') {
    return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  }
  return null
}

async function readAnnotationStore(): Promise<AnnotationStore> {
  try {
    const raw = await readFile(annotationsPath, 'utf8')
    return normalizeAnnotationStore(JSON.parse(raw), Object.keys(baseStructures))
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return {}
    }

    throw error
  }
}

async function writeAnnotationStore(store: AnnotationStore) {
  await mkdir(dataDirectory, { recursive: true })

  const tmpPath = `${annotationsPath}.${Date.now()}.tmp`
  const content = `${JSON.stringify(store, null, 2)}\n`

  await writeFile(tmpPath, content, 'utf8')
  await rename(tmpPath, annotationsPath)
}

function compactStructures() {
  return Object.values(baseStructures).map((structure) => ({
    id: structure.id,
    namePL: structure.namePL,
    nameLAT: structure.nameLAT,
    system: structure.system,
    hasLayers: Boolean(structure.layers?.length),
  }))
}

export async function GET() {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected

  try {
    return Response.json({
      structures: compactStructures(),
      annotations: await readAnnotationStore(),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Nie udało się odczytać anotacji'

    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected

  let body: {
    structureId?: unknown
    annotations?: unknown
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Nieprawidłowy format JSON' }, { status: 400 })
  }

  if (typeof body.structureId !== 'string') {
    return Response.json({ error: 'Pole structureId jest wymagane' }, { status: 400 })
  }

  if (!Array.isArray(body.annotations)) {
    return Response.json({ error: 'Pole annotations musi być tablicą' }, { status: 400 })
  }

  try {
    const currentStore = await readAnnotationStore()
    const nextRawStore = {
      ...currentStore,
      [body.structureId]: body.annotations as AnnotationStoreRecord[],
    }
    const nextStore = normalizeAnnotationStore(nextRawStore, Object.keys(baseStructures))

    await writeAnnotationStore(nextStore)

    return Response.json({
      structureId: body.structureId,
      annotations: nextStore[body.structureId] ?? [],
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Nie udało się zapisać anotacji'

    return Response.json({ error: message }, { status: 400 })
  }
}
