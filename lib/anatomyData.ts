import { AnatomyNode } from './types'

export const baseAnatomyTree: AnatomyNode[] = [
  {
    id: 'krazenie',
    label: 'Układ Krążenia',
    icon: '♥',
    children: [
      { id: 'serce', label: 'Serce', structureId: 'serce' },
    ],
  },
  {
    id: 'oddechowy',
    label: 'Układ Oddechowy',
    icon: 'O₂',
    children: [
      { id: 'lung', label: 'Płuco', structureId: 'lung' },
    ],
  },
  {
    id: 'pokarmowy',
    label: 'Układ Pokarmowy',
    icon: 'GI',
    children: [
      { id: 'stomach', label: 'Żołądek', structureId: 'stomach' },
      { id: 'liver', label: 'Wątroba', structureId: 'liver' },
    ],
  },
  {
    id: 'moczowy',
    label: 'Układ Moczowy',
    icon: 'N',
    children: [
      { id: 'kidney', label: 'Nerka', structureId: 'kidney' },
    ],
  },
]

export const anatomyTree = baseAnatomyTree
