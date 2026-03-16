alter table public.investment_assets
  add column if not exists current_value numeric(14,2);

comment on column public.investment_assets.current_value is
  'Valor atual manual informado para calculo de rentabilidade e participacao da carteira.';
