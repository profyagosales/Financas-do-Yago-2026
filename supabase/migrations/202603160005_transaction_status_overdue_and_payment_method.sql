-- Permite status atrasado e registra forma de pagamento em transactions.

alter table public.transactions
  add column if not exists payment_method text;

alter table public.transactions
  drop constraint if exists transactions_status_check;

alter table public.transactions
  add constraint transactions_status_check
  check (status in ('pending', 'paid', 'overdue', 'canceled'));

alter table public.transactions
  drop constraint if exists transactions_payment_method_check;

alter table public.transactions
  add constraint transactions_payment_method_check
  check (
    payment_method is null
    or payment_method in ('card', 'pix', 'debit', 'cash', 'bank_transfer', 'other')
  );
