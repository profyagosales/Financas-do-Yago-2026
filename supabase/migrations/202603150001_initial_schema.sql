create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  currency text not null default 'BRL',
  locale text not null default 'pt-BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  institution text not null,
  account_type text not null,
  color text,
  initial_balance numeric(14,2) not null default 0,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  institution text not null,
  brand text,
  credit_limit numeric(14,2) not null default 0,
  closing_day integer not null check (closing_day between 1 and 31),
  due_day integer not null check (due_day between 1 and 31),
  color text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense','transfer','investment','mileage','grocery','goal')),
  icon text,
  color text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name, type)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense','transfer','adjustment')),
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid references public.bank_accounts(id) on delete set null,
  destination_account_id uuid references public.bank_accounts(id) on delete set null,
  credit_card_id uuid references public.credit_cards(id) on delete set null,
  competency_date date not null,
  payment_date date,
  status text not null default 'pending' check (status in ('pending','paid','canceled')),
  notes text,
  is_recurring boolean not null default false,
  recurring_rule text,
  installment_group_id uuid,
  attachment_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tx_transfer_accounts check (
    type <> 'transfer' or (account_id is not null and destination_account_id is not null and account_id <> destination_account_id)
  ),
  constraint tx_expense_source check (
    type <> 'expense' or (account_id is not null or credit_card_id is not null)
  ),
  constraint tx_category_required check (
    type in ('transfer') or category_id is not null
  )
);

create table if not exists public.transaction_tags (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (transaction_id, tag_id)
);

create table if not exists public.transaction_installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  installment_group_id uuid not null,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  installment_number integer not null,
  total_installments integer not null,
  bill_month date not null,
  amount numeric(14,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique(transaction_id, installment_number)
);

