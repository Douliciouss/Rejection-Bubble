-- AI analysis results (structured output only; no raw prompts/responses)
-- Run after 001_schema.sql

-- Company-level analysis
create table if not exists public.company_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  content jsonb not null,
  model_used text,
  created_at timestamptz not null default now()
);

create index if not exists company_analyses_company on public.company_analyses(company_id);
create index if not exists company_analyses_user on public.company_analyses(user_id);

alter table public.company_analyses enable row level security;
create policy "Users can CRUD own company_analyses"
  on public.company_analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Dashboard-level analysis
create table if not exists public.dashboard_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content jsonb not null,
  model_used text,
  created_at timestamptz not null default now()
);

create index if not exists dashboard_analyses_user on public.dashboard_analyses(user_id);

alter table public.dashboard_analyses enable row level security;
create policy "Users can CRUD own dashboard_analyses"
  on public.dashboard_analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Weekly analysis
create table if not exists public.weekly_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content jsonb not null,
  model_used text,
  week_start date not null,
  created_at timestamptz not null default now()
);

create index if not exists weekly_analyses_user_week on public.weekly_analyses(user_id, week_start desc);

alter table public.weekly_analyses enable row level security;
create policy "Users can CRUD own weekly_analyses"
  on public.weekly_analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
