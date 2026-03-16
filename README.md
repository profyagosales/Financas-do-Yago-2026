# Financeiro do Yago

Painel pessoal de finanças — web app + PWA para uso individual. Consolida finanças pessoais, investimentos, milhas, metas, listas de mercado e lista de desejo em um único sistema profissional.

---

## Stack

| | |
|---|---|
| Framework | Next.js 15 — App Router + TypeScript strict |
| Estilização | Tailwind CSS v4 + CSS Custom Properties (tema claro/escuro) |
| Tipografia | Manrope (corpo) · Space Grotesk (títulos) |
| Backend | Supabase — Auth · Postgres · Storage · RLS |
| Formulários | React Hook Form + Zod |
| Tabelas | TanStack Table v8 |
| Gráficos | Recharts |
| Ícones | Lucide React |
| PWA | Manifest + Service Worker |

---

## Módulos

| Hub | Subpáginas |
|---|---|
| **Dashboard** | Visão consolidada com gráficos e alertas |
| **Finanças** | Mensal · Anual · Contas · Cartões · Lançamentos · Categorias |
| **Investimentos** | Renda Fixa · FIIs · Bolsa · Cripto |
| **Milhas** | Livelo · LATAM Pass · Azul |
| **Mercado** | Listas · Notas Fiscais · Histórico de Preços |
| **Lista de Desejo** | Itens com preço alvo e prioridade |
| **Metas** | Objetivos financeiros com aportes parciais |
| **Relatórios** | Análises consolidadas por período |
| **Configurações** | Tema, perfil, preferências |

---

## Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com) com projeto criado

---

## Configuração

### 1. Variáveis de ambiente

Crie `.env.local` na raiz do projeto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

### 2. Banco de dados

Execute as migrations e o seed em ordem:

```bash
# Via scripts automatizados
./scripts/supabase/apply-migrations.sh
./scripts/supabase/apply-seed.sh
```

Ou manualmente no SQL Editor do Supabase:

```
1. supabase/migrations/202603150001_initial_schema.sql
2. supabase/migrations/202603150002_finance_icons_and_attachments.sql
3. supabase/migrations/202603150003_transaction_icon_key.sql
4. supabase/migrations/202603150004_dynamic_icon_cache_and_custom_icons.sql
5. supabase/seed/001_base_categories.sql
```

### 3. Executar

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

---

## Documentação técnica

| Documento | Conteúdo |
|---|---|
| [docs/arquitetura.md](docs/arquitetura.md) | Estrutura de pastas, fluxo de auth, padrão de páginas, Server Actions, convenções |
| [docs/design-system.md](docs/design-system.md) | Tokens CSS, paleta, tipografia, gradientes, componentes UI, padrões visuais |
| [docs/componentes.md](docs/componentes.md) | API de cada componente: Button, Card, ModulePage, Heroes, Forms, etc. |
| [docs/banco-de-dados.md](docs/banco-de-dados.md) | Schema completo, tabelas, índices, RLS, triggers, migrations, seed |
| [financeiro_do_yago_blueprint_do_produto.md](financeiro_do_yago_blueprint_do_produto.md) | Blueprint de produto: requisitos, módulos e casos de uso |

---

## Design

O app usa um sistema de **CSS Custom Properties** com dois temas (claro e escuro) baseados em verde esmeralda/teal. O tema é controlado pelo atributo `data-theme` em `<html>` e salvo nas `settings` do usuário no banco.

A escala de cores `slate-*` do Tailwind é remapeada via `@theme inline` para os tokens do tema — qualquer classe `text-slate-*`, `border-slate-*` ou `bg-slate-*` adapta-se automaticamente ao tema ativo.

Veja [docs/design-system.md](docs/design-system.md) para detalhes completos.

---

## Segurança

