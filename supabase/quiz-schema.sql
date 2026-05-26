-- supabase/quiz-schema.sql
-- Run manually in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type           text        NOT NULL CHECK (type IN ('mcq', 'fill', 'image')),
  structure_id   text        REFERENCES public.anatomy_structures(id) ON DELETE SET NULL,
  system_name    text        NOT NULL,
  difficulty     text        NOT NULL CHECK (difficulty IN ('łatwy', 'średni', 'trudny')),
  question_text  text        NOT NULL,
  options        text[],
  correct_index  smallint,
  answer         text,
  image_target   text,
  hint           text,
  explanation    text,
  is_active      boolean     NOT NULL DEFAULT true,
  sort_order     integer     NOT NULL DEFAULT 0,
  created_by     uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mode                 text        NOT NULL CHECK (mode IN ('Nauka', 'Egzamin')),
  system_filter        text        NOT NULL DEFAULT 'Wszystkie układy',
  difficulty_filter    text        NOT NULL DEFAULT 'Wszystkie poziomy',
  total_questions      smallint    NOT NULL,
  correct_count        smallint    NOT NULL DEFAULT 0,
  max_streak           smallint    NOT NULL DEFAULT 0,
  time_elapsed_seconds integer     NOT NULL DEFAULT 0,
  completed_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_session_answers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid        NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_id   uuid        NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_answer   text,
  is_correct    boolean     NOT NULL,
  answered_at   timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE VIEW public.quiz_leaderboard AS
SELECT
  u.id            AS user_id,
  COALESCE(u.display_name, split_part(u.email, '@', 1)) AS display_name,
  COALESCE(SUM(qs.correct_count) * 280, 0)::integer     AS total_points,
  COALESCE(MAX(qs.max_streak), 0)::integer               AS best_streak,
  COUNT(qs.id)::integer                                  AS total_sessions
FROM public.users u
LEFT JOIN public.quiz_sessions qs
  ON qs.user_id = u.id AND qs.completed_at IS NOT NULL
GROUP BY u.id, u.email, u.display_name
ORDER BY total_points DESC;

GRANT SELECT ON public.quiz_leaderboard TO authenticated;

CREATE TRIGGER set_quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS quiz_questions_active_idx
  ON public.quiz_questions (is_active, difficulty, system_name);

CREATE INDEX IF NOT EXISTS quiz_sessions_user_idx
  ON public.quiz_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS quiz_session_answers_session_idx
  ON public.quiz_session_answers (session_id);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_questions_select_authenticated"
  ON public.quiz_questions FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "quiz_questions_admin_manage"
  ON public.quiz_questions FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_sessions_select_own"
  ON public.quiz_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "quiz_sessions_insert_own"
  ON public.quiz_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "quiz_sessions_update_own"
  ON public.quiz_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

ALTER TABLE public.quiz_session_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_answers_select_own"
  ON public.quiz_session_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions s
      WHERE s.id = session_id AND (s.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "quiz_answers_insert_own"
  ON public.quiz_session_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- Seed data
INSERT INTO public.quiz_questions
  (type, structure_id, system_name, difficulty, question_text, options, correct_index, hint, explanation, sort_order)
VALUES
  ('mcq', 'serce', 'Układ Krążenia', 'łatwy',
   'Ile jam posiada ludzkie serce?',
   ARRAY['Dwie (1 przedsionek + 1 komora)', 'Trzy (2 przedsionki + 1 komora)', 'Cztery (2 przedsionki + 2 komory)', 'Sześć (3 przedsionki + 3 komory)'],
   2,
   'Serce dzieli się na prawą i lewą połowę — każda ma przedsionek i komorę.',
   'Serce ma 4 jamy: prawy i lewy przedsionek (atrium) oraz prawą i lewą komorę (ventriculus). Prawa strona obsługuje krążenie płucne, lewa — systemowe.',
   10),

  ('fill', 'serce', 'Układ Krążenia', 'średni',
   'Zewnętrzna błona surowicza otaczająca serce to ___.',
   NULL, NULL,
   'Pochodzi od greckiego "peri-" (wokół) + "kardia" (serce). Łacina: pericardium.',
   'Osierdzie (pericardium) to worek surowiczo-włóknisty otaczający serce i nasady wielkich naczyń. Zawiera płyn osierdziowy zmniejszający tarcie.',
   20),

  ('mcq', 'serce', 'Układ Krążenia', 'łatwy',
   'Która zastawka oddziela lewy przedsionek od lewej komory?',
   ARRAY['Zastawka aortalna', 'Zastawka mitralna (dwudzielna)', 'Zastawka trójdzielna', 'Zastawka pnia płucnego'],
   1,
   'Ma dwa płatki — jak mitra biskupia. Łacina: valva mitralis.',
   'Zastawka mitralna (valva mitralis) reguluje przepływ utlenowanej krwi z lewego przedsionka do lewej komory. Patologie tej zastawki są najczęstszymi wadami serca.',
   30),

  ('image', 'serce', 'Układ Krążenia', 'trudny',
   'Kliknij w obszar lewej komory serca na schemacie.',
   NULL, NULL,
   'Lewa komora ma grubsze ściany — pompuje krew przez aortę do krążenia dużego.',
   'Lewa komora (ventriculus sinister) pompuje utlenowaną krew do aorty i dalej do całego ciała. Jej ściany są 2–3× grubsze od prawej komory.',
   40),

  ('fill', 'lung', 'Układ Oddechowy', 'łatwy',
   'Prawe płuco człowieka ma ___ płaty.',
   NULL, NULL,
   'Podzielone dwiema szczelinami: ukośną (obliqua) i poziomą (horizontalis).',
   'Prawe płuco ma 3 płaty: górny, środkowy i dolny. Lewe ma tylko 2 (górny i dolny) ze względu na wcisk sercowy (impressio cardiaca).',
   50);

UPDATE public.quiz_questions SET answer = 'osierdzie' WHERE question_text LIKE '%błona surowicza%';
UPDATE public.quiz_questions SET answer = 'trzy'      WHERE question_text LIKE '%prawe płuco%';
UPDATE public.quiz_questions SET image_target = 'lv'  WHERE question_text LIKE '%lewej komory%';
