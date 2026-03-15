# Financeiro do Yago 2026

Sistema pessoal de financas com foco em uso unico, arquitetura profissional e base pronta para escalar.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Storage)
- React Hook Form + Zod
- TanStack Table
- Recharts
- PWA (manifest + service worker)

## Modulos implementados (base)

- Login
- Dashboard
- Financas
	- Mensal
	- Anual
	- Contas
	- Cartoes
	- Lancamentos
	- Categorias
- Investimentos
	- Renda Fixa
	- FIIs
	- Bolsa
	- Cripto
- Milhas
	- Livelo
	- Latam Pass
	- Azul
- Mercado
	- Listas
	- Notas fiscais
	- Historico de precos
- Lista de Desejo
- Metas
- Relatorios
- Configuracoes

## Requisitos

- Node.js 20+
- Projeto Supabase criado

## Variaveis de ambiente

Crie o arquivo .env.local:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

## Executar localmente

```bash
npm install
npm run dev
```

Aplicacao em http://localhost:3000

## Banco de dados

Arquivos SQL principais:

- supabase/migrations/202603150001_initial_schema.sql
- supabase/migrations/202603150002_finance_icons_and_attachments.sql
- supabase/seed/001_base_categories.sql

Ordem recomendada:

1. Rodar migration inicial
2. Rodar migration de icones/anexos (bucket attachments + policies)
3. Rodar seed de categorias
4. Validar RLS e policies

Automacao e acesso direto ao Supabase:

- docs/supabase_acesso_direto_operacao_completa.md

## PWA

- Manifest: public/manifest.webmanifest
- Service Worker: public/sw.js
- Registro no cliente: src/components/pwa/register-sw.tsx

## Estrutura principal

- src/app: rotas (auth e protegidas)
- src/actions: server actions
- src/lib: supabase, validacoes, calculos e utilitarios
- src/types: tipos de dominio
- src/components: UI, layout, formularios e dashboard
- supabase: migrations e seed

## Observacoes

- O projeto ja contem a navegacao completa dos modulos e base de CRUD para evolucao.
- Lancamentos agora suportam upload de boleto e comprovante por registro, com links para download.
- Contas suportam catalogo amplo de instituicoes (bancos, carteiras, utilidades) com icones e fallback visual.
- O catalogo de icones foi expandido para bancos, cartoes, corretoras, cripto, milhas, mercados, utilidades e telecom.
- O catalogo agora inclui tambem assinaturas e SaaS (ex.: Netflix, Prime Video, Spotify, ChatGPT, Notion, Microsoft 365) e icones genericos para despesas nao-brand (aluguel, academia, agua, luz, internet, impostos etc.).
- Lancamentos aceitam selecao manual de icone e fallback automatico por reconhecimento de descricao/aliases.
- Lancamentos do tipo despesa podem ser marcados como despesa fixa e sao replicados automaticamente para os meses seguintes.
- OCR de nota fiscal esta preparado para fluxo assistido por revisao humana.
- A arquitetura foi organizada para continuar as fases do blueprint sem retrabalho.

## Qualidade e continuidade

- Relatorio de limpeza tecnica + protocolo de continuidade por IA:
	- docs/limpeza_e_protocolo_ia_2026-03-15.md

Checklist minimo por ciclo:

1. npm run lint
2. npm run build
3. Atualizar documentacao de delta tecnico em docs/
