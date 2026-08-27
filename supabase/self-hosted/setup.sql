-- ============================================================================
-- Essay Expert Pro — ADDITIVE setup for the production backend
-- project: ccxphyddlztzhcvyuvuc
--
-- SAFETY: this script never drops, truncates or deletes existing objects or
-- rows. Every statement is IF NOT EXISTS / ON CONFLICT DO NOTHING, so it is
-- safe to run more than once. Existing tables (knowledge_chapters,
-- knowledge_items, mcq_questions, economics_diagrams, essays, profiles,
-- user_roles, ai_provider_keys, ...) keep all their data and columns.
-- ============================================================================

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- roles ----
do $$ begin
  create type public.app_role as enum ('student','teacher','admin');
exception when duplicate_object then null; end $$;

create or replace function public.has_role(_user_id uuid, _role text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role::text = _role
  );
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role::text in ('teacher','admin')
  );
$$;

-- Permanent admin: vaquitavoid@gmail.com can never be downgraded or removed.
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'vaquitavoid@gmail.com'
on conflict do nothing;

create or replace function public.protect_permanent_admin()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  protected_email constant text := 'vaquitavoid@gmail.com';
  target uuid := coalesce(old.user_id, new.user_id);
begin
  if old.role::text = 'admin'
     and exists (select 1 from auth.users u where u.id = target and u.email = protected_email)
  then
    raise exception 'The permanent administrator role cannot be changed or removed.';
  end if;
  return case when tg_op = 'DELETE' then null else new end;
end $$;

drop trigger if exists protect_permanent_admin on public.user_roles;
create trigger protect_permanent_admin
  before update or delete on public.user_roles
  for each row execute function public.protect_permanent_admin();

-- ------------------------------------------------- new-user provisioning ---
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for existing users (never overwrites an existing profile).
insert into public.profiles (id, full_name)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- ------------------------------------------- columns the app also expects --
alter table public.profiles         add column if not exists school text;
alter table public.profiles         add column if not exists avatar_url text;
alter table public.essays           add column if not exists max_mark integer not null default 12;
alter table public.essays           add column if not exists latest_mark integer;
alter table public.essays           add column if not exists updated_at timestamptz not null default now();
alter table public.knowledge_documents add column if not exists doc_type text not null default 'other';
alter table public.knowledge_documents add column if not exists source_name text;
alter table public.knowledge_documents add column if not exists exam_series text;
alter table public.knowledge_documents add column if not exists storage_path text;
alter table public.knowledge_documents add column if not exists content_hash text;
alter table public.knowledge_documents add column if not exists char_count integer not null default 0;
alter table public.knowledge_documents add column if not exists status text not null default 'ready';
alter table public.knowledge_documents add column if not exists error_message text;
alter table public.knowledge_documents add column if not exists updated_at timestamptz not null default now();

-- ------------------------------------------------------- new app tables ----
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  heading text,
  token_estimate integer not null default 0,
  embedding vector(3072),
  model_version text not null default 'google/gemini-embedding-2',
  created_at timestamptz not null default now()
);
grant select on public.document_chunks to authenticated;
grant all on public.document_chunks to service_role;
alter table public.document_chunks enable row level security;
do $$ begin
  create policy dc_read on public.document_chunks for select to authenticated using (true);
  create policy dc_write_staff on public.document_chunks for all to authenticated
    using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
exception when duplicate_object then null; end $$;
create index if not exists document_chunks_doc_idx on public.document_chunks(document_id, chunk_index);

