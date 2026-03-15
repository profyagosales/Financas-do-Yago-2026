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
SEED_DIR="$ROOT_DIR/supabase/seed"

if [[ ! -d "$SEED_DIR" ]]; then
  echo "Erro: diretorio de seed nao encontrado em $SEED_DIR"
  exit 1
fi

echo "Aplicando seeds em ordem alfabetica..."

while IFS= read -r file; do
  echo "-> $file"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$file"
done < <(find "$SEED_DIR" -maxdepth 1 -type f -name "*.sql" | sort)

echo "Seeds aplicados com sucesso."
