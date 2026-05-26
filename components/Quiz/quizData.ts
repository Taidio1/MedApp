export type QuizQuestionType = 'mcq' | 'fill' | 'image'

export interface QuizQuestion {
  id: string
  type: QuizQuestionType
  struct: string
  sys: string
  diff: 'łatwy' | 'średni' | 'trudny'
  q: string
  opts?: string[]
  correct?: number
  answer?: string
  target?: string
  hint: string
  exp: string
}

export interface QuizHistoryEntry {
  date: string
  topic: string
  score: number
  total: number
  mode: string
  time: string
}

export interface QuizLBEntry {
  rank: number
  name: string
  pts: number
  streak: number
  isMe?: boolean
}

export interface HeartArea {
  id: string
  abbr: string
  name: string
  path: string
  lx: number
  ly: number
  fill: string
  stk: string
}

export interface QuizConfig {
  system: string
  diff: string
  mode: 'Nauka' | 'Egzamin'
  count: number
}

export type Screen = 'home' | 'quiz' | 'results' | 'history' | 'leaderboard'

export const HEART_AREAS: HeartArea[] = [
  { id: 'la', abbr: 'LP', name: 'Lewy przedsionek', path: 'M 22,42 L 97,42 L 97,84 L 22,84 Z', lx: 58, ly: 64, fill: '#ede0f8', stk: '#9b74b7' },
  { id: 'ra', abbr: 'PP', name: 'Prawy przedsionek', path: 'M 103,42 L 178,42 L 178,84 L 103,84 Z', lx: 142, ly: 64, fill: '#dce8f8', stk: '#6578b5' },
  { id: 'lv', abbr: 'LK', name: 'Lewa komora', path: 'M 22,87 L 97,87 L 97,158 L 100,174 L 56,160 L 22,128 Z', lx: 59, ly: 130, fill: '#f8dcd8', stk: '#bd514d' },
  { id: 'rv', abbr: 'PK', name: 'Prawa komora', path: 'M 103,87 L 178,87 L 178,128 L 144,160 L 100,174 L 103,158 Z', lx: 142, ly: 130, fill: '#d8f0e8', stk: '#4f8a3f' },
]

export const QZ_OK = '#4f8a3f'
export const QZ_OK_SOFT = '#d8f0de'
export const QZ_ERR = '#bd514d'
export const QZ_ERR_SOFT = '#f5d8d5'

export const LETTERS = ['A', 'B', 'C', 'D']

export const normAnswer = (s: string) =>
  s.trim().toLowerCase().replace(/[.,!?]/g, '')

export const isAnswerCorrect = (q: QuizQuestion, answer: string | number | null | undefined): boolean => {
  if (answer === undefined || answer === null) return false
  if (q.type === 'mcq') return answer === q.correct
  if (q.type === 'fill') return typeof answer === 'string' && normAnswer(answer) === normAnswer(q.answer ?? '')
  if (q.type === 'image') return answer === q.target
  return false
}
