# Limpeza Tecnica e Protocolo de Continuidade IA

Data: 2026-03-15
Escopo: saneamento de codigo, remocao de obsoletos, padronizacao minima de manutencao e guia para continuidade por IA.

## 1) Objetivo da limpeza

- Remover codigo sem uso efetivo para reduzir risco de regressao silenciosa.
- Eliminar dependencias mortas no bundle e no lockfile.
- Corrigir erros de lint que interrompem esteira de qualidade.
- Formalizar protocolo operacional para futuras iteracoes da IA.

## 2) Criterios aplicados

- So foi removido o que tinha evidencia de nao uso por referencia textual/import no codigo atual.
- Itens com potencial de uso imediato, mas sem chamada real, foram removidos para evitar codigo zumbi.
- Alteracoes priorizaram estabilidade de build e lint.
- Remocoes de features de roadmap foram evitadas quando havia uso real em rotas/componentes ativos.

## 3) Alteracoes executadas

### 3.1 Correcao de qualidade/lint

Arquivo: src/components/common/institution-avatar.tsx

- Substituicao de img por next/image.
- Eliminacao de componente dinamico criado durante render (erro react-hooks/static-components).
- Fallback de icone reescrito com ramificacao explicita para componentes estaticos.

Arquivo: src/components/forms/transaction-form.tsx

- Substituicao de watch() por useWatch() com control para reduzir warning de biblioteca incompativel com memoizacao.
- Remocao de useMemo desnecessario para categorias.

### 3.2 Dependencias removidas (sem uso)

Arquivo: package.json

Dependencias excluidas:
- @tanstack/react-table
- date-fns
- next-pwa
- zustand

Justificativa: sem referencias em src/ e sem integracao ativa em next.config.

### 3.3 Arquivos removidos (obsoletos/nao referenciados)

Acoes nao referenciadas por nenhum fluxo atual:
- src/actions/grocery.ts
- src/actions/investments.ts
- src/actions/mileage.ts
- src/actions/wishlist.ts

Bibliotecas internas nao consumidas:
- src/lib/calculations/index.ts
- src/lib/supabase/client.ts

Assets publicos sem referencia:
- public/file.svg
- public/globe.svg
- public/next.svg
- public/vercel.svg
- public/window.svg

## 4) Estado final esperado apos install

- Lint sem erros bloqueantes.
- Build de producao concluindo com sucesso.
- Menor superficie de codigo morto para manutencao.

## 5) Protocolo de continuidade para IA

### 5.1 Ordem de trabalho recomendada em cada sessao

1. Sincronizar estado:
- git status
- npm install
- npm run lint
- npm run build

2. Antes de adicionar nova feature:
- Confirmar se ja existe acao/componente utilitario equivalente.
- Evitar criar segundo caminho para mesma regra de negocio.

3. Durante implementacao:
- Atualizar schema/validators em paralelo com actions/forms.
- Evitar placeholders permanentes: usar TODO com contexto objetivo quando inevitavel.

4. Antes de encerrar:
- Rodar lint + build.
- Registrar no README e neste documento o delta tecnico.

### 5.2 Regras para evitar erros recorrentes

- Nao inserir funcoes no meio de objetos literais (erro de parser em finance.ts ja ocorrido historicamente).
- Nao depender de catalogo estatico quando o requisito for descoberta dinamica.
- Em upload de arquivos:
  - validar mime type e tamanho
  - salvar caminho de forma deterministica por usuario
  - tratar rollback quando inserir metadata falhar
- Em Supabase:
  - migrations idempotentes
  - RLS/policies no mesmo ciclo da tabela
  - registrar bootstrap de ambiente legado quando necessario

### 5.3 Estrategia de organizacao de pastas

- src/actions: apenas server actions usadas por rotas/componentes ativos.
- src/components/forms: formularios com validacao real (zod + RHF).
- src/lib: utilitarios efetivamente compartilhados por mais de um ponto.
- docs: decisao arquitetural, operacao e historico tecnico de limpeza.

## 6) Checklist obrigatorio para proximas PRs geradas por IA

- [ ] sem dependencias novas sem uso comprovado
- [ ] sem arquivo novo sem referencia de import/rota
- [ ] sem warning de lint critico
- [ ] build verde
- [ ] doc de delta tecnico atualizada
- [ ] migrations aplicaveis em ambiente novo e legado

## 7) Observacao sobre roadmap

Os modulos de roadmap (investimentos/milhas/mercado/lista de desejo) permanecem com rotas e estrutura de UI. Foram removidos apenas action files sem consumo atual, para evitar falsa sensacao de implementacao concluida.

