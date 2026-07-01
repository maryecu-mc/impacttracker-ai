-- Impact Tracker: impact_entries table with RLS
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists public.impact_entries (
  id                  text        primary key,
  user_id             uuid        not null references auth.users(id) on delete cascade,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  date_of_impact      date        not null,
  primary_use         text        not null default 'multi-purpose',
  raw_input           text        not null default '',
  who_benefited       text[]      not null default '{}',
  impact_types        text[]      not null default '{}',
  contribution_types  text[]      not null default '{}',
  estimated_impact    text        not null default '',
  strategic_priority  text        not null default '',
  kpi_metric          text        not null default '',
  company_value       text        not null default '',
  project_initiative  text        not null default '',
  leadership_priority text        not null default '',
  refined_outputs     jsonb
);

-- Enable Row Level Security
alter table public.impact_entries enable row level security;

-- Policies: users can only access their own rows
create policy "Users can view their own entries"
  on public.impact_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own entries"
  on public.impact_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own entries"
  on public.impact_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own entries"
  on public.impact_entries for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at on every row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_impact_entries_updated_at
  before update on public.impact_entries
  for each row execute function public.set_updated_at();
