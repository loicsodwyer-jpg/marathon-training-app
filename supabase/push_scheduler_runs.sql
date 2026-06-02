-- Scheduled push reminder run log for Loic Marathon 2:55.
-- Run this in the Supabase SQL Editor after push_reminders.sql.
-- This table stores no push subscription secrets.

create table if not exists public.push_scheduler_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  dry_run boolean not null default false,
  requested_limit integer,
  processed integer not null default 0,
  sent integer not null default 0,
  failed integer not null default 0,
  skipped integer not null default 0,
  status text not null default 'running',
  error_message text,
  created_at timestamptz not null default now(),
  constraint push_scheduler_runs_status_check check (
    status in ('running', 'success', 'partial_failure', 'failed')
  )
);

create index if not exists push_scheduler_runs_started_at_idx
  on public.push_scheduler_runs (started_at desc);

create index if not exists push_scheduler_runs_status_idx
  on public.push_scheduler_runs (status);

alter table public.push_scheduler_runs enable row level security;

comment on table public.push_scheduler_runs is
  'Tracks scheduled backend reminder processing runs. Stores no push subscription secrets and helps the app show scheduler health.';

comment on column public.push_scheduler_runs.status is
  'Run status: running, success, partial_failure, or failed.';
