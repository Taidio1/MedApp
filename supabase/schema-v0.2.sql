-- MedApp / Anatomy Studio v0.2 Supabase schema
-- Run in Supabase SQL Editor on a fresh project.
-- Supabase Auth keeps credentials in auth.users; public.users stores app profile + role.

begin;

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists vector;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('user', 'admin', 'premiumUser');
  end if;

  if not exists (select 1 from pg_type where typname = 'content_access_level') then
    create type public.content_access_level as enum ('public', 'premium', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'progress_status') then
    create type public.progress_status as enum ('not_started', 'in_progress', 'completed');
  end if;
end $$;

-- Shared timestamp trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- App users / profiles
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  avatar_url text,
  role public.app_role not null default 'user',
  premium_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_premium_until_role_check
    check (role <> 'premiumUser' or premium_until is null or premium_until > created_at)
);

create index if not exists users_role_idx on public.users(role);
create index if not exists users_email_idx on public.users(email);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where id = (select auth.uid())
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_premium_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_user_role() = 'admin'
    or exists (
      select 1
      from public.users
      where id = (select auth.uid())
        and role = 'premiumUser'
        and (premium_until is null or premium_until > now())
    ),
    false
  )
$$;

create or replace function public.can_access_content(required_access public.content_access_level)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case required_access
    when 'public' then true
    when 'premium' then public.is_premium_or_admin()
    when 'admin' then public.is_admin()
    else false
  end
$$;

grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_premium_or_admin() to anon, authenticated;
grant execute on function public.can_access_content(public.content_access_level) to anon, authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  initial_role public.app_role := 'user';
begin
  if new.raw_app_meta_data ->> 'role' in ('user', 'admin', 'premiumUser') then
    initial_role := (new.raw_app_meta_data ->> 'role')::public.app_role;
  end if;

  insert into public.users (id, email, display_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url',
    initial_role
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.users.display_name, excluded.display_name),
    avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.prevent_non_admin_user_privilege_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_role not in ('postgres', 'service_role', 'supabase_admin')
    and not public.is_admin() then
    if old.role is distinct from new.role
      or old.premium_until is distinct from new.premium_until
      or old.email is distinct from new.email then
      raise exception 'Only admins can change email, role, or premium_until';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_non_admin_user_privilege_change on public.users;
create trigger prevent_non_admin_user_privilege_change
before update on public.users
for each row execute function public.prevent_non_admin_user_privilege_change();

