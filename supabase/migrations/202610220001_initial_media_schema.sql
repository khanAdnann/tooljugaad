create extension if not exists pgcrypto;

create table if not exists public.media_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null,
  media_type text not null check (media_type in ('video', 'audio')),
  status text not null check (status in ('ready', 'processing', 'completed', 'failed')),
  title text,
  format_id text,
  result_reference text,
  error_code text,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists media_jobs_user_created_idx
  on public.media_jobs (user_id, created_at desc)
  where user_id is not null;
create index if not exists media_jobs_expiry_idx
  on public.media_jobs (expires_at)
  where expires_at is not null;

create table if not exists public.media_providers (
  id uuid primary key default gen_random_uuid(),
  provider_name text not null unique,
  display_name text not null,
  enabled boolean not null default false,
  supported_media_types text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supported_media_types_values check (
    supported_media_types <@ array['video', 'audio']::text[]
  )
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  provider_name text,
  media_type text not null check (media_type in ('video', 'audio')),
  created_at timestamptz not null default now()
);
create index if not exists usage_events_created_idx on public.usage_events (created_at desc);

alter table public.media_jobs enable row level security;
alter table public.media_providers enable row level security;
alter table public.usage_events enable row level security;

drop policy if exists "Users can read their own media jobs" on public.media_jobs;
create policy "Users can read their own media jobs"
  on public.media_jobs for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Anyone can read enabled provider status" on public.media_providers;
create policy "Anyone can read enabled provider status"
  on public.media_providers for select
  to anon, authenticated
  using (enabled = true);

revoke all on public.media_jobs from anon, authenticated;
grant select on public.media_jobs to authenticated;
revoke all on public.media_providers from anon, authenticated;
grant select on public.media_providers to anon, authenticated;
revoke all on public.usage_events from anon, authenticated;

insert into public.media_providers (provider_name, display_name, enabled, supported_media_types)
values ('direct-media', 'Direct media URL', true, array['video', 'audio'])
on conflict (provider_name) do nothing;
