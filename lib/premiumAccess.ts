export type PremiumRole = 'user' | 'admin' | 'premiumUser'

export interface PremiumViewer {
  role: PremiumRole
  premiumUntil: string | null
}

export interface PremiumContent {
  id: string
  isPremium?: boolean
}

export interface PublicAccess {
  isPremium: boolean
  isLocked: boolean
}

const PREMIUM_STRUCTURE_IDS = new Set(['lung'])

export function isPremiumStructureId(id: string): boolean {
  return PREMIUM_STRUCTURE_IDS.has(id)
}

export function canAccessPremiumContent(
  viewer: PremiumViewer | null,
  now: Date = new Date(),
): boolean {
  if (!viewer) return false
  if (viewer.role === 'admin') return true
  if (viewer.role !== 'premiumUser') return false
  if (!viewer.premiumUntil) return true

  const premiumUntil = new Date(viewer.premiumUntil)
  return Number.isFinite(premiumUntil.getTime()) && premiumUntil > now
}

export function toPublicAccess(
  content: PremiumContent,
  viewer: PremiumViewer | null,
  now: Date = new Date(),
): PublicAccess {
  const isPremium = Boolean(content.isPremium) || isPremiumStructureId(content.id)

  return {
    isPremium,
    isLocked: isPremium && !canAccessPremiumContent(viewer, now),
  }
}
