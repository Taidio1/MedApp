export interface NaukaCard {
  id: string
  question: string
  answer: string
  system: string
  difficulty: 'basic' | 'intermediate' | 'advanced'
  mnemonic: string
  details: string
  struct: string
}

export interface ReadingSection {
  id: string
  title: string
  content: string
}

export interface ReadingMaterial {
  id: string
  sys: string
  title: string
  readTime: number
  illustrationUrl: string | null
  sections: ReadingSection[]
}

export const NAUKA_SYSTEMS = [
  { name: 'Wszystkie układy', color: '#2a7a60' },
  { name: 'Układ Krążenia',   color: '#bd514d' },
  { name: 'Układ Oddechowy',  color: '#4f8a3f' },
  { name: 'Układ Pokarmowy',  color: '#9b74b7' },
  { name: 'OUN',              color: '#6578b5' },
  { name: 'Układ Moczowy',    color: '#48a77d' },
]
