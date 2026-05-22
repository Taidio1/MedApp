import Anthropic from '@anthropic-ai/sdk'
import { getCurrentUserProfile } from '@/lib/auth/guards'

const COORD_MIN = -1.4
const COORD_MAX = 1.4
const MAX_IMAGE_BYTES = 512 * 1024

function clamp(v: number): number {
  return Math.min(COORD_MAX, Math.max(COORD_MIN, v))
}

async function callClaude(
  client: Anthropic,
  images: string[],
  prompt: string,
): Promise<{ x: number; y: number; z: number } | null> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 128,
    temperature: 0,
    system:
      'You are an expert anatomist. Return ONLY valid JSON with no explanation, markdown, or code blocks.',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...images.slice(0, 4).map((img) => ({
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: 'image/jpeg' as const,
              data: img.replace(/^data:image\/[^;]+;base64,/, ''),
            },
          })),
        ],
      },
    ],
  })

  const text =
    response.content[0]?.type === 'text' ? response.content[0].text.trim() : ''
  try {
    const parsed = JSON.parse(text)
    if (
      typeof parsed.x === 'number' &&
      typeof parsed.y === 'number' &&
      typeof parsed.z === 'number'
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const profile = await getCurrentUserProfile()
  if (!profile) {
    return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  }
  if (profile.role !== 'admin') {
    return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Nieprawidłowy format JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  if (
    typeof b?.structureNamePL !== 'string' ||
    typeof b?.annotationLabel !== 'string' ||
    !Array.isArray(b?.images) ||
    b.images.length < 1
  ) {
    return Response.json({ error: 'Brakuje wymaganych pól' }, { status: 400 })
  }

  const { structureNamePL, annotationLabel, images } = b as {
    structureNamePL: string
    annotationLabel: string
    images: string[]
  }

  for (const img of images) {
    const raw = img.replace(/^data:image\/[^;]+;base64,/, '')
    if (Buffer.byteLength(raw, 'base64') > MAX_IMAGE_BYTES) {
      return Response.json({ error: 'Obraz zbyt duży (max 512 KB)' }, { status: 400 })
    }
  }

  const prompt =
    `This is a 3D anatomical model of "${structureNamePL}" rendered from ${Math.min(images.length, 4)} angles ` +
    `(front, right, back, top). Coordinate space: normalized, max dimension = 2.8 units, ` +
    `centered at origin, range approximately -1.4 to +1.4 on each axis.\n\n` +
    `Identify the anatomical position of: "${annotationLabel}"\n\n` +
    `Return ONLY valid JSON: {"x": number, "y": number, "z": number}`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    let coords = await callClaude(client, images, prompt)

    if (!coords) {
      const retryPrompt =
        `${prompt}\n\nIMPORTANT: Respond ONLY with the JSON object. ` +
        `Example: {"x": 0.3, "y": -0.5, "z": 0.1}`
      coords = await callClaude(client, images, retryPrompt)
    }

    if (!coords) {
      return Response.json(
        { error: 'AI nie zwróciło prawidłowej pozycji' },
        { status: 422 },
      )
    }

    const position: [number, number, number] = [
      clamp(coords.x),
      clamp(coords.y),
      clamp(coords.z),
    ]

    return Response.json({ position })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Błąd AI'
    return Response.json({ error: message }, { status: 500 })
  }
}
