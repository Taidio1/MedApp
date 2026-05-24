import fs from 'fs'
import path from 'path'
import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'
import {
  AnnotationDifficulty,
  AnnotationPointLayer,
  annotationDifficulties,
  annotationPointLayers,
} from '@/lib/types'

function hasModel(structureId: string): boolean {
  const file = path.join(process.cwd(), 'public', 'models', `${structureId}.glb`)
  return fs.existsSync(file)
}

const MIN_POINT_SIZE = 0.02
const MAX_POINT_SIZE = 0.25
const DEFAULT_POINT_SIZE = 0.08
const allowedPointLayers = new Set<string>(annotationPointLayers)
const allowedDifficulties = new Set<string>(annotationDifficulties)

function sanitizeLayerIds(value: unknown): AnnotationPointLayer[] {
  if (!Array.isArray(value)) return ['organ']
  const layers = value.filter(
    (layer): layer is AnnotationPointLayer =>
      typeof layer === 'string' && allowedPointLayers.has(layer),
  )
  return layers.length > 0 ? layers : ['organ']
}

function sanitizeAcceptedAnswers(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((answer): answer is string => typeof answer === 'string')
    .map((answer) => answer.trim())
    .filter(Boolean)
}

function sanitizeDifficulty(value: unknown): AnnotationDifficulty {
  return typeof value === 'string' && allowedDifficulties.has(value)
    ? (value as AnnotationDifficulty)
    : 'basic'
}

interface AnnotationRecord {
  id: string
  label: string
  nameLAT?: string
  description?: string
  position: [number, number, number]
  size?: number
  visible?: boolean
  layerIds?: AnnotationPointLayer[]
  quizPrompt?: string
  acceptedAnswers?: string[]
  difficulty?: AnnotationDifficulty
}

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

export async function GET() {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected

  try {
    const supabase = await createSupabaseServerClient()

    const [structuresResult, annotationsResult] = await Promise.all([
      supabase
        .from('anatomy_structures')
        .select('id, name_pl, name_lat, anatomical_system, anatomy_layers(layer_key)')
        .eq('is_published', true)
        .order('sort_order'),
      supabase
        .from('annotations')
        .select('structure_id, annotation_key, label, name_lat, description, position, size, visible, layer_ids, quiz_prompt, accepted_answers, difficulty')
        .order('structure_id'),
    ])

    if (structuresResult.error) throw new Error(structuresResult.error.message)
    if (annotationsResult.error) throw new Error(annotationsResult.error.message)

    const structures = (structuresResult.data ?? [])
      .filter((s: Record<string, unknown>) => hasModel(s.id as string))
      .map((s: Record<string, unknown>) => ({
        id: s.id as string,
        namePL: s.name_pl as string,
        nameLAT: s.name_lat as string,
        system: s.anatomical_system as string,
        hasLayers: Array.isArray(s.anatomy_layers) && (s.anatomy_layers as unknown[]).length > 0,
      }))

    const annotations: Record<string, AnnotationRecord[]> = {}
    for (const row of (annotationsResult.data ?? []) as Record<string, unknown>[]) {
      const sid = row.structure_id as string
      if (!annotations[sid]) annotations[sid] = []
      annotations[sid].push({
        id: row.annotation_key as string,
        label: row.label as string,
        ...(row.name_lat != null ? { nameLAT: row.name_lat as string } : {}),
        ...(row.description != null ? { description: row.description as string } : {}),
        position: row.position as [number, number, number],
        size: row.size as number,
        visible: row.visible as boolean,
        layerIds: sanitizeLayerIds(row.layer_ids),
        ...(row.quiz_prompt != null ? { quizPrompt: row.quiz_prompt as string } : {}),
        acceptedAnswers: sanitizeAcceptedAnswers(row.accepted_answers),
        difficulty: sanitizeDifficulty(row.difficulty),
      })
    }

    return Response.json({ structures, annotations })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać danych'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected

  let body: { structureId?: unknown; annotations?: unknown }

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

  const structureId = body.structureId
  const incoming = body.annotations as AnnotationRecord[]

  try {
    const supabase = await createSupabaseServerClient()

    const { error: deleteError } = await supabase
      .from('annotations')
      .delete()
      .eq('structure_id', structureId)

    if (deleteError) throw new Error(deleteError.message)

    if (incoming.length > 0) {
      const rows = incoming.map((a) => ({
        structure_id: structureId,
        annotation_key: a.id,
        label: a.label,
        name_lat: a.nameLAT ?? null,
        description: a.description ?? null,
        position: a.position,
        size: a.size != null
          ? Math.min(MAX_POINT_SIZE, Math.max(MIN_POINT_SIZE, a.size))
          : DEFAULT_POINT_SIZE,
        visible: a.visible !== false,
        layer_ids: sanitizeLayerIds(a.layerIds),
        quiz_prompt: typeof a.quizPrompt === 'string' && a.quizPrompt.trim()
          ? a.quizPrompt.trim()
          : null,
        accepted_answers: sanitizeAcceptedAnswers(a.acceptedAnswers),
        difficulty: sanitizeDifficulty(a.difficulty),
      }))

      const { error: insertError } = await supabase.from('annotations').insert(rows)
      if (insertError) throw new Error(insertError.message)
    }

    return Response.json({ structureId, annotations: incoming })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się zapisać anotacji'
    return Response.json({ error: message }, { status: 400 })
  }
}
