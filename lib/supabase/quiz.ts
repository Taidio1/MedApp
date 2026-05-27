import { createSupabaseServerClient } from '@/lib/auth/server'
import type { QuizQuestion, QuizHistoryEntry } from '@/components/Quiz/quizData'

export interface DbQuizQuestion {
  id: string
  type: 'mcq' | 'fill' | 'image'
  structure_id: string | null
  system_name: string
  difficulty: 'łatwy' | 'średni' | 'trudny'
  question_text: string
  options: string[] | null
  correct_index: number | null
  answer: string | null
  image_target: string | null
  hint: string | null
  explanation: string | null
  sort_order: number
}

export interface DbQuizSession {
  id: string
  user_id: string
  mode: 'Nauka' | 'Egzamin'
  system_filter: string
  difficulty_filter: string
  total_questions: number
  correct_count: number
  max_streak: number
  time_elapsed_seconds: number
  completed_at: string | null
  created_at: string
}

export interface DbLeaderboardEntry {
  user_id: string
  display_name: string
  total_points: number
  best_streak: number
  total_sessions: number
}

export interface UserQuizSummary {
  completedSessions: number
  averageScorePercent: number
  bestStreak: number
  totalTimeSeconds: number
}

export function mapDbQuestionToUi(q: DbQuizQuestion): QuizQuestion {
  return {
    id: q.id,
    type: q.type,
    struct: q.structure_id ?? '',
    sys: q.system_name,
    diff: q.difficulty,
    q: q.question_text,
    opts: q.options ?? undefined,
    correct: q.correct_index ?? undefined,
    answer: q.answer ?? undefined,
    target: q.image_target ?? undefined,
    hint: q.hint ?? '',
    exp: q.explanation ?? '',
  }
}

export async function fetchQuizQuestions(): Promise<DbQuizQuestion[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('id, type, structure_id, system_name, difficulty, question_text, options, correct_index, answer, image_target, hint, explanation, sort_order')
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw new Error(error.message)
  return (data ?? []) as DbQuizQuestion[]
}

export async function createQuizSession(params: {
  userId: string
  mode: 'Nauka' | 'Egzamin'
  systemFilter: string
  difficultyFilter: string
  totalQuestions: number
}): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: params.userId,
      mode: params.mode,
      system_filter: params.systemFilter,
      difficulty_filter: params.difficultyFilter,
      total_questions: params.totalQuestions,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return (data as { id: string }).id
}

export async function saveQuizAnswer(params: {
  sessionId: string
  questionId: string
  userAnswer: string
  isCorrect: boolean
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('quiz_session_answers')
    .insert({
      session_id: params.sessionId,
      question_id: params.questionId,
      user_answer: params.userAnswer,
      is_correct: params.isCorrect,
    })
  if (error) throw new Error(error.message)
}

export async function completeQuizSession(params: {
  sessionId: string
  correctCount: number
  maxStreak: number
  timeElapsedSeconds: number
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('quiz_sessions')
    .update({
      correct_count: params.correctCount,
      max_streak: params.maxStreak,
      time_elapsed_seconds: params.timeElapsedSeconds,
      completed_at: new Date().toISOString(),
    })
    .eq('id', params.sessionId)
  if (error) throw new Error(error.message)
}

export async function fetchUserQuizHistory(userId: string): Promise<QuizHistoryEntry[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('system_filter, mode, correct_count, total_questions, time_elapsed_seconds, created_at')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) throw new Error(error.message)
  return (data ?? []).map(row => {
    const d = new Date(row.created_at as string)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mins = String(Math.floor((row.time_elapsed_seconds as number) / 60)).padStart(2, '0')
    const secs = String((row.time_elapsed_seconds as number) % 60).padStart(2, '0')
    return {
      date: `${dd}.${mm}.${yyyy}`,
      topic: `${row.system_filter} – ${row.mode}`,
      score: row.correct_count as number,
      total: row.total_questions as number,
      mode: row.mode as string,
      time: `${mins}:${secs}`,
    }
  })
}

export async function fetchUserQuizSummary(userId: string): Promise<UserQuizSummary> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('correct_count, total_questions, max_streak, time_elapsed_seconds')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)

  if (error) throw new Error(error.message)

  const sessions = data ?? []
  const completedSessions = sessions.length
  const totalQuestions = sessions.reduce((sum, row) => sum + (row.total_questions as number), 0)
  const totalCorrect = sessions.reduce((sum, row) => sum + (row.correct_count as number), 0)
  const totalTimeSeconds = sessions.reduce((sum, row) => sum + (row.time_elapsed_seconds as number), 0)
  const bestStreak = sessions.reduce((best, row) => Math.max(best, row.max_streak as number), 0)

  return {
    completedSessions,
    averageScorePercent: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    bestStreak,
    totalTimeSeconds,
  }
}

export async function fetchQuizLeaderboard(): Promise<DbLeaderboardEntry[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('quiz_leaderboard')
    .select('user_id, display_name, total_points, best_streak, total_sessions')
    .limit(10)
  if (error) throw new Error(error.message)
  return (data ?? []) as DbLeaderboardEntry[]
}
