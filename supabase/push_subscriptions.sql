-- Push subscription storage for Loic Marathon 2:55.
-- Run this in the Supabase SQL Editor.
-- Do not use SUPABASE_SERVICE_ROLE_KEY in the frontend.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_label text,
  device_label text,
  user_agent text,
  timezone text not null default 'Europe/Amsterdam',
  preferences jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  last_test_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists push_subscriptions_endpoint_key
  on public.push_subscriptions (endpoint);

create index if not exists push_subscriptions_active_idx
  on public.push_subscriptions (active);

create index if not exists push_subscriptions_last_seen_at_idx
  on public.push_subscriptions (last_seen_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_push_subscriptions_updated_at
  on public.push_subscriptions;

create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row
execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;

comment on table public.push_subscriptions is
  'Stores web push subscriptions. Frontend must not query this table directly; Vercel server functions use the Supabase service-role key.';

comment on column public.push_subscriptions.endpoint is
  'Unique browser PushSubscription endpoint. Treat as device-specific technical data.';

comment on column public.push_subscriptions.p256dh is
  'Push subscription public encryption key. Do not expose in UI responses.';

comment on column public.push_subscriptions.auth is
  'Push subscription auth secret. Do not expose in UI responses.';