Ao reativar esses modulos, recriar actions com contratos explicitamente ligados aos formularios e paginas reais.

## 8) Delta tecnico - continuidade em metas

Arquivo: src/app/(protected)/metas/page.tsx

- Pagina evoluida de placeholder para modulo funcional com resumo, carteira de metas, barra de progresso e historico recente de aportes.
- A listagem agora calcula valor aportado, restante e percentual concluido a partir de goal_contributions.
- Foram adicionadas acoes operacionais de ativar, pausar, concluir e excluir metas.

Arquivos: src/components/forms/goal-form.tsx e src/components/forms/goal-contribution-form.tsx

- Criado formulario real para cadastro de metas.
- Formulario de aporte deixou de exigir UUID manual e passou a usar selects de metas e contas.
- Fluxo agora exibe feedback textual simples de sucesso/erro e reseta campos apos submissao valida.

Arquivo: src/actions/goals.ts

- Normalizacao de campos opcionais antes de persistir no Supabase.
- Revalidacao de /metas e /dashboard em criacao, mudanca de status e exclusao.

Arquivo: src/lib/validators/schemas.ts

- Schema de metas ampliado para descricao, status e conta destino, alinhando UI e banco.

## 9) Delta tecnico - continuidade em lista de desejo

Arquivo: src/app/(protected)/lista-de-desejo/page.tsx

- Pagina evoluida de placeholder para modulo funcional com resumo, cadastro, listagem e controle operacional de status.
- A tela agora destaca oportunidades quando preco atual fica menor ou igual ao preco alvo.
- Foi adicionado resumo agregado de valor monitorado, alvo e economia potencial.

Arquivos: src/actions/wishlist.ts e src/components/forms/wishlist-item-form.tsx

- Recriadas actions do modulo com contrato explicito ligado a pagina real.
- Formulario agora persiste itens com validacao Zod e feedback simples de sucesso/erro.
- Status e exclusao foram implementados via server actions compatíveis com form action.

Arquivo: src/lib/validators/schemas.ts

- Novo schema wishlistItemSchema alinhado a tabela wishlist_items do banco.

## 10) Delta tecnico - continuidade em Mercado

Arquivos: src/actions/grocery.ts e src/lib/validators/schemas.ts

- Recriadas actions de mercado com contrato ligado as paginas reais.
- Schemas para grocery_lists, grocery_items e grocery_notes adicionados ao arquivo central.
- markGroceryItemPurchased grava automaticamente em grocery_price_history quando item tem preco e estabelecimento.
- uploadGroceryNoteFile valida mime (imagem/PDF), limita a 10 MB e faz rollback do storage se o insert de attachment falhar.

Arquivos: src/components/forms/grocery-list-form.tsx, grocery-item-form.tsx, grocery-note-form.tsx

- Formularios reais com validacao Zod, feedback de sucesso/erro e reset apos submit.
- grocery-note-form usa textarea nativo estilizado para a transcricao da nota.

Arquivos: src/app/(protected)/mercado/listas, historico, notas

- /mercado/listas: cards de resumo, criar lista, adicionar item, tabela de listas com contagens, tabela flat de itens com coluna Lista e marcacao.
- /mercado/historico: view read-only com agregacao JS (min/max/avg/count por produto normalizado).
- /mercado/notas: criar nota manual, upload por nota, marcar revisada, excluir. Exibe status de revisao e preview do texto.

## 11) Delta tecnico - continuidade em Milhas

Arquivos: src/components/common/mileage-program-page.tsx e src/actions/mileage.ts

- Implementado componente compartilhado por programa para reduzir duplicacao de pagina.
- Fluxo real de movimentacoes com saldo calculado, acumulado, resgatado e vencimento em 90 dias.
- Historico operacional por tipo de entrada com exclusao e revalidacao cruzada de dashboard/modulos de milhas.

Arquivos: src/components/forms/mileage-entry-form.tsx e src/lib/validators/schemas.ts

- Formulario real de lancamento com validacao Zod e reset pos-sucesso.
- Schema mileageEntrySchema adicionado com tipos de operacao e campos opcionais controlados.

Arquivos: src/app/(protected)/milhas/livelo/page.tsx, src/app/(protected)/milhas/latam-pass/page.tsx, src/app/(protected)/milhas/azul/page.tsx

- Rotas deixaram de usar placeholder e passaram a encapsular o componente compartilhado com contexto de cada programa.

## 12) Delta tecnico - continuidade em Investimentos

