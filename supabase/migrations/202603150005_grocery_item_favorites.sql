alter table public.grocery_items
  add column if not exists is_favorite boolean not null default false;

create index if not exists idx_grocery_items_user_favorite
  on public.grocery_items(user_id, is_favorite);
