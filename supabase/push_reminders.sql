-- Scheduled push reminder storage for Loic Marathon 2:55.
-- Run this in the Supabase SQL Editor after push_subscriptions.sql.
-- Do not use SUPABASE_SERVICE_ROLE_KEY in the frontend.

create table if not exists public.push_reminders (
  id uuid primary key default gen_random_uuid(),
  subscription_endpoint text not null,
  reminder_key text not null,
  sync_scope text not null default 'default',
  source_activity_id text,
  source_date date,
  type text not null,
  title text not null,
  body text not null,
  url text not null default '/',
  send_at timestamptz not null,
  event_time timestamptz not null,
  reminder_offset_minutes integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempts integer not null default 0,
  sent_at timestamptz,
  cancelled_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_reminders_status_check check (
    status in ('pending', 'sent', 'failed', 'cancelled')
  ),
  constraint push_reminders_unique_key unique (subscription_endpoint, reminder_key)
);

create index if not exists push_reminders_subscription_endpoint_idx
  on public.push_reminders (subscription_endpoint);

create index if not exists push_reminders_status_idx
  on public.push_reminders (status);

create index if not exists push_reminders_send_at_idx
  on public.push_reminders (send_at);

create index if not exists push_reminders_source_date_idx
  on public.push_reminders (source_date);

create index if not exists push_reminders_type_idx
  on public.push_reminders (type);

create index if not exists push_reminders_sync_scope_idx
  on public.push_reminders (sync_scope);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_push_reminders_updated_at
  on public.push_reminders;

create trigger set_push_reminders_updated_at
before update on public.push_reminders
for each row
execute function public.set_updated_at();

alter table public.push_reminders enable row level security;

comment on table public.push_reminders is
  'Stores scheduled push reminders generated client-side from the effective plan and synced through Vercel server functions. Keep private; do not allow frontend direct writes.';

comment on column public.push_reminders.subscription_endpoint is
  'Links to public.push_subscriptions.endpoint. Vercel server functions use the Supabase service-role key.';

comment on column public.push_reminders.reminder_key is
  'Stable client-generated key used to upsert reminders and cancel stale scheduled notifications.';

comment on column public.push_reminders.sync_scope is
  'Client sync window identifier, such as current-device-next-30-days.';

comment on column public.push_reminders.payload is
  'Non-sensitive push payload metadata. Do not store subscription keys or server secrets.';