Arquivos: src/components/common/investment-class-page.tsx e src/actions/investments.ts

- Implementado componente compartilhado por classe de ativo (fixed_income, fii, stock, crypto).
- Consolidacao de posicao por ativo (investido, resgatado, proventos, quantidade liquida e custo medio).
- Historico de movimentacoes com exclusao, labels por tipo e revalidacao de dashboard/modulo alvo.

Arquivos: src/components/forms/investment-asset-form.tsx, src/components/forms/investment-transaction-form.tsx e src/lib/validators/schemas.ts

- Formularios reais para cadastro de ativo e movimentacao com validacao centralizada.
- Schemas investmentAssetSchema e investmentTransactionSchema adicionados para alinhar UI e banco.

Arquivos: src/app/(protected)/investimentos/renda-fixa/page.tsx, src/app/(protected)/investimentos/fiis/page.tsx, src/app/(protected)/investimentos/bolsa/page.tsx, src/app/(protected)/investimentos/cripto/page.tsx

- Rotas deixaram de usar placeholder e passaram a usar wrapper com assetClass especifico.

## 13) Delta tecnico - continuidade em Relatorios

Arquivo: src/app/(protected)/relatorios/page.tsx

- Pagina evoluida de placeholder para modulo funcional com:
  - consolidacao mensal de receitas, despesas e resultado,
  - top categorias de despesa,
  - faturas de cartao por referencia/status,
  - agregacao de investimentos por classe,
  - agregacao de milhas por programa.
- Consulta de currency/locale do perfil aplicada na formatacao monetaria e numerica da tela.

## 14) Delta tecnico - continuidade em Configuracoes

Arquivos: src/app/(protected)/configuracoes/page.tsx e src/actions/settings.ts

- Pagina evoluida de placeholder para modulo funcional de configuracoes.
- Implementado upsert de perfil (full_name, currency, locale) e de preferencias (theme, dashboard_config, notification_prefs).
- Revalidacao de /configuracoes e /dashboard apos alteracoes.

Arquivos: src/components/forms/profile-settings-form.tsx, src/components/forms/app-settings-form.tsx e src/lib/validators/schemas.ts

- Formularios reais com validacao Zod para dados de perfil e preferencias da aplicacao.
- Schemas profileSettingsSchema e appSettingsSchema adicionados ao arquivo central.

## 15) Delta tecnico - padronizacao global de exibicao

Arquivo: src/lib/supabase/display-prefs.ts

- Criado helper unico para leitura de currency/locale do usuario com fallback seguro (BRL/pt-BR).

Arquivos: dashboard, financas, mercado, metas, lista-de-desejo, investimentos e relatorios

- Padronizada a formatacao de moeda e numeros com base em preferencias reais do perfil.
- Dashboard passou a respeitar show_charts vindo de settings.dashboard_config.
- Tooltips de graficos no dashboard passaram a usar locale/currency do usuario.

## 16) Nota de consistencia historica

- O item 3.3 deste documento registra uma limpeza anterior em que algumas actions de roadmap foram removidas por nao uso.
- Com a continuidade do escopo nesta mesma data, essas actions foram recriadas e reconectadas aos formularios/paginas reais, deixando de ser codigo zumbi.

## 17) Delta tecnico - continuidade em Financas core (mensal/anual/categorias)

Arquivo: src/actions/categories.ts

- Criadas server actions para categorias (createCategory, setCategoryActive, deleteCategory).
- Revalidacao de /financas/categorias e /financas/lancamentos apos alteracoes.
- Protecao para evitar exclusao de categorias padrao (is_default=true).

Arquivos: src/components/forms/category-form.tsx e src/lib/validators/schemas.ts

- Formulario real para criacao de categoria com validacao Zod.
- Novo schema categorySchema com tipos de dominio alinhados ao check do banco.

Arquivo: src/app/(protected)/financas/categorias/page.tsx

- Pagina evoluida de placeholder para modulo funcional com:
  - cards de resumo (total, ativas, padrao),
  - criacao de categoria,
  - tabela operacional com ativar/desativar e exclusao.

Arquivo: src/app/(protected)/financas/mensal/page.tsx

- Pagina evoluida de placeholder para consolidacao mensal real:
  - receitas, despesas, resultado e pendencias,
  - top categorias de despesa no periodo,
  - ultimos lancamentos do mes.
- Formatacao monetaria respeitando currency/locale do perfil.

Arquivo: src/app/(protected)/financas/anual/page.tsx

