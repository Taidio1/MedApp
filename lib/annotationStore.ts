import annotationStoreJson from '@/data/annotations.json'
import { Annotation, AnatomicalStructure } from './types'

export interface AnnotationStoreRecord {
  id: string
  label: string
  nameLAT?: string
  description?: string
  position: [number, number, number]
  size?: number
  visible?: boolean
}

export type AnnotationStore = Record<string, AnnotationStoreRecord[]>

const MIN_POINT_SIZE = 0.02
const MAX_POINT_SIZE = 0.25
const DEFAULT_POINT_SIZE = 0.08

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().replace(/\s+/g, ' ')
  return normalized || undefined
}

function normalizePosition(
  value: unknown,
  structureId: string,
  annotationId: string,
): [number, number, number] {
  if (!Array.isArray(value) || value.length !== 3) {
    throw new Error(`${structureId}/${annotationId}: position must contain 3 numbers`)
  }

  const position = value.map((item) => Number(item))
  if (position.some((item) => !Number.isFinite(item))) {
    throw new Error(`${structureId}/${annotationId}: position must contain finite numbers`)
  }

  return position as [number, number, number]
}

function normalizeSize(value: unknown, structureId: string, annotationId: string) {
  if (value == null) return DEFAULT_POINT_SIZE

  const size = Number(value)
  if (!Number.isFinite(size) || size < MIN_POINT_SIZE || size > MAX_POINT_SIZE) {
    throw new Error(
      `${structureId}/${annotationId}: size must be between ${MIN_POINT_SIZE} and ${MAX_POINT_SIZE}`,
    )
  }

  return size
}

export function normalizeAnnotationStore(
  rawStore: unknown,
  knownStructureIds: Iterable<string>,
): AnnotationStore {
  if (!isRecord(rawStore)) {
    throw new Error('Annotation store must be an object keyed by structure id')
  }

  const knownIds = new Set(knownStructureIds)
  const normalized: AnnotationStore = {}

  for (const [structureId, rawAnnotations] of Object.entries(rawStore)) {
    if (!knownIds.has(structureId)) {
      throw new Error(`Unknown structure id: ${structureId}`)
    }

    if (!Array.isArray(rawAnnotations)) {
      throw new Error(`${structureId}: annotations must be an array`)
    }

    const seenIds = new Set<string>()
    normalized[structureId] = rawAnnotations.map((rawAnnotation, index) => {
      if (!isRecord(rawAnnotation)) {
        throw new Error(`${structureId}/${index}: annotation must be an object`)
      }

      const id = normalizeText(rawAnnotation.id)
      if (!id) {
        throw new Error(`${structureId}/${index}: id is required`)
      }

      if (seenIds.has(id)) {
        throw new Error(`${structureId}/${id}: duplicate annotation id`)
      }
      seenIds.add(id)

      const label = normalizeText(rawAnnotation.label)
      if (!label) {
        throw new Error(`${structureId}/${id}: label is required`)
      }

      return {
        id,
        label,
        nameLAT: normalizeText(rawAnnotation.nameLAT),
        description: normalizeText(rawAnnotation.description),
        position: normalizePosition(rawAnnotation.position, structureId, id),
        size: normalizeSize(rawAnnotation.size, structureId, id),
        visible: rawAnnotation.visible === false ? false : true,
      }
    })
  }

  return normalized
}

export function annotationsForStructure(
  structureId: string,
  store: AnnotationStore,
): Annotation[] {
  return (store[structureId] ?? []).map((annotation) => ({
    ...annotation,
    structureId,
  }))
}

export function mergeStructuresWithAnnotationStore(
  baseStructures: Record<string, AnatomicalStructure>,
  store: AnnotationStore,
): Record<string, AnatomicalStructure> {
  return Object.fromEntries(
    Object.entries(baseStructures).map(([structureId, structure]) => {
      if (!(structureId in store)) return [structureId, structure]

      return [
        structureId,
        {
          ...structure,
          annotations: annotationsForStructure(structureId, store),
        },
      ]
    }),
  )
}

export function getAnnotationStoreForClient(
  knownStructureIds?: Iterable<string>,
): AnnotationStore {
  return normalizeAnnotationStore(
    annotationStoreJson,
    knownStructureIds ?? Object.keys(annotationStoreJson),
  )
}

export const annotationSizeBounds = {
  min: MIN_POINT_SIZE,
  max: MAX_POINT_SIZE,
  default: DEFAULT_POINT_SIZE,
}
