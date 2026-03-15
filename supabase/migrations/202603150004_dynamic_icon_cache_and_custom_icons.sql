alter table public.transactions
add column if not exists icon_url text;

create table if not exists public.icon_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  normalized_query text not null,
  icon_url text not null,
  source text not null default 'auto_discovery',
  usage_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, normalized_query)
);

alter table public.icon_cache enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'icon_cache' and policyname = 'icon_cache_own_all'
  ) then
    create policy "icon_cache_own_all"
    on public.icon_cache
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end $$;

create trigger set_updated_at_icon_cache before update on public.icon_cache for each row execute procedure public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('icons', 'icons', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'icons_bucket_insert_own'
  ) then
    create policy "icons_bucket_insert_own"
    on storage.objects for insert
    with check (
      bucket_id = 'icons'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'icons_bucket_update_own'
  ) then
    create policy "icons_bucket_update_own"
    on storage.objects for update
    using (
      bucket_id = 'icons'
      and auth.uid()::text = (storage.foldername(name))[1]
    )
    with check (
      bucket_id = 'icons'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'icons_bucket_delete_own'
  ) then
    create policy "icons_bucket_delete_own"
    on storage.objects for delete
    using (
      bucket_id = 'icons'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end $$;
