# Supabase: acesso direto e operacao completa

Este documento explica, em nivel operacional, como me dar acesso para aplicar automaticamente migrations, seeds e ajustes no seu Supabase a partir deste ambiente.

## Objetivo

Permitir que eu execute mudancas no seu banco Supabase sem passos manuais repetitivos, com seguranca, rastreabilidade e reversibilidade.

## Modelo de acesso neste ambiente

Eu consigo operar diretamente no banco quando estas condicoes sao verdadeiras:

1. Existe conectividade de rede para o host do banco Supabase.
2. O cliente `psql` esta instalado (ja esta neste ambiente).
3. A variavel `SUPABASE_DB_URL` esta definida com credenciais validas.
4. Os SQLs estao versionados no repositorio (`supabase/migrations` e `supabase/seed`).

Sem isso, eu consigo apenas preparar arquivos e instrucoes.

## O que ja foi preparado no projeto

Foram adicionados scripts de automacao:

- `scripts/supabase/apply-migrations.sh`
- `scripts/supabase/apply-seed.sh`

E comandos npm:

- `npm run db:apply:migrations`
- `npm run db:seed`
- `npm run db:apply:all`

Esses comandos aplicam arquivos SQL em ordem alfabetica.

## Como me dar acesso direto (passo a passo)

### Passo 1: obter dados de conexao no Supabase

No painel do Supabase:

1. Abra o projeto.
2. Entre em `Project Settings`.
3. Entre em `Database`.
4. Copie a string de conexao PostgreSQL (ou monte manualmente).

Formato esperado:

```bash
postgresql://postgres:SUA_SENHA@db.SE_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
```

### Passo 2: exportar variavel de ambiente no terminal atual

No terminal deste workspace:

```bash
export SUPABASE_DB_URL='postgresql://postgres:SUA_SENHA@db.SE_PROJECT_REF.supabase.co:5432/postgres?sslmode=require'
```

Opcional (persistente para novas sessoes no zsh):

```bash
echo "export SUPABASE_DB_URL='postgresql://postgres:SUA_SENHA@db.SE_PROJECT_REF.supabase.co:5432/postgres?sslmode=require'" >> ~/.zshrc
source ~/.zshrc
```

## Validacao de acesso

Teste rapido de conectividade:

```bash
psql "$SUPABASE_DB_URL" -c 'select now(), current_user;'
```

Se esse comando responder, eu consigo aplicar SQL automaticamente.

## Execucao automatica de banco

### Aplicar apenas migrations

```bash
npm run db:apply:migrations
```

### Aplicar apenas seed

```bash
npm run db:seed
```

### Aplicar tudo

```bash
npm run db:apply:all
```

## Ordem de aplicacao atual deste projeto

1. `supabase/migrations/202603150001_initial_schema.sql`
2. `supabase/migrations/202603150002_finance_icons_and_attachments.sql`
3. `supabase/seed/001_base_categories.sql`

## O que exatamente cada etapa aplica

### Migration 001

Cria a base de dados do sistema:

- tabelas centrais (financas, investimentos, milhas, mercado, metas, wishlist)
- chaves, indices e constraints
- triggers de `updated_at`
- RLS em tabelas com `user_id`
- policies de ownership por usuario

### Migration 002

Evolucao financeira para anexos e identidade visual:

- adiciona `icon_key` em `bank_accounts`
- adiciona `attachment_kind` em `attachments`
- cria bucket privado `attachments`
- cria policies idempotentes no `storage.objects` para acesso por pasta do proprio usuario

### Seed 001

Popula categorias base para cada usuario autenticado.

## Checklist de seguranca

1. Nunca commitar `SUPABASE_DB_URL` em arquivos versionados.
2. Nao colocar senha no README ou em scripts.
3. Preferir variavel de ambiente de sessao.
4. Usar `sslmode=require` na URL.
5. Rodar comandos de alteracao somente no projeto correto (confira `PROJECT_REF`).

## Checklist de operacao segura antes de aplicar

1. Confirmar branch atual.
2. Confirmar SQLs que serao executados.
3. Confirmar ambiente alvo (producao ou dev).
4. Fazer backup logico se a mudanca for estrutural grande.
5. Executar migrations.
6. Validar tabelas, policies e bucket.
7. Executar seed se necessario.
8. Validar fluxo funcional no app.

## Como validar que deu certo

Consultas uteis:

```sql
-- tabelas
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- policies RLS
select schemaname, tablename, policyname
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- bucket attachments
select id, name, public
from storage.buckets
where id = 'attachments';

-- coluna icon_key
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'bank_accounts'
  and column_name = 'icon_key';

-- coluna attachment_kind
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'attachments'
  and column_name = 'attachment_kind';
```

## Fluxo recomendado para voce me delegar 100%

1. Voce define `SUPABASE_DB_URL` no terminal deste workspace.
2. Voce me pede explicitamente: “aplique no Supabase agora”.
3. Eu executo:
   - `npm run db:apply:migrations`
   - `npm run db:seed` (quando aplicavel)
4. Eu retorno com resumo tecnico do que foi aplicado e validado.

## O que mais eu preciso de voce para operar sem bloqueios

1. Confirmacao de ambiente alvo (`dev` ou `producao`).
2. Acesso valido via `SUPABASE_DB_URL`.
3. Se houver mudancas destrutivas, confirmacao explicita antes da execucao.

## Limites importantes

1. Sem credencial de banco, nao existe acesso direto real.
2. Se a rede bloquear conexao externa, nao consigo aplicar no servidor remoto.
3. Se houver MFA/controle extra fora da conexao SQL, voce precisara completar o passo manual correspondente.

## Solucao alternativa (se preferir nao expor DB URL)

Voce pode usar Supabase CLI com access token e `supabase link`, mas neste ambiente o CLI nao esta instalado por padrao. Nesse caso:

1. Instalar `supabase` CLI.
2. Fazer `supabase login`.
3. Fazer `supabase link --project-ref ...`.
4. Usar comando de migration do CLI.

Para automacao imediata, o caminho via `psql` acima e o mais direto.

## Troubleshooting

### Erro: `psql nao encontrado`

Instale client PostgreSQL no macOS:

```bash
brew install libpq
brew link --force libpq
```

### Erro de autenticacao

- Verifique usuario (`postgres`) e senha na URL.
- Teste `psql "$SUPABASE_DB_URL" -c 'select current_user;'`.

### Erro de SSL

- Garanta `?sslmode=require` na URL.

### Erro: `No route to host` em `db.<project-ref>.supabase.co:5432`

Isso costuma acontecer quando o host direto resolve apenas IPv6 e o ambiente atual nao tem rota IPv6.

Solucao:

1. No Supabase, use a connection string do **Pooler** (Supavisor), normalmente na porta `6543`.
2. Mantenha `sslmode=require`.
3. Exemplo de formato:

```bash
postgresql://postgres.SEU_PROJECT_REF:SUA_SENHA@aws-0-REGIAO.pooler.supabase.com:6543/postgres?sslmode=require
```

4. Reexporte a variavel e rode novamente:

```bash
export SUPABASE_DB_URL='SUA_URL_POOLER'
npm run db:apply:all
```

### Erro em migration especifica

- O script para na primeira falha (`ON_ERROR_STOP=1`).
- Corrija o SQL e execute novamente.

## Auditoria e rastreabilidade

Toda mudanca deve seguir este fluxo:

1. Arquivo SQL versionado no git.
2. Execucao por script.
3. Validacao pos-execucao.
4. Registro no historico de commit.

Isso garante reproducibilidade do ambiente inteiro.
