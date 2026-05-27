import { createSupabaseServerClient } from '@/lib/auth/server'
import type { NaukaCard, ReadingMaterial } from '@/lib/naukaData'

export interface UserNaukaStats {
  totalCards: number
  knownCards: number
  sessionsThisWeek: number
  totalStudyMinutes: number
  cardsToReview: number
  newCardsToday: number
  estimatedMinutes: number
}

interface DbFlashcard {
  id: string
  question: string
  answer: string
  system: string
  difficulty: 'basic' | 'intermediate' | 'advanced'
  mnemonic: string
  details: string
  struct: string
}

interface DbSection {
  id: string
  title: string
  content: string
  sort_order: number
}

interface DbReadingMaterial {
  id: string
  sys: string
  title: string
  read_time: number
  illustration_url: string | null
  reading_sections: DbSection[]
}

export function mapDbCardToUi(c: DbFlashcard): NaukaCard {
  return {
    id: c.id,
    question: c.question,
    answer: c.answer,
    system: c.system,
    difficulty: c.difficulty,
    mnemonic: c.mnemonic,
    details: c.details,
    struct: c.struct,
  }
}

export function mapDbReadingToUi(m: DbReadingMaterial): ReadingMaterial {
  return {
    id: m.id,
    sys: m.sys,
    title: m.title,
    readTime: m.read_time,
    illustrationUrl: m.illustration_url,
    sections: (m.reading_sections ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(s => ({ id: s.id, title: s.title, content: s.content })),
  }
}

export async function fetchFlashcards(system?: string): Promise<NaukaCard[]> {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('flashcards')
    .select('id, question, answer, system, difficulty, mnemonic, details, struct')
    .order('id')
  if (system && system !== 'Wszystkie układy') {
    query = query.eq('system', system)
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return ((data ?? []) as DbFlashcard[]).map(mapDbCardToUi)
}

export async function fetchReadingMaterials(): Promise<ReadingMaterial[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('reading_materials')
    .select('id, sys, title, read_time, illustration_url, reading_sections(id, title, content, sort_order)')
  if (error) throw new Error(error.message)
  return ((data ?? []) as DbReadingMaterial[]).map(mapDbReadingToUi)
}

export async function fetchUserProgress(userId: string): Promise<Record<string, { done: number; total: number }>> {
  const supabase = await createSupabaseServerClient()

  const [allCardsRes, knownRes] = await Promise.all([
    supabase.from('flashcards').select('id, system'),
    supabase.from('user_card_progress').select('card_id').eq('user_id', userId).eq('known', true),
  ])
  if (allCardsRes.error) throw new Error(allCardsRes.error.message)
  if (knownRes.error)    throw new Error(knownRes.error.message)

  const knownSet = new Set((knownRes.data ?? []).map(r => r.card_id as string))
  const result: Record<string, { done: number; total: number }> = {}

  for (const card of allCardsRes.data ?? []) {
    const sys = card.system as string
    if (!result[sys]) result[sys] = { done: 0, total: 0 }
    result[sys].total++
    if (knownSet.has(card.id as string)) result[sys].done++
  }
  return result
}

export async function fetchUserStats(userId: string): Promise<UserNaukaStats> {
  const supabase = await createSupabaseServerClient()

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const dayAgo  = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [totalRes, knownRes, sessionsWkRes, completedRes, reviewRes, seenRes] = await Promise.all([
    supabase.from('flashcards').select('*', { count: 'exact', head: true }),
    supabase.from('user_card_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('known', true),
    supabase.from('study_sessions').select('started_at').eq('user_id', userId).gte('started_at', weekAgo),
    supabase.from('study_sessions').select('started_at, ended_at').eq('user_id', userId).not('ended_at', 'is', null),
    supabase.from('user_card_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('known', true).lt('last_reviewed_at', dayAgo),
    supabase.from('user_card_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  let totalStudyMinutes = 0
  for (const s of completedRes.data ?? []) {
    const start = s.started_at as string
    const end   = s.ended_at as string
    totalStudyMinutes += Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  }

  const uniqueActiveDays = new Set(
    (sessionsWkRes.data ?? []).map(s => {
      const d = new Date(s.started_at as string)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }),
  )

  const total         = totalRes.count ?? 0
  const seen          = seenRes.count ?? 0
  const newCardsToday = Math.min(5, Math.max(0, total - seen))
  const estimatedMinutes = Math.round(((reviewRes.count ?? 0) * 0.5) + (newCardsToday * 1.5))

  return {
    totalCards:       total,
    knownCards:       knownRes.count ?? 0,
    sessionsThisWeek: uniqueActiveDays.size,
    totalStudyMinutes,
    cardsToReview:    reviewRes.count ?? 0,
    newCardsToday,
    estimatedMinutes,
  }
}

export async function saveStudySession(params: {
  userId: string
  mode: 'nolimit' | 'pomodoro'
  system: string
  cardsTotal: number
  cardsKnown: number
  startedAt: string
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('study_sessions').insert({
    user_id:     params.userId,
    mode:        params.mode,
    system:      params.system,
    cards_total: params.cardsTotal,
    cards_known: params.cardsKnown,
    started_at:  params.startedAt,
    ended_at:    new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

export async function upsertCardProgress(params: {
  userId: string
  cardId: string
  known: boolean
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('user_card_progress').upsert(
    {
      user_id:          params.userId,
      card_id:          params.cardId,
      known:            params.known,
      last_reviewed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,card_id' },
  )
  if (error) throw new Error(error.message)
}

export async function fetchUserNotes(userId: string): Promise<Record<string, string>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('user_notes')
    .select('card_id, content')
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  const result: Record<string, string> = {}
  for (const row of data ?? []) result[row.card_id as string] = row.content as string
  return result
}

export async function upsertUserNote(params: {
  userId: string
  cardId: string
  content: string
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('user_notes').upsert(
    {
      user_id:    params.userId,
      card_id:    params.cardId,
      content:    params.content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,card_id' },
  )
  if (error) throw new Error(error.message)
}
