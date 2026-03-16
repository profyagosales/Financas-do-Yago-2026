# Banco de Dados — Financeiro do Yago

> Última atualização: 16/03/2026  
> Banco: Supabase Postgres · RLS ativo em todas as tabelas · `pgcrypto` extension

---

## Diagrama de entidades

```
auth.users (Supabase Auth)
    │
    ├── profiles                  1:1
    ├── settings                  1:1
    │
    ├── bank_accounts             1:N
    │       └── ◄── transactions (account_id / destination_account_id)
    │       └── ◄── goal_contributions (source_account_id)
    │       └── ◄── financial_goals (destination_account_id)
    │
    ├── credit_cards              1:N
    │       └── card_bills        1:N
    │       └── ◄── transactions (credit_card_id)
    │
    ├── categories                1:N
    │       └── ◄── transactions (category_id)
    │
    ├── tags                      1:N
    │       └── transaction_tags  N:N ↔ transactions
    │
    ├── transactions              1:N
    │       └── transaction_installments  1:N
    │       └── transaction_tags          N:N
    │       └── attachments               1:N (related_type='transaction')
    │
    ├── investment_assets         1:N
    │       └── investment_transactions   1:N
    │
    ├── mileage_programs          1:N
    │       └── mileage_entries           1:N
    │
    ├── grocery_lists             1:N
    │       └── grocery_items             1:N
    ├── grocery_items             1:N
    │       └── grocery_price_history     1:N
    ├── grocery_notes             1:N
    │
    ├── wishlist_items            1:N
    │
    └── financial_goals           1:N
            └── goal_contributions  1:N
```

---

## Tabelas

### `profiles`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid PK` | Mesmo ID do `auth.users` |
| `full_name` | `text` | Nome completo |
| `avatar_url` | `text?` | URL do avatar |
| `currency` | `text` | Padrão: `BRL` |
| `locale` | `text` | Padrão: `pt-BR` |
| `created_at` / `updated_at` | `timestamptz` | Automático |

---

### `bank_accounts`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid PK` | |
| `user_id` | `uuid FK → auth.users` | |
| `name` | `text` | Nome da conta |
| `institution` | `text` | Banco/fintech |
| `account_type` | `text` | corrente · poupança · carteira · investimento |
| `icon_key` | `text?` | Chave no icon registry |
| `color` | `text?` | Cor hex opcional |
| `initial_balance` | `numeric(14,2)` | Saldo inicial |
| `reconciled_balance` | `numeric(14,2)?` | Saldo conciliado manualmente |
| `reconciled_at` | `timestamptz?` | Data da última conciliação |
| `reconciliation_notes` | `text?` | Observações da conciliação |
| `is_active` | `boolean` | Default: `true` |
| `notes` | `text?` | |

---

### `credit_cards`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid PK` | |
| `name` | `text` | Ex.: "Nubank Ultraviolet" |
| `institution` | `text` | Emissor |
| `brand` | `text?` | Visa · Mastercard · Elo |
| `credit_limit` | `numeric(14,2)` | |
| `closing_day` | `integer` | 1–31 |
| `due_day` | `integer` | 1–31 |
| `color` | `text?` | Cor hex |
| `is_active` | `boolean` | |

---

### `categories`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid PK` | |
| `name` | `text` | |
| `type` | `text` | `income` · `expense` · `transfer` · `investment` · `mileage` · `grocery` · `goal` |
| `icon` | `text?` | Chave ou emoji |
| `color` | `text?` | |
| `is_default` | `boolean` | Gerado pelo seed |
| `is_active` | `boolean` | |

**Constraint:** `unique(user_id, name, type)`

---

### `transactions`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid PK` | |
| `type` | `text` | `income` · `expense` · `transfer` · `adjustment` |
| `description` | `text` | |
| `amount` | `numeric(14,2)` | Sempre positivo |
| `category_id` | `uuid? FK → categories` | Obrigatório exceto `transfer` |
| `account_id` | `uuid? FK → bank_accounts` | Conta de débito/crédito |
| `destination_account_id` | `uuid? FK → bank_accounts` | Apenas em `transfer` |
| `credit_card_id` | `uuid? FK → credit_cards` | Compras no cartão |
| `competency_date` | `date` | Data de competência |
| `payment_date` | `date?` | Data de pagamento real |
| `status` | `text` | `pending` · `paid` · `canceled` |
| `notes` | `text?` | |
| `icon_key` | `text?` | |
| `is_recurring` | `boolean` | |
| `recurring_rule` | `text?` | `monthly` · `weekly` · `yearly` |
| `installment_group_id` | `uuid?` | Liga parcelas da mesma compra |
| `attachment_count` | `integer` | Cache do número de anexos |