-- Anatomy catalog
create table if not exists public.anatomy_structures (
  id text primary key,
  name_pl text not null,
  name_lat text not null,
  anatomical_system text not null,
  description text not null default '',
  biological_notes text not null default '',
  model_path text,
  sort_order integer not null default 0,
  is_premium boolean not null default false,
  is_published boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists anatomy_structures_system_idx
  on public.anatomy_structures(anatomical_system);
create index if not exists anatomy_structures_published_idx
  on public.anatomy_structures(is_published, is_premium);

drop trigger if exists set_anatomy_structures_updated_at on public.anatomy_structures;
create trigger set_anatomy_structures_updated_at
before update on public.anatomy_structures
for each row execute function public.set_updated_at();

create table if not exists public.anatomy_layers (
  id uuid primary key default gen_random_uuid(),
  structure_id text not null references public.anatomy_structures(id) on delete cascade,
  layer_key text not null,
  label text not null,
  default_visible boolean not null default true,
  is_pair boolean not null default false,
  split_axis text check (split_axis in ('x', 'y', 'z')),
  split_distance numeric(8, 3),
  split_direction smallint check (split_direction in (-1, 1)),
  explode_offset double precision[],
  base_position double precision[],
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint anatomy_layers_key_unique unique (structure_id, layer_key),
  constraint anatomy_layers_explode_offset_len
    check (explode_offset is null or cardinality(explode_offset) = 3),
  constraint anatomy_layers_base_position_len
    check (base_position is null or cardinality(base_position) = 3)
);

create index if not exists anatomy_layers_structure_idx
  on public.anatomy_layers(structure_id, sort_order);

drop trigger if exists set_anatomy_layers_updated_at on public.anatomy_layers;
create trigger set_anatomy_layers_updated_at
before update on public.anatomy_layers
for each row execute function public.set_updated_at();

create or replace function public.can_access_structure(target_structure_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.anatomy_structures s
    where s.id = target_structure_id
      and (
        public.is_admin()
        or (
          s.is_published
          and (s.is_premium = false or public.is_premium_or_admin())
        )
      )
  )
$$;

grant execute on function public.can_access_structure(text) to anon, authenticated;

-- 3D annotations, replacing production use of data/annotations.json
create table if not exists public.annotations (
  id uuid primary key default gen_random_uuid(),
  structure_id text not null references public.anatomy_structures(id) on delete cascade,
  annotation_key text not null,
  label text not null,
  name_lat text,
  description text,
  position double precision[] not null,
  size numeric(5, 3) not null default 0.08,
  visible boolean not null default true,
  layer_ids text[] not null default array['organ']::text[],
  quiz_prompt text,
  accepted_answers text[] not null default array[]::text[],
  difficulty text check (difficulty in ('basic', 'intermediate', 'exam')),
  is_premium boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint annotations_structure_key_unique unique (structure_id, annotation_key),
  constraint annotations_position_len check (cardinality(position) = 3),
  constraint annotations_size_range check (size >= 0.02 and size <= 0.25),
  constraint annotations_layer_ids_allowed
    check (
      layer_ids <@ array['organ', 'vessels', 'nerves', 'clinical', 'topography']::text[]
      and cardinality(layer_ids) >= 1
    )
);

create index if not exists annotations_structure_idx
  on public.annotations(structure_id, visible);

drop trigger if exists set_annotations_updated_at on public.annotations;
create trigger set_annotations_updated_at
before update on public.annotations
for each row execute function public.set_updated_at();

-- RAG documents and pgvector chunks
create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_name text,
  source_url text,
  structure_id text references public.anatomy_structures(id) on delete set null,
  access_level public.content_access_level not null default 'public',
  is_published boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_documents_structure_idx
  on public.knowledge_documents(structure_id);
create index if not exists knowledge_documents_access_idx
  on public.knowledge_documents(is_published, access_level);

drop trigger if exists set_knowledge_documents_updated_at on public.knowledge_documents;
create trigger set_knowledge_documents_updated_at
before update on public.knowledge_documents
for each row execute function public.set_updated_at();

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  structure_id text references public.anatomy_structures(id) on delete set null,
  chunk_index integer not null,
  content text not null,
  token_count integer,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint knowledge_chunks_document_index_unique unique (document_id, chunk_index)
);

create index if not exists knowledge_chunks_document_idx
  on public.knowledge_chunks(document_id);
create index if not exists knowledge_chunks_structure_idx
  on public.knowledge_chunks(structure_id);
create index if not exists knowledge_chunks_embedding_hnsw_idx
  on public.knowledge_chunks
  using hnsw (embedding vector_cosine_ops);

create or replace function public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_count integer default 5,
  filter_structure_id text default null,
  min_similarity double precision default 0
)
returns table (
  id uuid,
  document_id uuid,
  structure_id text,
  content text,
  similarity double precision,
  metadata jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    kc.id,
    kc.document_id,
    kc.structure_id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity,
    kc.metadata
  from public.knowledge_chunks kc
  join public.knowledge_documents kd on kd.id = kc.document_id
  where kc.embedding is not null
    and kd.is_published = true
    and public.can_access_content(kd.access_level)
    and (filter_structure_id is null or kc.structure_id = filter_structure_id)
    and (1 - (kc.embedding <=> query_embedding)) >= min_similarity
  order by kc.embedding <=> query_embedding
  limit greatest(1, least(match_count, 20))
$$;

grant execute on function public.match_knowledge_chunks(vector, integer, text, double precision)
  to authenticated;

-- Chat history
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  structure_id text references public.anatomy_structures(id) on delete set null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_sessions_id_user_unique unique (id, user_id)
);

create index if not exists chat_sessions_user_idx
  on public.chat_sessions(user_id, updated_at desc);

drop trigger if exists set_chat_sessions_updated_at on public.chat_sessions;
create trigger set_chat_sessions_updated_at
before update on public.chat_sessions
for each row execute function public.set_updated_at();

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (session_id, user_id)
    references public.chat_sessions(id, user_id)
    on delete cascade
);

create index if not exists chat_messages_session_idx
  on public.chat_messages(session_id, created_at);
create index if not exists chat_messages_user_idx
  on public.chat_messages(user_id, created_at desc);

-- Learning progress
create table if not exists public.user_progress (
  user_id uuid not null references public.users(id) on delete cascade,
  structure_id text not null references public.anatomy_structures(id) on delete cascade,
  status public.progress_status not null default 'not_started',
  confidence smallint check (confidence is null or confidence between 0 and 5),
  viewed_count integer not null default 0 check (viewed_count >= 0),
  last_viewed_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, structure_id)
);

