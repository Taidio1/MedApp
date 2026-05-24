import { AnatomyNode, AnatomicalStructure } from './types'

export const MODEL_IDS = new Set([
  'serce',
  'lung',
  'stomach',
  'liver',
  'kidney',
])

export const SYSTEM_META = [
  { systemKey: 'Układ Krążenia',  label: 'Układ Krążenia',  icon: '♥',  order: 1 },
  { systemKey: 'Układ Oddechowy', label: 'Układ Oddechowy', icon: '🫁', order: 2 },
  { systemKey: 'Układ Pokarmowy', label: 'Układ Pokarmowy', icon: '🍽', order: 3 },
  { systemKey: 'Układ Moczowy',   label: 'Układ Moczowy',   icon: '🫘', order: 4 },
] as const

export function buildAnatomyTree(
  structures: Record<string, AnatomicalStructure>,
): AnatomyNode[] {
  const bySystem = new Map<string, AnatomicalStructure[]>()

  for (const structure of Object.values(structures)) {
    const group = bySystem.get(structure.system) ?? []
    group.push(structure)
    bySystem.set(structure.system, group)
  }

  const knownKeys = new Set<string>(SYSTEM_META.map(m => m.systemKey))

  const knownNodes: AnatomyNode[] = SYSTEM_META
    .filter(meta => bySystem.has(meta.systemKey))
    .sort((a, b) => a.order - b.order)
    .map(meta => ({
      id: meta.systemKey,
      label: meta.label,
      icon: meta.icon,
      children: (bySystem.get(meta.systemKey) ?? [])
        .sort((a, b) => a.namePL.localeCompare(b.namePL, 'pl'))
        .map(s => ({ id: s.id, label: s.namePL, structureId: s.id })),
    }))

  const unknownNodes: AnatomyNode[] = []
  for (const [key, structs] of bySystem.entries()) {
    if (!knownKeys.has(key)) {
      unknownNodes.push({
        id: key,
        label: key,
        children: structs
          .sort((a, b) => a.namePL.localeCompare(b.namePL, 'pl'))
          .map(s => ({ id: s.id, label: s.namePL, structureId: s.id })),
      })
    }
  }

  return [...knownNodes, ...unknownNodes]
}
