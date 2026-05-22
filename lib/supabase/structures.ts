import { SupabaseClient } from '@supabase/supabase-js'
import { AnatomicalStructure, Annotation, AnatomyLayer } from '@/lib/types'

interface LayerRow {
  layer_key: string
  label: string
  default_visible: boolean
  is_pair: boolean
  split_axis: string | null
  split_distance: number | null
  split_direction: number | null
  explode_offset: number[] | null
  base_position: number[] | null
  sort_order: number
}

interface AnnotationRow {
  annotation_key: string
  label: string
  name_lat: string | null
  description: string | null
  position: number[]
  size: number
  visible: boolean
}

interface StructureRow {
  id: string
  name_pl: string
  name_lat: string
  anatomical_system: string
  description: string
  biological_notes: string
  anatomy_layers: LayerRow[]
  annotations: AnnotationRow[]
}

function mapLayer(row: LayerRow): AnatomyLayer {
  return {
    id: row.layer_key,
    label: row.label,
    defaultVisible: row.default_visible,
    isPair: row.is_pair,
    ...(row.split_axis ? { splitAxis: row.split_axis as 'x' | 'y' | 'z' } : {}),
    ...(row.split_distance != null ? { splitDistance: row.split_distance } : {}),
    ...(row.split_direction != null ? { splitDirection: row.split_direction as 1 | -1 } : {}),
    ...(row.explode_offset ? { explodeOffset: row.explode_offset as [number, number, number] } : {}),
    ...(row.base_position ? { basePosition: row.base_position as [number, number, number] } : {}),
  }
}

function mapAnnotation(row: AnnotationRow, structureId: string): Annotation {
  return {
    id: row.annotation_key,
    label: row.label,
    ...(row.name_lat != null ? { nameLAT: row.name_lat } : {}),
    ...(row.description != null ? { description: row.description } : {}),
    position: row.position as [number, number, number],
    size: row.size,
    visible: row.visible,
    structureId,
  }
}

export async function fetchStructures(
  supabase: SupabaseClient,
): Promise<Record<string, AnatomicalStructure>> {
  const { data, error } = await supabase
    .from('anatomy_structures')
    .select(`
      id, name_pl, name_lat, anatomical_system, description, biological_notes,
      anatomy_layers (layer_key, label, default_visible, is_pair, split_axis, split_distance, split_direction, explode_offset, base_position, sort_order),
      annotations (annotation_key, label, name_lat, description, position, size, visible)
    `)
    .eq('is_published', true)
    .order('sort_order')

  if (error) throw new Error(error.message)

  const result: Record<string, AnatomicalStructure> = {}

  for (const raw of (data ?? []) as StructureRow[]) {
    const layers = (raw.anatomy_layers ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapLayer)

    result[raw.id] = {
      id: raw.id,
      namePL: raw.name_pl,
      nameLAT: raw.name_lat,
      system: raw.anatomical_system,
      description: raw.description,
      biologicalNotes: raw.biological_notes,
      annotations: (raw.annotations ?? []).map((a) => mapAnnotation(a, raw.id)),
      ...(layers.length > 0 ? { layers } : {}),
    }
  }

  return result
}