create index if not exists user_progress_user_status_idx
  on public.user_progress(user_id, status);

drop trigger if exists set_user_progress_updated_at on public.user_progress;
create trigger set_user_progress_updated_at
before update on public.user_progress
for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.users enable row level security;
alter table public.anatomy_structures enable row level security;
alter table public.anatomy_layers enable row level security;
alter table public.annotations enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.user_progress enable row level security;

-- users policies
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "users_select_admin" on public.users;
create policy "users_select_admin"
on public.users for select
to authenticated
using (public.is_admin());

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
on public.users for insert
to authenticated
with check ((select auth.uid()) = id and role = 'user');

drop policy if exists "users_update_own_profile" on public.users;
create policy "users_update_own_profile"
on public.users for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "users_admin_manage" on public.users;
create policy "users_admin_manage"
on public.users for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- anatomy_structures policies
drop policy if exists "structures_select_public" on public.anatomy_structures;
create policy "structures_select_public"
on public.anatomy_structures for select
to anon, authenticated
using (is_published = true and is_premium = false);

drop policy if exists "structures_select_premium" on public.anatomy_structures;
create policy "structures_select_premium"
on public.anatomy_structures for select
to authenticated
using (is_published = true and (is_premium = false or public.is_premium_or_admin()));

drop policy if exists "structures_admin_manage" on public.anatomy_structures;
create policy "structures_admin_manage"
on public.anatomy_structures for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- anatomy_layers policies
drop policy if exists "layers_select_accessible_structure" on public.anatomy_layers;
create policy "layers_select_accessible_structure"
on public.anatomy_layers for select
to anon, authenticated
using (public.can_access_structure(structure_id));

drop policy if exists "layers_admin_manage" on public.anatomy_layers;
create policy "layers_admin_manage"
on public.anatomy_layers for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- annotations policies
drop policy if exists "annotations_select_visible_accessible" on public.annotations;
create policy "annotations_select_visible_accessible"
on public.annotations for select
to anon, authenticated
using (
  visible = true
  and public.can_access_structure(structure_id)
  and (is_premium = false or public.is_premium_or_admin())
);

drop policy if exists "annotations_admin_manage" on public.annotations;
create policy "annotations_admin_manage"
on public.annotations for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- knowledge_documents policies
drop policy if exists "knowledge_documents_select_accessible" on public.knowledge_documents;
create policy "knowledge_documents_select_accessible"
on public.knowledge_documents for select
to anon, authenticated
using (is_published = true and public.can_access_content(access_level));

drop policy if exists "knowledge_documents_admin_manage" on public.knowledge_documents;
create policy "knowledge_documents_admin_manage"
on public.knowledge_documents for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- knowledge_chunks policies
drop policy if exists "knowledge_chunks_select_accessible_documents" on public.knowledge_chunks;
create policy "knowledge_chunks_select_accessible_documents"
on public.knowledge_chunks for select
to anon, authenticated
using (
  exists (
    select 1
    from public.knowledge_documents kd
    where kd.id = knowledge_chunks.document_id
      and kd.is_published = true
      and public.can_access_content(kd.access_level)
  )
);

drop policy if exists "knowledge_chunks_admin_manage" on public.knowledge_chunks;
create policy "knowledge_chunks_admin_manage"
on public.knowledge_chunks for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- chat policies
drop policy if exists "chat_sessions_select_own" on public.chat_sessions;
create policy "chat_sessions_select_own"
on public.chat_sessions for select
to authenticated
using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "chat_sessions_insert_own" on public.chat_sessions;
create policy "chat_sessions_insert_own"
on public.chat_sessions for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "chat_sessions_update_own" on public.chat_sessions;
create policy "chat_sessions_update_own"
on public.chat_sessions for update
to authenticated
using ((select auth.uid()) = user_id or public.is_admin())
with check ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "chat_sessions_delete_own" on public.chat_sessions;
create policy "chat_sessions_delete_own"
on public.chat_sessions for delete
to authenticated
using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
on public.chat_messages for select
to authenticated
using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
on public.chat_messages for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own"
on public.chat_messages for delete
to authenticated
using ((select auth.uid()) = user_id or public.is_admin());