- Pagina evoluida de placeholder para comparativo anual real:
  - consolidado por mes (receita, despesa, resultado, volume),
  - totais anuais,
  - melhor e pior mes por resultado.
- Formatacao monetaria respeitando currency/locale do perfil.

## 18) Delta tecnico - exportacao CSV em Financas

Arquivos: src/app/api/exports/financas/mensal/route.ts e src/app/api/exports/financas/anual/route.ts

- Criadas rotas API autenticadas para exportacao CSV.
- /api/exports/financas/mensal exporta lancamentos do mes atual com categoria resolvida.
- /api/exports/financas/anual exporta consolidado por mes (receita, despesa, resultado e quantidade).
- Respostas incluem content-disposition para download de arquivo e cache-control no-store.

Arquivos: src/app/(protected)/financas/mensal/page.tsx e src/app/(protected)/financas/anual/page.tsx

- Adicionados blocos de exportacao com botao direto para download de CSV nas duas telas.

Evolucao adicional no mesmo ciclo:

- Rotas passaram a aceitar query params start/end (YYYY-MM-DD) com validacao de intervalo.
- Rota anual passou a aceitar mode=detailed para exportar transacoes detalhadas (id, data, tipo, status, descricao, valor).
- UI de /financas/anual agora oferece dois downloads: resumo e detalhado.
- UI de /financas/mensal agora oferece download do mes e atalho de ultimos 90 dias (via start/end).

Evolucao de UX na interface:

- /financas/mensal recebeu formulario com inputs start/end para exportacao customizada sem montagem manual de URL.
- /financas/anual recebeu dois formularios customizados por data: resumo e detalhado.
- Exportacao rapida foi mantida em paralelo aos formularios para manter produtividade no uso diario.

Evolucao adicional de presets:

- /financas/mensal passou a expor atalhos de periodo com um clique (Hoje, 7d, 30d, YTD), alem de mes e 90 dias.
- /financas/anual passou a expor atalhos de periodo para resumo e detalhado (Hoje, 7d, 30d, 90d e YTD).

Refatoracao e robustez de UX:

- Criado componente client compartilhado src/components/finance/export-range-form.tsx.
- Componente aplica validacao local de intervalo (start < end), bloqueio de submit invalido e estado "Gerando..." no botao.
- Formularios manuais de /financas/mensal e /financas/anual migrados para o componente unico, reduzindo duplicacao e risco de divergencia.

Bloco adicional de filtros em exportacao:

- Criado utilitario compartilhado src/lib/exports/finance-export.ts para parse de intervalo, parse de filtros e escape de CSV.
- Rotas de exportacao mensal e anual refatoradas para usar utilitario comum.
- ExportRangeForm evoluiu para suportar filtros de tipo e status.
- /financas/mensal e /financas/anual passaram a enviar filtros de tipo/status para exportacoes customizadas.

Bloco adicional de formatos de exportacao:

- Rotas /api/exports/financas/mensal e /api/exports/financas/anual agora aceitam format=csv|json.
- Para JSON, respostas incluem metadados (range, filtros, modo e contagem) e payload estruturado em data.
- ExportRangeForm ganhou seletor de formato para escolha direta na interface.

Bloco adicional de auditoria de exportacao:

- Migration nova: supabase/migrations/202603150005_export_history.sql.
- Tabela public.export_history criada com RLS e indice por usuario/data.
- Helper src/lib/exports/export-audit.ts implementado para registrar auditoria sem bloquear download em caso de falha.
- Rotas mensal/anual passaram a registrar log (modulo, formato, modo, filtros e quantidade de linhas exportadas).
- Tela de configuracoes passou a exibir historico recente de exportacoes para o usuario.

Bloco adicional de analytics em Configuracoes:

- Configuracoes passou a calcular agregados de exportacao a partir de export_history (janela 7d/30d e historico geral).
- Novos cards com indicadores de uso: frequencia de exportacao, distribuicao CSV/JSON e volume total/medio de linhas exportadas.

Bloco adicional de historico avancado em Configuracoes:

- Criado componente client dedicado: src/components/finance/export-history-panel.tsx.
- Historico de exportacoes agora suporta busca textual (nome/modulo/formato/modo/data), filtros por modulo, formato e periodo (7d/30d/90d/todo periodo).
- Lista ganhou paginacao no cliente (10 itens por pagina) com navegacao Anterior/Proxima e contador de exibicao.
- Consulta em src/app/(protected)/configuracoes/page.tsx foi simplificada para uma unica carga (ate 500 registros), reutilizada por metricas e painel.
