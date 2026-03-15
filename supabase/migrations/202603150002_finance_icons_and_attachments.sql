alter table public.bank_accounts
add column if not exists icon_key text;

alter table public.attachments
add column if not exists attachment_kind text not null default 'general'
check (attachment_kind in ('bill', 'receipt', 'general'));

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'attachments_bucket_insert_own'
  ) then
    create policy "attachments_bucket_insert_own"
    on storage.objects for insert
    with check (
      bucket_id = 'attachments'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'attachments_bucket_select_own'
  ) then
    create policy "attachments_bucket_select_own"
    on storage.objects for select
    using (
      bucket_id = 'attachments'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'attachments_bucket_update_own'
  ) then
    create policy "attachments_bucket_update_own"
    on storage.objects for update
    using (
      bucket_id = 'attachments'
      and auth.uid()::text = (storage.foldername(name))[1]
    )
    with check (
      bucket_id = 'attachments'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'attachments_bucket_delete_own'
  ) then
    create policy "attachments_bucket_delete_own"
    on storage.objects for delete
    using (
      bucket_id = 'attachments'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end $$;