- **RLS ativo em todas as tabelas** — usuário só acessa seus próprios dados
- **Autenticação via Supabase Auth** — email + senha, sessão gerenciada por JWT
- **Middleware Next.js** (`src/proxy.ts`) — protege todas as rotas de `/dashboard` em diante
- **Server Actions** — toda escrita no banco passa por validação Zod no servidor antes de qualquer query
- **Sem dados entre usuários** — aplicação single-user por design

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
- O modulo de metas agora permite criar objetivos reais, registrar aportes por selecao de meta/conta, acompanhar progresso e alterar status sem usar UUID manual.
- A Lista de Desejo agora tem CRUD funcional com preco atual, preco alvo, prioridade, status operacional e indicador de oportunidade de compra.
- O modulo Mercado agora tem CRUD completo: listas de compra com itens, marcacao como comprado, historico de precos automatico e notas fiscais manuais com revisao obrigatoria e upload de arquivo.
- Milhas foi implementado com paginas reais por programa (Livelo, Latam Pass, Azul), saldo calculado, vencimentos em 90 dias e historico operacional.
- Investimentos foi implementado com paginas reais por classe (Renda Fixa, FIIs, Bolsa, Cripto), cadastro de ativos, movimentacoes e consolidacao de posicao.
- Relatorios foi implementado com consolidacao mensal, top categorias, cartoes por referencia, investimentos por classe e milhas por programa.
- Configuracoes foi implementado com perfil (nome, moeda e localidade), preferencias da aplicacao (tema, graficos, alertas) e metricas de cadastros.
- Financas mensal/anual/categorias deixou de ser placeholder e agora possui consolidacao real por periodo, comparativo anual e gestao operacional de categorias.
- Financas mensal e anual agora oferecem exportacao CSV autenticada diretamente pela interface.
- Exportacao CSV de financas agora aceita intervalo customizado por query string (start/end) e modo anual detalhado de transacoes.
- As telas mensal e anual agora possuem seletor de datas na propria interface para gerar exportacoes CSV sem editar URL.
- A interface de exportacao tambem oferece presets de periodo com um clique (Hoje, 7d, 30d, 90d e YTD, conforme contexto da tela).
- Exportacao por intervalo ganhou validacao no frontend (start < end) e estado visual de geracao, com componente reutilizavel entre telas.
- Exportacoes CSV mensal/anual agora suportam filtros por tipo e status (incluindo modo sem cancelados) tanto via UI quanto query string.
- Exportacoes de financas agora suportam dois formatos (CSV e JSON), com os mesmos filtros de periodo/tipo/status.
- Exportacoes agora sao auditadas no banco e exibidas em Configuracoes com historico recente (formato, modo, data e quantidade de linhas).
- Configuracoes agora exibe metricas agregadas de exportacao (7d/30d, mix CSV/JSON, total e media de linhas exportadas).
- O historico de exportacoes em Configuracoes evoluiu para painel avancado com busca textual, filtros por modulo/formato/periodo e paginacao.
- Foi adicionado o modulo de Busca Global (/busca) com pesquisa unificada entre Lancamentos, Investimentos, Metas, Lista de Desejo e Mercado.
- A busca global suporta filtro por modulo e atalho de busca rapida no topo da aplicacao (desktop).
- Lancamentos agora possuem importacao por CSV direto na interface, com validacao de cabecalhos e mapeamento por nome de categoria/conta/cartao.
- Financas mensal agora exibe calendario financeiro do mes (grade semanal) com saldo diario, pendencias e resumo dos principais lancamentos por dia.
- Dashboard agora inclui lembretes locais de vencimentos (faturas e pendencias proximas) com suporte a notificacoes do navegador.
- Configuracoes agora permite baixar backup completo em JSON da conta (snapshot consolidado de todos os modulos).
- PWA agora possui fila offline parcial: lancamentos simples criados sem conexao sao enfileirados no IndexedDB do Service Worker e sincronizados automaticamente (Background Sync) ou manualmente ao voltar online. Banner fixo indica modo offline e contagem da fila.
- Moeda/localidade do perfil agora sao aplicadas de forma consistente no dashboard e modulos de financas, mercado, metas, lista de desejo, investimentos e relatorios.
- Preferencia de exibir graficos no dashboard agora respeita configuracao do usuario em tempo real.
- OCR de nota fiscal esta preparado para fluxo assistido por revisao humana.
- A arquitetura foi organizada para continuar as fases do blueprint sem retrabalho.

## Qualidade e continuidade

- Relatorio de limpeza tecnica + protocolo de continuidade por IA:
	- docs/limpeza_e_protocolo_ia_2026-03-15.md

Checklist minimo por ciclo:

1. npm run lint
2. npm run build
3. Atualizar documentacao de delta tecnico em docs/
