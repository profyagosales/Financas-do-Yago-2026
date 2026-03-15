#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "Erro: psql nao encontrado. Instale PostgreSQL client antes de continuar."
  exit 1
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "Erro: variavel SUPABASE_DB_URL nao definida."
  echo "Exemplo: export SUPABASE_DB_URL='postgresql://postgres:<SENHA>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require'"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Erro: diretorio de migrations nao encontrado em $MIGRATIONS_DIR"
  exit 1
fi

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
create table if not exists public.schema_migrations (
  filename text primary key,
  applied_at timestamptz not null default now()
);
"

# Bootstrap para ambientes onde 0001/0002 ja foram aplicadas fora do controle local.
if [[ "$(psql "$SUPABASE_DB_URL" -At -c "select count(*) from information_schema.tables where table_schema='public' and table_name='transactions';")" != "0" ]]; then
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
  insert into public.schema_migrations(filename)
  values ('202603150001_initial_schema.sql')
  on conflict do nothing;
  "
fi

if [[ "$(psql "$SUPABASE_DB_URL" -At -c "select count(*) from information_schema.columns where table_schema='public' and table_name='attachments' and column_name='attachment_kind';")" != "0" ]]; then
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
  insert into public.schema_migrations(filename)
  values ('202603150002_finance_icons_and_attachments.sql')
  on conflict do nothing;
  "
fi

echo "Aplicando migrations em ordem alfabetica..."

while IFS= read -r file; do
  filename="$(basename "$file")"
  already_applied="$(psql "$SUPABASE_DB_URL" -At -c "select 1 from public.schema_migrations where filename='${filename}' limit 1;")"

  if [[ "$already_applied" == "1" ]]; then
    echo "-> $filename (skip: ja aplicada)"
    continue
  fi

  echo "-> $filename"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$file"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "insert into public.schema_migrations(filename) values ('${filename}');"
done < <(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name "*.sql" | sort)

echo "Migrations aplicadas com sucesso."
