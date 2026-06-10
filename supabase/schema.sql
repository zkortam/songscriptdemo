-- Songscription catalogue — schema. Run in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.transcriptions (
  id              uuid primary key,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  title           text not null,
  file_name       text not null,
  file_path       text not null,
  file_size       integer not null,
  duration_seconds double precision not null,
  tempo_bpm       double precision not null,
  key_signature   text not null,
  key_is_estimated boolean not null default false,
  time_signature  text not null,
  track_count     integer not null,
  note_count      integer not null,
  lowest_note     integer not null,
  highest_note    integer not null,
  instruments     text[] not null default '{}',
  is_percussion_only boolean not null default false,
  difficulty_score double precision not null,
  difficulty_parts jsonb not null,
  accent_hue      integer not null,
  is_favorite     boolean not null default false,
  tags            text[] not null default '{}',
  last_practiced_at timestamptz,
  practice_count  integer not null default 0,
  accuracy_pct    double precision,
  thumb           jsonb not null
);

-- Indexes for the sort/query story
create index if not exists transcriptions_created_at_idx on public.transcriptions (created_at desc);
create index if not exists transcriptions_favorite_idx on public.transcriptions (is_favorite);
create index if not exists transcriptions_difficulty_idx on public.transcriptions (difficulty_score);
create index if not exists transcriptions_practiced_idx on public.transcriptions (last_practiced_at desc nulls last);
create index if not exists transcriptions_title_idx on public.transcriptions using gin (to_tsvector('simple', title));

-- updated_at trigger
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists transcriptions_touch on public.transcriptions;
create trigger transcriptions_touch before update on public.transcriptions
  for each row execute function public.touch_updated_at();

-- RLS on with no policies => deny all to anon/authed; the server uses the
-- service role key which bypasses RLS. The browser never touches this table.
alter table public.transcriptions enable row level security;

-- Storage: public bucket `midi` (public read; writes only via service role).
insert into storage.buckets (id, name, public)
values ('midi', 'midi', true)
on conflict (id) do nothing;

drop policy if exists "public read midi" on storage.objects;
create policy "public read midi" on storage.objects
  for select using (bucket_id = 'midi');