**Constraints de integridade:**
- `tx_transfer_accounts`: se `transfer`, exige `account_id ≠ destination_account_id` e ambos não nulos
- `tx_expense_source`: se `expense`, exige `account_id` ou `credit_card_id`
- `tx_category_required`: categoria obrigatória exceto em `transfer`

---

### `transaction_installments`

Parcelas de uma compra parcelada.

| Coluna | Tipo | Descrição |
|---|---|---|
| `installment_group_id` | `uuid` | Chave que une todas as parcelas |
| `transaction_id` | `uuid FK → transactions` | Transação desta parcela |
| `installment_number` | `integer` | Número da parcela (1-based) |
| `total_installments` | `integer` | Total de parcelas |
| `bill_month` | `date` | Mês de cobrança na fatura |
| `amount` | `numeric(14,2)` | Valor desta parcela |

---

### `card_bills`

Faturas de cartão de crédito.

| Coluna | Tipo | Descrição |
|---|---|---|
| `credit_card_id` | `uuid FK → credit_cards` | |
| `reference_month` | `date` | Mês de referência |
| `closing_date` | `date` | Data de fechamento |
| `due_date` | `date` | Data de vencimento |
| `total_amount` | `numeric(14,2)` | |
| `status` | `text` | `open` · `closed` · `paid` |

**Constraint:** `unique(credit_card_id, reference_month)`

---

### `attachments`

Anexos polimórficos (Storage Supabase).

| Coluna | Tipo | Descrição |
|---|---|---|
| `related_type` | `text` | `transaction` · `grocery_note` · `goal` · `investment` · `wishlist` |
| `related_id` | `uuid` | ID da entidade relacionada |
| `file_path` | `text` | Caminho no bucket `attachments` |
| `mime_type` | `text` | |
| `file_size` | `bigint` | Bytes |

---

### `investment_assets`

| Coluna | Tipo | Descrição |
|---|---|---|
| `name` | `text` | Nome do ativo |
| `ticker` | `text?` | Código de negociação |
| `asset_class` | `text` | `fixed_income` · `fii` · `stock` · `crypto` |
| `asset_subtype` | `text?` | Subclasse (LCI, NTN-B, etc.) |
| `broker` | `text?` | Corretora |
| `currency` | `text` | Default: `BRL` |
| `current_value` | `numeric?` | Valor de mercado atual (input manual) |

**Constraint:** `unique(user_id, name, coalesce(ticker, ''))`

---

### `investment_transactions`

| Coluna | Tipo | Descrição |
|---|---|---|
| `asset_id` | `uuid FK → investment_assets` | |
| `transaction_type` | `text` | `buy` · `sell` · `income` · `dividend` · `interest` · `deposit` · `withdraw` · `adjustment` · `bonus` |
| `transaction_date` | `date` | |
| `quantity` | `numeric(20,8)?` | Quantidade de cotas/units |
| `unit_price` | `numeric(20,8)?` | Preço unitário |
| `total_amount` | `numeric(14,2)` | Valor total (sempre positivo) |
| `fees` | `numeric(14,2)` | Taxas (default 0) |

---

### `mileage_programs`

| Coluna | Tipo | Descrição |
|---|---|---|
| `name` | `text` | Livelo · LATAM Pass · Azul |
| `is_active` | `boolean` | |
| `goal_points` | `integer?` | Meta de pontos |
| `goal_due_date` | `date?` | Prazo da meta |
| `goal_notes` | `text?` | |

---

### `mileage_entries`

| Coluna | Tipo | Descrição |
|---|---|---|
| `program_id` | `uuid FK → mileage_programs` | |
| `entry_type` | `text` | `earn` · `transfer` · `redeem` · `expire` · `adjustment` |
| `points` | `integer` | Positivo (ganho) ou negativo (resgate/expiração) |
| `occurred_at` | `date` | |
| `expires_at` | `date?` | |
| `source` | `text?` | Origem (cartão, compra, parceiro, etc.) |

---

### `grocery_lists` / `grocery_items` / `grocery_notes` / `grocery_price_history`

Módulo Mercado — listas de compras, itens, notas fiscais e histórico de preços.

| Tabela | Chave principal |
|---|---|
| `grocery_lists` | Lista de compras (nome + status) |
| `grocery_items` | Item individual: nome normalizado, quantidade, preço unitário, estabelecimento |
| `grocery_notes` | Nota fiscal lida (texto OCR bruto + status de revisão) |
| `grocery_price_history` | Histórico de preço por item + estabelecimento + data |

`grocery_items.is_favorite` marca itens frequentes cross-lista.

