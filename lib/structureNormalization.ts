import type { AnatomicalStructure, Annotation } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPosition(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) => typeof item === 'number' && Number.isFinite(item))
  )
}

function normalizeAnnotation(
  value: unknown,
  fallbackStructureId: string,
): Annotation | null {
  if (!isRecord(value)) return null

  const id = typeof value.id === 'string' && value.id.trim() ? value.id : null
  const label =
    typeof value.label === 'string' && value.label.trim() ? value.label : null

  if (!id || !label || !isPosition(value.position)) return null

  const structureId =
    typeof value.structureId === 'string' && value.structureId.trim()
      ? value.structureId
      : fallbackStructureId

  return {
    ...(value as unknown as Partial<Annotation>),
    id,
    label,
    position: value.position,
    structureId,
  }
}

export function normalizeStructuresPayload(
  value: unknown,
): Record<string, AnatomicalStructure> {
  if (!isRecord(value)) return {}

  const structures: Record<string, AnatomicalStructure> = {}

  for (const [fallbackId, rawStructure] of Object.entries(value)) {
    if (!isRecord(rawStructure)) continue

    const id =
      typeof rawStructure.id === 'string' && rawStructure.id.trim()
        ? rawStructure.id
        : fallbackId

    const annotations = Array.isArray(rawStructure.annotations)
      ? rawStructure.annotations
          .map((annotation) => normalizeAnnotation(annotation, id))
          .filter((annotation): annotation is Annotation => annotation !== null)
      : []

    structures[id] = {
      ...(rawStructure as unknown as Partial<AnatomicalStructure>),
      id,
      annotations,
    } as AnatomicalStructure
  }

  return structures
}
