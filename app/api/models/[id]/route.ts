import { promises as fs } from 'node:fs'
import path from 'node:path'
import { getCurrentUserProfile } from '@/lib/auth/guards'
import { MODEL_IDS } from '@/lib/anatomyData'
import {
  canAccessPremiumContent,
  isPremiumStructureId,
} from '@/lib/premiumAccess'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getModelPath(id: string): string {
  if (isPremiumStructureId(id)) {
    return path.join(process.cwd(), 'data', 'private-models', `${id}.glb`)
  }

  return path.join(process.cwd(), 'public', 'models', `${id}.glb`)
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  if (!MODEL_IDS.has(id)) {
    return new Response(null, { status: 404 })
  }

  if (isPremiumStructureId(id)) {
    const profile = await getCurrentUserProfile()
    const canAccess = canAccessPremiumContent(
      profile ? { role: profile.role, premiumUntil: profile.premiumUntil } : null,
    )

    if (!canAccess) {
      return Response.json({ error: 'Premium required' }, { status: 403 })
    }
  }

  try {
    const buffer = await fs.readFile(getModelPath(id))

    return new Response(new Uint8Array(buffer), {
      headers: {
        'content-type': 'model/gltf-binary',
        'cache-control': isPremiumStructureId(id)
          ? 'private, no-store'
          : 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response(null, { status: 404 })
  }
}
