-- Profile page database readiness fixes.
-- Run after schema-v0.2.sql and quiz-schema.sql, or on an existing project.

begin;

create extension if not exists pgcrypto;

create table if not exists public.flashcards (
  id text primary key,
  question text not null,
  answer text not null,
  system text not null,
  difficulty text not null check (difficulty in ('basic', 'intermediate', 'advanced')),
  mnemonic text not null,
  details text not null,
  struct text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reading_materials (
  id uuid primary key default gen_random_uuid(),
  sys text not null unique,
  title text not null,
  read_time integer not null default 0,
  illustration_url text
);

create table if not exists public.reading_sections (
  id text not null,
  material_id uuid not null references public.reading_materials(id) on delete cascade,
  title text not null,
  content text not null,
  sort_order integer not null default 0,
  primary key (id, material_id)
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  mode text not null check (mode in ('nolimit', 'pomodoro')),
  system text not null,
  cards_total integer not null default 0,
  cards_known integer not null default 0
);

create table if not exists public.user_card_progress (
  user_id uuid not null references public.users(id) on delete cascade,
  card_id text not null references public.flashcards(id) on delete cascade,
  known boolean not null default false,
  review_count integer not null default 0,
  last_reviewed_at timestamptz,
  primary key (user_id, card_id)
);

create table if not exists public.user_notes (
  user_id uuid not null references public.users(id) on delete cascade,
  card_id text not null references public.flashcards(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table if not exists public.user_daily_learning_activity (
  user_id uuid not null references public.users(id) on delete cascade,
  activity_date date not null,
  nauka_count integer not null default 0 check (nauka_count >= 0),
  quiz_count integer not null default 0 check (quiz_count >= 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_notes_updated_at on public.user_notes;
create trigger set_user_notes_updated_at
before update on public.user_notes
for each row execute function public.set_updated_at();

alter table public.flashcards enable row level security;
alter table public.reading_materials enable row level security;
alter table public.reading_sections enable row level security;
alter table public.study_sessions enable row level security;
alter table public.user_card_progress enable row level security;
alter table public.user_notes enable row level security;
alter table public.user_daily_learning_activity enable row level security;

revoke all on table public.flashcards from public, anon;
revoke all on table public.reading_materials from public, anon;
revoke all on table public.reading_sections from public, anon;
revoke all on table public.study_sessions from public, anon;
revoke all on table public.user_card_progress from public, anon;
revoke all on table public.user_notes from public, anon;
revoke all on table public.user_daily_learning_activity from public, anon;

grant select, insert, update, delete on table public.flashcards to authenticated;
grant select, insert, update, delete on table public.reading_materials to authenticated;
grant select, insert, update, delete on table public.reading_sections to authenticated;
grant select, insert, update, delete on table public.study_sessions to authenticated;
grant select, insert, update, delete on table public.user_card_progress to authenticated;
grant select, insert, update, delete on table public.user_notes to authenticated;
grant select, insert, update, delete on table public.user_daily_learning_activity to authenticated;

drop policy if exists public_read on public.flashcards;
drop policy if exists public_read on public.reading_materials;
drop policy if exists public_read on public.reading_sections;

drop policy if exists flashcards_select_authenticated on public.flashcards;
drop policy if exists flashcards_insert_admin on public.flashcards;
drop policy if exists flashcards_update_admin on public.flashcards;
drop policy if exists flashcards_delete_admin on public.flashcards;

create policy flashcards_select_authenticated
  on public.flashcards for select
  to authenticated
  using (true);

create policy flashcards_insert_admin
  on public.flashcards for insert
  to authenticated
  with check (public.is_admin());

create policy flashcards_update_admin
  on public.flashcards for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy flashcards_delete_admin
  on public.flashcards for delete
  to authenticated
  using (public.is_admin());

drop policy if exists reading_materials_select_authenticated on public.reading_materials;
drop policy if exists reading_materials_insert_admin on public.reading_materials;
drop policy if exists reading_materials_update_admin on public.reading_materials;
drop policy if exists reading_materials_delete_admin on public.reading_materials;

create policy reading_materials_select_authenticated
  on public.reading_materials for select
  to authenticated
  using (true);

create policy reading_materials_insert_admin
  on public.reading_materials for insert
  to authenticated
  with check (public.is_admin());

create policy reading_materials_update_admin
  on public.reading_materials for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy reading_materials_delete_admin
  on public.reading_materials for delete
  to authenticated
  using (public.is_admin());

drop policy if exists reading_sections_select_authenticated on public.reading_sections;
drop policy if exists reading_sections_insert_admin on public.reading_sections;
drop policy if exists reading_sections_update_admin on public.reading_sections;
drop policy if exists reading_sections_delete_admin on public.reading_sections;

create policy reading_sections_select_authenticated
  on public.reading_sections for select
  to authenticated
  using (true);

create policy reading_sections_insert_admin
  on public.reading_sections for insert
  to authenticated
  with check (public.is_admin());

create policy reading_sections_update_admin
  on public.reading_sections for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy reading_sections_delete_admin
  on public.reading_sections for delete
  to authenticated
  using (public.is_admin());

drop policy if exists own on public.study_sessions;
drop policy if exists own_insert on public.study_sessions;
drop policy if exists own_update on public.study_sessions;
drop policy if exists study_sessions_select_own on public.study_sessions;
drop policy if exists study_sessions_insert_own on public.study_sessions;
drop policy if exists study_sessions_update_own on public.study_sessions;
drop policy if exists study_sessions_delete_own on public.study_sessions;

create policy study_sessions_select_own
  on public.study_sessions for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy study_sessions_insert_own
  on public.study_sessions for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy study_sessions_update_own
  on public.study_sessions for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy study_sessions_delete_own
  on public.study_sessions for delete
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists own on public.user_card_progress;
drop policy if exists own_insert on public.user_card_progress;
drop policy if exists own_update on public.user_card_progress;
drop policy if exists user_card_progress_select_own on public.user_card_progress;
drop policy if exists user_card_progress_insert_own on public.user_card_progress;
drop policy if exists user_card_progress_update_own on public.user_card_progress;
drop policy if exists user_card_progress_delete_own on public.user_card_progress;

create policy user_card_progress_select_own
  on public.user_card_progress for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy user_card_progress_insert_own
  on public.user_card_progress for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy user_card_progress_update_own
  on public.user_card_progress for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy user_card_progress_delete_own
  on public.user_card_progress for delete
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists own on public.user_notes;
drop policy if exists own_insert on public.user_notes;
drop policy if exists own_update on public.user_notes;
drop policy if exists user_notes_select_own on public.user_notes;
drop policy if exists user_notes_insert_own on public.user_notes;
drop policy if exists user_notes_update_own on public.user_notes;
drop policy if exists user_notes_delete_own on public.user_notes;

create policy user_notes_select_own
  on public.user_notes for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy user_notes_insert_own
  on public.user_notes for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy user_notes_update_own
  on public.user_notes for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy user_notes_delete_own
  on public.user_notes for delete
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists user_daily_learning_activity_select_own on public.user_daily_learning_activity;
drop policy if exists user_daily_learning_activity_insert_own on public.user_daily_learning_activity;
drop policy if exists user_daily_learning_activity_update_own on public.user_daily_learning_activity;
drop policy if exists user_daily_learning_activity_delete_own on public.user_daily_learning_activity;

create policy user_daily_learning_activity_select_own
  on public.user_daily_learning_activity for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy user_daily_learning_activity_insert_own
  on public.user_daily_learning_activity for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy user_daily_learning_activity_update_own
  on public.user_daily_learning_activity for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy user_daily_learning_activity_delete_own
  on public.user_daily_learning_activity for delete
  to authenticated
  using (user_id = (select auth.uid()));

alter view if exists public.quiz_leaderboard set (security_invoker = true);

do $$
begin
  if to_regprocedure('public.handle_new_auth_user()') is not null then
    revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
  end if;
end $$;

create index if not exists study_sessions_user_id_idx
  on public.study_sessions(user_id);

create index if not exists user_card_progress_card_id_idx
  on public.user_card_progress(card_id);

create index if not exists user_notes_card_id_idx
  on public.user_notes(card_id);

create index if not exists quiz_questions_structure_id_idx
  on public.quiz_questions(structure_id);

create index if not exists quiz_questions_created_by_idx
  on public.quiz_questions(created_by);

create index if not exists quiz_session_answers_question_id_idx
  on public.quiz_session_answers(question_id);

commit;