create table if not exists public.card_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  reference_month date not null,
  closing_date date not null,
  due_date date not null,
  total_amount numeric(14,2) not null default 0,
  status text not null default 'open',
  paid_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(credit_card_id, reference_month)
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  related_type text not null check (related_type in ('transaction','grocery_note','goal','investment','wishlist')),
  related_id uuid not null,
  file_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.investment_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  ticker text,
  asset_class text not null check (asset_class in ('fixed_income','fii','stock','crypto')),
  asset_subtype text,
  broker text,
  currency text not null default 'BRL',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references public.investment_assets(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('buy','sell','income','dividend','interest','deposit','withdraw','adjustment')),
  transaction_date date not null,
  quantity numeric(20,8),
  unit_price numeric(20,8),
  total_amount numeric(14,2) not null,
  fees numeric(14,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mileage_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists public.mileage_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.mileage_programs(id) on delete cascade,
  entry_type text not null check (entry_type in ('earn','transfer','redeem','expire','adjustment')),
  points integer not null,
  occurred_at date not null,
  expires_at date,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid references public.grocery_lists(id) on delete set null,
  normalized_name text not null,
  raw_name text,
  quantity numeric(12,3),
  unit text,
  unit_price numeric(14,2),
  total_price numeric(14,2),
  establishment text,
  purchased_at date,
  item_category text,
  was_purchased boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grocery_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  establishment text,
  note_date date,
  total_amount numeric(14,2),
  raw_extracted_text text,
  review_status text not null default 'pending_review' check (review_status in ('pending_review','reviewed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grocery_price_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  grocery_item_id uuid references public.grocery_items(id) on delete set null,
  normalized_name text not null,
  establishment text not null,
  unit_price numeric(14,2) not null,
  quantity_reference numeric(12,3),
  unit text,
  purchased_at date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  url text,
  image_url text,
  current_price numeric(14,2),
  target_price numeric(14,2),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  store_name text,
  status text not null default 'active' check (status in ('active','bought','paused','discarded')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  target_amount numeric(14,2) not null,
  target_date date,
  category text,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'active' check (status in ('active','paused','completed')),
  destination_account_id uuid references public.bank_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.financial_goals(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  contribution_date date not null,
  source_account_id uuid references public.bank_accounts(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('system','light','dark')),
  dashboard_config jsonb not null default '{}'::jsonb,
  notification_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bank_accounts_user on public.bank_accounts(user_id);
create index if not exists idx_credit_cards_user on public.credit_cards(user_id);
create index if not exists idx_categories_user_type on public.categories(user_id, type);
create unique index if not exists idx_investment_assets_user_name_ticker on public.investment_assets(user_id, name, coalesce(ticker, ''));
create index if not exists idx_transactions_user_competency on public.transactions(user_id, competency_date);
create index if not exists idx_transactions_user_type on public.transactions(user_id, type);
create index if not exists idx_transaction_installments_user_bill on public.transaction_installments(user_id, bill_month);
create index if not exists idx_card_bills_user_ref on public.card_bills(user_id, reference_month);
create index if not exists idx_investment_transactions_user_date on public.investment_transactions(user_id, transaction_date);
create index if not exists idx_mileage_entries_user_date on public.mileage_entries(user_id, occurred_at);
create index if not exists idx_grocery_items_user_date on public.grocery_items(user_id, purchased_at);
create index if not exists idx_grocery_price_history_user_name on public.grocery_price_history(user_id, normalized_name);
create index if not exists idx_wishlist_items_user_status on public.wishlist_items(user_id, status);
create index if not exists idx_financial_goals_user_status on public.financial_goals(user_id, status);
create index if not exists idx_goal_contributions_user_goal on public.goal_contributions(user_id, goal_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger set_updated_at_bank_accounts before update on public.bank_accounts for each row execute procedure public.set_updated_at();
create trigger set_updated_at_credit_cards before update on public.credit_cards for each row execute procedure public.set_updated_at();
create trigger set_updated_at_categories before update on public.categories for each row execute procedure public.set_updated_at();
create trigger set_updated_at_tags before update on public.tags for each row execute procedure public.set_updated_at();
create trigger set_updated_at_transactions before update on public.transactions for each row execute procedure public.set_updated_at();
create trigger set_updated_at_card_bills before update on public.card_bills for each row execute procedure public.set_updated_at();
create trigger set_updated_at_investment_assets before update on public.investment_assets for each row execute procedure public.set_updated_at();
create trigger set_updated_at_investment_transactions before update on public.investment_transactions for each row execute procedure public.set_updated_at();
create trigger set_updated_at_mileage_programs before update on public.mileage_programs for each row execute procedure public.set_updated_at();
create trigger set_updated_at_mileage_entries before update on public.mileage_entries for each row execute procedure public.set_updated_at();
create trigger set_updated_at_grocery_lists before update on public.grocery_lists for each row execute procedure public.set_updated_at();
create trigger set_updated_at_grocery_items before update on public.grocery_items for each row execute procedure public.set_updated_at();
create trigger set_updated_at_grocery_notes before update on public.grocery_notes for each row execute procedure public.set_updated_at();
create trigger set_updated_at_wishlist_items before update on public.wishlist_items for each row execute procedure public.set_updated_at();
create trigger set_updated_at_financial_goals before update on public.financial_goals for each row execute procedure public.set_updated_at();
create trigger set_updated_at_goal_contributions before update on public.goal_contributions for each row execute procedure public.set_updated_at();
create trigger set_updated_at_settings before update on public.settings for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.credit_cards enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_tags enable row level security;
alter table public.transaction_installments enable row level security;
alter table public.card_bills enable row level security;
alter table public.attachments enable row level security;
alter table public.investment_assets enable row level security;
alter table public.investment_transactions enable row level security;
alter table public.mileage_programs enable row level security;
alter table public.mileage_entries enable row level security;
alter table public.grocery_lists enable row level security;
alter table public.grocery_items enable row level security;
alter table public.grocery_notes enable row level security;
alter table public.grocery_price_history enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.financial_goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.settings enable row level security;

create policy "profiles_own_all" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "bank_accounts_own_all" on public.bank_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "credit_cards_own_all" on public.credit_cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_own_all" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tags_own_all" on public.tags for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_own_all" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "installments_own_all" on public.transaction_installments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "card_bills_own_all" on public.card_bills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "attachments_own_all" on public.attachments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "investment_assets_own_all" on public.investment_assets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "investment_transactions_own_all" on public.investment_transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mileage_programs_own_all" on public.mileage_programs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mileage_entries_own_all" on public.mileage_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "grocery_lists_own_all" on public.grocery_lists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "grocery_items_own_all" on public.grocery_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "grocery_notes_own_all" on public.grocery_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "grocery_price_history_own_all" on public.grocery_price_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "wishlist_items_own_all" on public.wishlist_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "financial_goals_own_all" on public.financial_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goal_contributions_own_all" on public.goal_contributions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "settings_own_all" on public.settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transaction_tags_own_all" on public.transaction_tags
for all
using (
  exists (
    select 1
    from public.transactions t
    where t.id = transaction_tags.transaction_id
      and t.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.transactions t
    where t.id = transaction_tags.transaction_id
      and t.user_id = auth.uid()
  )
);

insert into public.mileage_programs (user_id, name)
select id, p.name
from auth.users
cross join (values ('Livelo'), ('Latam Pass'), ('Azul')) as p(name)
on conflict do nothing;