-- user_progress policies
drop policy if exists "user_progress_select_own" on public.user_progress;
create policy "user_progress_select_own"
on public.user_progress for select
to authenticated
using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "user_progress_insert_own" on public.user_progress;
create policy "user_progress_insert_own"
on public.user_progress for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "user_progress_update_own" on public.user_progress;
create policy "user_progress_update_own"
on public.user_progress for update
to authenticated
using ((select auth.uid()) = user_id or public.is_admin())
with check ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists "user_progress_delete_own" on public.user_progress;
create policy "user_progress_delete_own"
on public.user_progress for delete
to authenticated
using ((select auth.uid()) = user_id or public.is_admin());

-- Seed the structures currently used by the app.
insert into public.anatomy_structures (
  id,
  name_pl,
  name_lat,
  anatomical_system,
  description,
  biological_notes,
  model_path,
  sort_order,
  is_premium,
  is_published
) values
  (
    'kora-mozgowa',
    'Kora mózgowa',
    'Cortex cerebri',
    'Ośrodkowy Układ Nerwowy',
    'Zewnętrzna warstwa mózgu zbudowana z istoty szarej. Odpowiada za wyższe funkcje poznawcze, świadomość, percepcję zmysłową i kontrolę ruchów dowolnych.',
    'Grubość: 2-4 mm. Zawiera około 16 mld neuronów. Obejmuje płaty: czołowy, ciemieniowy, skroniowy i potyliczny.',
    null,
    10,
    false,
    true
  ),
  (
    'mozdzek',
    'Móżdżek',
    'Cerebellum',
    'Ośrodkowy Układ Nerwowy',
    'Część mózgu odpowiedzialna za koordynację ruchów, utrzymanie równowagi i postawy ciała.',
    'Stanowi około 10% objętości mózgu, ale zawiera ponad połowę wszystkich neuronów.',
    '/models/mozdzek.glb',
    20,
    false,
    true
  ),
  (
    'pien-mozgu',
    'Pień mózgu',
    'Truncus encephali',
    'Ośrodkowy Układ Nerwowy',
    'Łączy mózg z rdzeniem kręgowym. Kontroluje podstawowe funkcje życiowe, w tym oddychanie i pracę serca.',
    'Składa się ze śródmózgowia, mostu i rdzenia przedłużonego.',
    null,
    30,
    false,
    true
  ),
  (
    'glowa',
    'Czaszka i mózg',
    'Cranium et Encephalon',
    'Ośrodkowy Układ Nerwowy',
    'Czaszka chroni mózgowie. Model obejmuje czaszkę oraz główne elementy mózgowia.',
    'Czaszka składa się z 22 kości, a mózg człowieka zawiera około 86 mld neuronów.',
    null,
    40,
    false,
    true
  ),
  (
    'rdzen-kregowy',
    'Rdzeń kręgowy',
    'Medulla spinalis',
    'Ośrodkowy Układ Nerwowy',
    'Część OUN przebiegająca w kanale kręgowym. Przewodzi impulsy między mózgiem a resztą ciała.',
    'Ma około 40-50 cm długości i 31 par nerwów rdzeniowych.',
    null,
    50,
    false,
    true
  ),
  (
    'serce',
    'Serce',
    'Cor',
    'Układ Krążenia',
    'Narząd mięśniowy pompujący krew przez układ krwionośny.',
    'Ma 4 jamy: 2 przedsionki i 2 komory. Wykonuje około 100 000 uderzeń dziennie.',
    '/models/serce.glb',
    60,
    false,
    true
  ),
  (
    'naczynia',
    'Naczynia krwionośne',
    'Vasa sanguinea',
    'Układ Krążenia',
    'Sieć naczyń transportujących krew: tętnice, żyły i naczynia włosowate.',
    'Łączna długość naczyń w organizmie to około 100 000 km.',
    null,
    70,
    false,
    true
  ),
  (
    'lung',
    'Płuco',
    'Pulmo',
    'Układ Oddechowy',
    'Narząd odpowiedzialny za wymianę gazową: pobieranie tlenu i usuwanie dwutlenku węgla.',
    'Płuco prawe ma 3 płaty, lewe 2 płaty. Powierzchnia wymiany gazowej wynosi około 70 m2.',
    '/models/lung.glb',
    80,
    true,
    true
  ),
  (
    'stomach',
    'Żołądek',
    'Gaster',
    'Układ Pokarmowy',
    'Workowy narząd mięśniowy łączący przełyk z jelitem cienkim.',
    'Miesza pokarm z sokiem żołądkowym i wstępnie trawi białka.',
    '/models/stomach.glb',
    90,
    false,
    true
  ),
  (
    'liver',
    'Wątroba',
    'Hepar',
    'Układ Pokarmowy',
    'Największy gruczoł w organizmie człowieka, pełniący liczne funkcje metaboliczne.',
    'Odpowiada między innymi za detoksykację, produkcję żółci, syntezę białek osocza i magazynowanie glikogenu.',
    '/models/liver.glb',
    100,
    false,
    true
  ),
  (
    'kidney',
    'Nerka',
    'Ren',
    'Układ Moczowy',
    'Narząd filtrujący krew i produkujący mocz.',
    'Reguluje gospodarkę wodno-elektrolitową, ciśnienie krwi i równowagę kwasowo-zasadową.',
    '/models/kidney.glb',
    110,
    false,
    true
  )
