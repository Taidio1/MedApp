import { AnatomyNode } from './types'

export const baseAnatomyTree: AnatomyNode[] = [
  {
    id: 'oun',
    label: 'Ośrodkowy Układ Nerwowy',
    icon: '🧠',
    children: [
      {
        id: 'mozgowie',
        label: 'Mózgowie',
        children: [
          { id: 'kora', label: 'Kora mózgowa', structureId: 'kora-mozgowa' },
          { id: 'mozdzek', label: 'Móżdżek', structureId: 'mozdzek' },
          { id: 'pien', label: 'Pień mózgu', structureId: 'pien-mozgu' },
          { id: 'glowa', label: 'Czaszka i mózg (3D)', structureId: 'glowa' },
        ],
      },
      { id: 'rdzen', label: 'Rdzeń kręgowy', structureId: 'rdzen-kregowy' },
    ],
  },
  {
    id: 'krazenie',
    label: 'Układ Krążenia',
    icon: '♥',
    children: [
      { id: 'serce', label: 'Serce', structureId: 'serce' },
      { id: 'naczynia', label: 'Naczynia krwionośne', structureId: 'naczynia' },
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
