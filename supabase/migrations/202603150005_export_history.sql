create table if not exists public.export_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null,
  export_name text not null,
  format text not null check (format in ('csv', 'json')),
  mode text,
  filters jsonb not null default '{}'::jsonb,
  row_count integer not null default 0 check (row_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_export_history_user_created
  on public.export_history(user_id, created_at desc);

alter table public.export_history enable row level security;

create policy "export_history_own_all"
on public.export_history
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