on conflict (id) do update set
  name_pl = excluded.name_pl,
  name_lat = excluded.name_lat,
  anatomical_system = excluded.anatomical_system,
  description = excluded.description,
  biological_notes = excluded.biological_notes,
  model_path = excluded.model_path,
  sort_order = excluded.sort_order,
  is_premium = excluded.is_premium,
  is_published = excluded.is_published;

-- Seed layers for the current head model.
insert into public.anatomy_layers (
  structure_id,
  layer_key,
  label,
  default_visible,
  is_pair,
  split_axis,
  split_distance,
  split_direction,
  explode_offset,
  base_position,
  sort_order
) values
  ('glowa', 'skull_left', 'Czaszka - lewa połowa', true, true, 'x', 1.5, -1, array[-0.8, 0.2, 0.0]::double precision[], array[0.0, 0.0, 0.0]::double precision[], 10),
  ('glowa', 'skull_right', 'Czaszka - prawa połowa', true, true, 'x', 1.5, 1, array[0.8, 0.2, 0.0]::double precision[], array[0.0, 0.0, 0.0]::double precision[], 20),
  ('glowa', 'brain', 'Mózg', true, false, null, null, null, array[0.0, 1.0, 0.0]::double precision[], array[0.0, 0.0, 0.0]::double precision[], 30),
  ('glowa', 'brainstem', 'Pień mózgu', true, false, null, null, null, array[0.0, -0.5, 0.6]::double precision[], array[0.0, 0.0, 0.0]::double precision[], 40)
on conflict (structure_id, layer_key) do update set
  label = excluded.label,
  default_visible = excluded.default_visible,
  is_pair = excluded.is_pair,
  split_axis = excluded.split_axis,
  split_distance = excluded.split_distance,
  split_direction = excluded.split_direction,
  explode_offset = excluded.explode_offset,
  base_position = excluded.base_position,
  sort_order = excluded.sort_order;

-- Optional seed from the current JSON-backed admin annotations.
insert into public.annotations (
  structure_id,
  annotation_key,
  label,
  name_lat,
  description,
  position,
  size,
  visible,
  layer_ids,
  quiz_prompt,
  accepted_answers,
  difficulty
) values
  (
    'kora-mozgowa',
    'ann-kora-mozgowa-1',
    'Nowy punkt',
    'Nowy punkt',
    'Nowy punkt',
    array[-0.915, 0.986, 0.728]::double precision[],
    0.03,
    true,
    array['organ']::text[],
    null,
    array[]::text[],
    'basic'
  ),
  (
    'liver',
    'ann-liver-1',
    'Nowy punkt',
    null,
    null,
    array[0.511, 0.266, 1.0]::double precision[],
    0.03,
    true,
    array['organ']::text[],
    null,
    array[]::text[],
    'basic'
  )
on conflict (structure_id, annotation_key) do update set
  label = excluded.label,
  name_lat = excluded.name_lat,
  description = excluded.description,
  position = excluded.position,
  size = excluded.size,
  visible = excluded.visible,
  layer_ids = excluded.layer_ids,
  quiz_prompt = excluded.quiz_prompt,
  accepted_answers = excluded.accepted_answers,
  difficulty = excluded.difficulty;

alter table if exists public.reading_materials
  add column if not exists illustration_url text;

comment on column public.reading_materials.illustration_url is
  'Optional URL or public asset path for the reading material illustration.';

commit;

-- After your first admin registers, promote them manually:
-- update public.users set role = 'admin' where email = 'twoj-email@example.com';
--
-- To grant premium access:
-- update public.users
-- set role = 'premiumUser', premium_until = now() + interval '1 year'
-- where email = 'student@example.com';