---

### `wishlist_items`

| Coluna | Tipo | Descrição |
|---|---|---|
| `priority` | `text` | `low` · `medium` · `high` |
| `status` | `text` | `active` · `bought` · `paused` · `discarded` |
| `current_price` / `target_price` | `numeric?` | Para alerta de queda de preço |
| `url` / `image_url` | `text?` | |

---

### `financial_goals` / `goal_contributions`

| Tabela | Descrição |
|---|---|
| `financial_goals` | Meta financeira com valor alvo, prazo, prioridade e status |
| `goal_contributions` | Aportes parciais vinculados à meta |

`financial_goals.destination_account_id` permite vincular a meta a uma conta bancária específica.

---

### `settings`

Configurações do usuário (1 registro por usuário).

| Coluna | Tipo | Descrição |
|---|---|---|
| `theme` | `text` | `system` · `light` · `dark` |
| `dashboard_config` | `jsonb` | Configuração de layout e widgets |
| `notification_prefs` | `jsonb` | Preferências de alertas |

---

## Índices

| Índice | Tabela | Colunas |
|---|---|---|
| `idx_transactions_user_competency` | `transactions` | `(user_id, competency_date)` |
| `idx_transactions_user_type` | `transactions` | `(user_id, type)` |
| `idx_transaction_installments_user_bill` | `transaction_installments` | `(user_id, bill_month)` |
| `idx_card_bills_user_ref` | `card_bills` | `(user_id, reference_month)` |
| `idx_investment_transactions_user_date` | `investment_transactions` | `(user_id, transaction_date)` |
| `idx_mileage_entries_user_date` | `mileage_entries` | `(user_id, occurred_at)` |
| `idx_grocery_price_history_user_name` | `grocery_price_history` | `(user_id, normalized_name)` |
| `idx_financial_goals_user_status` | `financial_goals` | `(user_id, status)` |
| `idx_categories_user_type` | `categories` | `(user_id, type)` |

---

## RLS (Row Level Security)

**Todas** as tabelas têm RLS ativado. A política padrão em cada uma é:

```sql
-- Exemplo (replicado para todas as tabelas):
create policy "tabela_own_all" on public.tabela
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

O usuário só pode ler e escrever seus próprios registros. Não existe dado compartilhado entre contas.

A tabela `transaction_tags` (N:N) valida via `EXISTS` na tabela `transactions` para checar o `user_id`.

---

## Trigger `set_updated_at`

Função PostgreSQL que atualiza `updated_at` automaticamente em qualquer UPDATE:

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

Aplicada via `before update` em todas as tabelas com coluna `updated_at`.

---

## Migrations

| Arquivo | Conteúdo |
|---|---|
| `202603150001_initial_schema.sql` | Schema completo: todas as tabelas, índices, RLS, triggers |
| `202603150002_finance_icons_and_attachments.sql` | Bucket `attachments` no Storage + colunas `icon_key` nas tabelas |
| `202603150003_transaction_icon_key.sql` | Coluna `icon_key` em `transactions` |
| `202603150004_dynamic_icon_cache_and_custom_icons.sql` | Tabela de cache de ícones dinâmicos e cache Redis-like |

### Ordem de aplicação

```bash
# 1. Schema base
psql < supabase/migrations/202603150001_initial_schema.sql

# 2. Ícones e anexos
psql < supabase/migrations/202603150002_finance_icons_and_attachments.sql

# 3. icon_key em transactions
psql < supabase/migrations/202603150003_transaction_icon_key.sql

# 4. Cache de ícones dinâmicos
psql < supabase/migrations/202603150004_dynamic_icon_cache_and_custom_icons.sql

# 5. Seed: categorias padrão
psql < supabase/seed/001_base_categories.sql
```

Ou via script automatizado:

```bash
./scripts/supabase/apply-migrations.sh
./scripts/supabase/apply-seed.sh
```

---

## Seed

`supabase/seed/001_base_categories.sql` insere categorias padrão (`is_default = true`) para todos os tipos:

- **income:** Salário, Freelance, Investimentos, Dividendos, Aluguel, Outros Recebimentos
- **expense:** Alimentação, Moradia, Transporte, Saúde, Educação, Lazer, Vestuário, Tecnologia, Serviços, Assinaturas, Outros
- **transfer:** Transferência Interna
- **investment:** Aporte de Investimento
- **mileage:** Acúmulo de Milhas, Resgate de Milhas
- **grocery:** Supermercado, Feira, Farmácia, Açougue, Outros Mercado
- **goal:** Reserva de Emergência, Viagem, Bem Durável, Educação, Outros Objetivo