create table if not exists public.essay_versions (
  id uuid primary key default gen_random_uuid(),
  essay_id uuid not null references public.essays(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null default 1,
  essay_text text not null,
  grading jsonb not null default '{}'::jsonb,
  total_mark integer,
  ao1_awarded integer,
  ao2_awarded integer,
  ao3_awarded integer,
  confidence numeric,
  audited boolean not null default false,
  sources jsonb not null default '[]'::jsonb,
  model text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.essay_versions to authenticated;
grant all on public.essay_versions to service_role;
alter table public.essay_versions enable row level security;
do $$ begin
  create policy ev_own on public.essay_versions for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
  create policy ev_read_staff on public.essay_versions for select to authenticated
    using (public.is_staff(auth.uid()));
exception when duplicate_object then null; end $$;
create index if not exists essay_versions_essay_idx on public.essay_versions(essay_id, version desc);

create table if not exists public.mcq_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'AS Level Paper 1 practice',
  topic text,
  level text not null default 'as',
  status text not null default 'building',
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  score integer,
  total integer not null default 30,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
grant select, insert, update, delete on public.mcq_attempts to authenticated;
grant all on public.mcq_attempts to service_role;
alter table public.mcq_attempts enable row level security;
do $$ begin
  create policy mcq_own on public.mcq_attempts for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
  create policy mcq_read_staff on public.mcq_attempts for select to authenticated
    using (public.is_staff(auth.uid()));
exception when duplicate_object then null; end $$;
create index if not exists mcq_attempts_user_idx on public.mcq_attempts(user_id, created_at desc);

create table if not exists public.calibration_anchors (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  essay_text text not null,
  mark integer not null,
  max_mark integer not null default 12,
  band_label text not null default 'top',
  notes text,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.calibration_anchors to authenticated;
grant all on public.calibration_anchors to service_role;
alter table public.calibration_anchors enable row level security;
do $$ begin
  create policy anchors_read_staff on public.calibration_anchors for select to authenticated
    using (public.is_staff(auth.uid()));
  create policy anchors_write_staff on public.calibration_anchors for all to authenticated
    using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
exception when duplicate_object then null; end $$;

create table if not exists public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  feature text not null,
  model text not null,
  prompt_tokens integer,
  completion_tokens integer,
  latency_ms integer,
  ok boolean not null default true,
  error_message text,
  created_at timestamptz not null default now()
);
grant select on public.ai_usage_log to authenticated;
grant all on public.ai_usage_log to service_role;
alter table public.ai_usage_log enable row level security;
do $$ begin
  create policy usage_read_admin on public.ai_usage_log for select to authenticated
    using (public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;
create index if not exists ai_usage_log_created_idx on public.ai_usage_log(created_at desc);

create table if not exists public.custom_diagrams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  section text not null default 'Microeconomics',
  topic text not null default 'Custom',
  level text not null default 'AS & A Level',
  represents text not null default '',
  why_used text not null default '',
  when_to_draw text not null default '',
  how_to_read text[] not null default '{}',
  labels jsonb not null default '[]'::jsonb,
  mistakes text[] not null default '{}',
  tips text[] not null default '{}',
  real_world text[] not null default '{}',
  related text[] not null default '{}',
  exam_questions text[] not null default '{}',
  spec jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.custom_diagrams to authenticated;
grant all on public.custom_diagrams to service_role;
alter table public.custom_diagrams enable row level security;
do $$ begin
  create policy custom_diagrams_read on public.custom_diagrams for select to authenticated using (true);
  create policy custom_diagrams_admin_write on public.custom_diagrams for all to authenticated
    using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

-- ------------------------------------------- RLS on the existing tables ----
-- Existing rows are untouched; these policies only define who may read/write.
alter table public.profiles      enable row level security;
alter table public.user_roles    enable row level security;
alter table public.essays        enable row level security;
alter table public.mcq_sessions  enable row level security;
alter table public.essay_writing_sessions enable row level security;
alter table public.ai_provider_keys enable row level security;
alter table public.knowledge_chapters enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.mcq_questions enable row level security;
alter table public.economics_diagrams enable row level security;
alter table public.calibration_essays enable row level security;

do $$ begin
  create policy profiles_select_own on public.profiles for select to authenticated
    using (id = auth.uid() or public.is_staff(auth.uid()));
  create policy profiles_update_own on public.profiles for update to authenticated
    using (id = auth.uid()) with check (id = auth.uid());
  create policy profiles_insert_own on public.profiles for insert to authenticated
    with check (id = auth.uid());
  create policy user_roles_select_own on public.user_roles for select to authenticated
    using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
  create policy essays_own on public.essays for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
  create policy essays_read_staff on public.essays for select to authenticated
    using (public.is_staff(auth.uid()));
  create policy mcq_sessions_own on public.mcq_sessions for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
  create policy ews_own on public.essay_writing_sessions for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
  create policy provider_keys_admin on public.ai_provider_keys for all to authenticated
    using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
  create policy chapters_read on public.knowledge_chapters for select to authenticated using (true);
  create policy chapters_write_staff on public.knowledge_chapters for all to authenticated
    using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
  create policy items_read on public.knowledge_items for select to authenticated using (true);
  create policy items_write_staff on public.knowledge_items for all to authenticated
    using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
  create policy kd_read on public.knowledge_documents for select to authenticated using (true);
  create policy kd_write_staff on public.knowledge_documents for all to authenticated
    using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
  create policy kc_read on public.knowledge_chunks for select to authenticated using (true);
  create policy kc_write_staff on public.knowledge_chunks for all to authenticated
    using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
  create policy mcqq_read on public.mcq_questions for select to authenticated using (true);
  create policy mcqq_write_staff on public.mcq_questions for all to authenticated
    using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
  create policy diagrams_read on public.economics_diagrams for select to authenticated using (true);
  create policy diagrams_write_staff on public.economics_diagrams for all to authenticated
    using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
  create policy cal_read_staff on public.calibration_essays for select to authenticated
    using (public.is_staff(auth.uid()));
  create policy cal_write_staff on public.calibration_essays for all to authenticated
    using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
exception when duplicate_object then null; end $$;

grant select on public.knowledge_chapters, public.knowledge_items, public.mcq_questions,
  public.economics_diagrams, public.knowledge_documents, public.knowledge_chunks to authenticated;
grant select, insert, update, delete on public.profiles, public.essays, public.mcq_sessions,
  public.essay_writing_sessions, public.ai_provider_keys, public.calibration_essays,
  public.knowledge_chapters, public.knowledge_items, public.mcq_questions,
  public.economics_diagrams, public.knowledge_documents, public.knowledge_chunks to authenticated;
grant select on public.user_roles to authenticated;
grant all on public.profiles, public.user_roles, public.essays, public.mcq_sessions,
  public.essay_writing_sessions, public.ai_provider_keys, public.knowledge_chapters,
  public.knowledge_items, public.knowledge_documents, public.knowledge_chunks,
  public.mcq_questions, public.economics_diagrams, public.calibration_essays to service_role;

-- --------------------------------------- existing content -> new tables ----
-- Each chapter becomes a knowledge document; each item becomes a chunk.
-- Re-running is safe: rows are matched by the deterministic chapter id.
insert into public.knowledge_documents (id, title, topic, level, doc_type, source_name, status, chunk_count, char_count)
select c.id, c.title, c.subject_area, c.level, 'notes', 'Knowledge library', 'processing',
       (select count(*) from public.knowledge_items i where i.chapter_id = c.id),
       coalesce((select sum(length(i.content)) from public.knowledge_items i where i.chapter_id = c.id), 0)
from public.knowledge_chapters c
on conflict (id) do nothing;

insert into public.document_chunks (document_id, chunk_index, heading, content, token_estimate)
select i.chapter_id, i.order_index, i.title, i.content, ceil(length(i.content) / 4.0)
from public.knowledge_items i
where not exists (
  select 1 from public.document_chunks d
  where d.document_id = i.chapter_id and d.heading = i.title and d.content = i.content
);

-- Calibration essays -> calibration anchors (kept in both places).
insert into public.calibration_anchors (id, question, essay_text, mark, max_mark, band_label, notes, created_by)
select e.id, e.question_text, e.essay_text, e.expected_mark, coalesce(e.max_mark, 12),
       coalesce(e.band, 'top'), e.examiner_notes, e.created_by
from public.calibration_essays e
on conflict (id) do nothing;

-- ------------------------------------------------- vector search support ---
create index if not exists document_chunks_embedding_idx
  on public.document_chunks using hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);

create or replace function public.match_document_chunks(
  query_embedding vector,
  match_count integer default 8,
  filter_doc_types text[] default null,
  filter_topic_id uuid default null
)
returns table (
  chunk_id uuid, document_id uuid, document_title text, doc_type text,
  heading text, content text, similarity double precision
)
language sql stable set search_path = public as $$
  select c.id, d.id, d.title, d.doc_type, c.heading, c.content,
         1 - (c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072))
  from public.document_chunks c
  join public.knowledge_documents d on d.id = c.document_id
  where c.embedding is not null
    and (filter_doc_types is null or d.doc_type = any(filter_doc_types))
  order by c.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)
  limit match_count;
