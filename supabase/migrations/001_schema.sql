-- Reject Bubbles MVP schema
-- Run in Supabase SQL editor or via supabase db push

-- Companies (one per user per company name)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  logo_url text,
  company_url text,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

-- Tags (user-defined, for events)
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

-- Event type enum
create type event_type as enum ('reject', 'interview', 'later_applied', 'offer', 'ghost');

-- Stage enum
create type event_stage as enum ('OA', 'Phone', 'Onsite', 'HR', 'Behavioral', 'Other');

-- Events (core log entries)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  type event_type not null,
  stage event_stage not null,
  happened_at timestamptz not null,
  rejected_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

-- Event <-> Tag join
create table if not exists public.event_tags (
  event_id uuid not null references public.events(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (event_id, tag_id)
);

-- Indexes for dashboard and timeline queries
create index if not exists events_company_id on public.events(company_id);
create index if not exists events_user_happened on public.events(user_id, happened_at desc);
create index if not exists companies_user_id on public.companies(user_id);

-- RLS: private by default, row-level per user
alter table public.companies enable row level security;
alter table public.tags enable row level security;
alter table public.events enable row level security;
alter table public.event_tags enable row level security;

create policy "Users can CRUD own companies"
  on public.companies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can CRUD own tags"
  on public.tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can CRUD own events"
  on public.events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage event_tags for own events"
  on public.event_tags for all
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id and e.user_id = auth.uid()
    )
  );

-- View: bubble view model (companies with rejection count)
create or replace view public.bubble_companies as
select
  c.id,
  c.user_id,
  c.name,
  c.logo_url,
  c.company_url,
  c.created_at,
  coalesce(rej.rejections, 0)::int as rejections
from public.companies c
left join (
  select company_id, count(*) as rejections
  from public.events
  where type = 'reject'
  group by company_id
) rej on rej.company_id = c.id;

-- RLS on view: use underlying table policies (companies RLS applies via view)
alter view public.bubble_companies set (security_invoker = on);
