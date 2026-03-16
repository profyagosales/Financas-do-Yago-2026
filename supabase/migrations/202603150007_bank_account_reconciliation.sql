alter table public.bank_accounts
  add column if not exists reconciled_balance numeric(14,2),
  add column if not exists reconciled_at date,
  add column if not exists reconciliation_notes text;