$$;

-- Keyword fallback so knowledge search works before embeddings exist.
create index if not exists document_chunks_content_fts
  on public.document_chunks using gin (to_tsvector('english', content));
create index if not exists knowledge_items_content_fts
  on public.knowledge_items using gin (to_tsvector('english', title || ' ' || content));

-- --------------------------------------------------------- perf indexes ----
create index if not exists essays_user_idx on public.essays(user_id, created_at desc);
create index if not exists user_roles_user_idx on public.user_roles(user_id);
create index if not exists knowledge_items_chapter_idx on public.knowledge_items(chapter_id, order_index);
create index if not exists mcq_questions_topic_idx on public.mcq_questions(topic, level);
create index if not exists economics_diagrams_cat_idx on public.economics_diagrams(category, order_index);

-- --------------------------------------------------------------- storage ---
insert into storage.buckets (id, name, public) values ('knowledge','knowledge', false)
on conflict (id) do nothing;
do $$ begin
  create policy knowledge_read on storage.objects for select to authenticated
    using (bucket_id = 'knowledge');
  create policy knowledge_write_staff on storage.objects for all to authenticated
    using (bucket_id = 'knowledge' and public.is_staff(auth.uid()))
    with check (bucket_id = 'knowledge' and public.is_staff(auth.uid()));
exception when duplicate_object then null; end $$;
