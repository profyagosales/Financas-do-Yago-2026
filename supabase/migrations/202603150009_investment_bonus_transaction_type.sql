alter table public.investment_transactions
  drop constraint if exists investment_transactions_transaction_type_check;

alter table public.investment_transactions
  add constraint investment_transactions_transaction_type_check
  check (transaction_type in ('buy','sell','income','dividend','interest','deposit','withdraw','adjustment','bonus'));
