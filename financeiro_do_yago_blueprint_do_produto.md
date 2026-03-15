# Financeiro do Yago

## Visão geral
Aplicação pessoal de finanças em formato web + PWA, com uso em desktop e mobile, pensada para um único usuário.

## Objetivo central
Concentrar em um único sistema:
- finanças pessoais
- investimentos
- milhas aéreas
- listas de desejo
- listas de mercado
- metas e projetos financeiros
- leitura de comprovantes/notas fiscais
- controle de contas bancárias e cartões

## Módulos principais

### 1. Dashboard inicial
- saldo consolidado
- patrimônio total
- evolução mensal
- despesas por categoria
- receitas por fonte
- cartões a vencer
- metas em andamento
- variação de investimentos
- milhas por programa
- alertas importantes

### 2. Finanças
#### Visão mensal
- receitas do mês
- despesas do mês
- lançamentos futuros
- recorrências
- faturas de cartão
- filtros por conta, categoria, centro de custo e tags
- calendário financeiro

#### Visão anual
- comparativo mês a mês
- sazonalidade de gastos
- categorias mais pesadas no ano
- evolução de renda, despesa e poupança
- fechamento anual

### 3. Contas bancárias e carteiras
- cadastro de bancos
- saldo inicial
- saldo atual
- tipo da conta: corrente, poupança, carteira, conta investimento
- conciliação manual
- histórico

### 4. Cartões de crédito
- múltiplos cartões
- limite total e disponível
- fechamento
- vencimento
- parcelamentos
- compras por fatura
- categoria por compra
- alertas de vencimento

### 5. Investimentos
#### Submódulos
- renda fixa
- FIIs
- bolsa
- cripto

#### Recursos
- cadastro de aportes
- posição atual
- preço médio
- rentabilidade
- dividendos/rendimentos
- histórico por ativo
- gráficos por classe
- metas de alocação
- rebalanceamento

### 6. Milhas
- Livelo
- Latam Pass
- Azul
- saldo atual
- validade de pontos
- histórico de entradas e saídas
- origem dos pontos
- alertas de expiração
- meta de emissão

### 7. Mercado
- listas de compras
- itens favoritos
- preços por estabelecimento
- histórico de variação
- leitura de nota fiscal por foto
- cálculo automático por item
- comparativo entre mercados
- área futura para rastreamento de preços

### 8. Lista de desejo
- nome do item
- imagem
- link
- preço atual
- preço desejado
- prioridade
- categoria
- observações
- acompanhamento de queda de preço em fase futura

### 9. Metas & Projetos
- criar objetivo
- valor alvo
- prazo
- aportes parciais
- percentual concluído
- conta/origem do aporte
- observações
- status: ativa, pausada, concluída

### 10. Documentos e comprovantes
- upload de imagens e PDFs
- recibos
- notas fiscais
- comprovantes bancários
- anexos por lançamento
- classificação automática assistida

## Recursos avançados desejados
- PWA instalável
- modo offline parcial
- backup/exportação
- busca global
- filtros avançados
- tags personalizadas
- anexos por registro
- lembretes locais
- tema claro/escuro
- gráficos e analytics
- importação por CSV
- OCR para notas fiscais
- leitura assistida por IA para sugerir categorias

## Estrutura sugerida de navegação
- Dashboard
- Finanças
  - Mensal
  - Anual
  - Contas
  - Cartões
  - Lançamentos
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
  - Histórico de preços
  - Notas fiscais
- Lista de Desejo
- Metas & Projetos
- Relatórios
- Configurações

## Arquitetura sugerida
### Front-end
- Next.js com App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts para gráficos

### Back-end
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Supabase Edge Functions
- Row Level Security

### PWA
- manifest
- service worker
- cache de shell
- fila offline para lançamentos simples

## Banco de dados - entidades centrais
- profiles
- bank_accounts
- credit_cards
- card_bills
- transactions
- transaction_installments
- categories
- tags
- attachments
- investment_assets
- investment_transactions
- mileage_programs
- mileage_entries
- grocery_lists
- grocery_items
- grocery_price_history
- wishlists
- wishlist_items
- financial_goals
- goal_contributions
- settings

## Fluxos principais
### Fluxo 1 - lançamento financeiro manual
1. escolher conta/cartão
2. informar valor, categoria, data e descrição
3. anexar comprovante se quiser
4. salvar
5. atualizar dashboard e relatórios

### Fluxo 2 - compra por cartão parcelado
1. cadastrar compra
2. definir número de parcelas
3. sistema gera parcelas
4. parcelas entram nas faturas futuras

### Fluxo 3 - nota fiscal de mercado por foto
1. enviar foto
2. OCR extrai texto
3. sistema sugere itens e preços
4. usuário revisa
5. itens entram no módulo Mercado
6. histórico de preços é atualizado

### Fluxo 4 - aporte em meta
1. abrir meta
2. registrar valor
3. escolher origem do dinheiro
4. sistema atualiza percentual e saldo restante

### Fluxo 5 - aporte em investimento
1. selecionar ativo
2. lançar compra, venda, rendimento ou provento
3. atualizar posição, custo médio e indicadores

## Regras importantes
- um único usuário, mas já com arquitetura organizada
- separar conta, cartão, investimento, meta e milhas
- toda movimentação deve ter categoria
- anexos devem poder ser vinculados a registros
- parcelas devem ser geradas automaticamente
- metas devem aceitar aportes múltiplos
- OCR sempre deve passar por revisão humana antes de gravar

## Fases do projeto
### Fase 1 - Fundação
- autenticação simples
- layout base
- dashboard inicial
- contas bancárias
- cartões
- lançamentos manuais
- categorias

### Fase 2 - Finanças robustas
- mensal/anual
- recorrências
- parcelamentos
- anexos
- relatórios

### Fase 3 - Investimentos
- cadastro de ativos
- aportes
- posição consolidada
- proventos

### Fase 4 - Milhas
- programas
- saldo
- validade
- histórico

### Fase 5 - Mercado e OCR
- listas de compras
- nota fiscal por foto
- histórico de preços
- análise de variação

### Fase 6 - Metas e Lista de Desejo
- metas
- aportes
- progresso
- wishlist com links e imagens

### Fase 7 - PWA e refinamentos
- instalação
- offline parcial
- melhorias mobile
- exportações
- backups

## MVP recomendado
Começar com o que gera valor imediato:
- login
- dashboard
- contas
- cartões
- lançamentos
- categorias
- visão mensal
- visão anual
- metas

## Pós-MVP
- investimentos
- milhas
- OCR de nota fiscal
- mercado com histórico de preços
- wishlist
- automações e alertas

## Decisões técnicas iniciais recomendadas
- usar Next.js App Router
- usar Supabase como banco, auth e storage
- usar TypeScript desde o início
- adotar esquema de banco bem normalizado
- construir mobile-first
- pensar offline apenas para ações essenciais
- deixar OCR como etapa revisável

## Próximo passo ideal
Transformar este blueprint em:
1. mapa completo de telas
2. modelo do banco de dados
3. backlog por etapas
4. depois iniciar a implementação do MVP



---

# Especificação executável para IA construir o sistema

## Nome do produto
**Financeiro do Yago**

## Tipo de produto
Aplicação web responsiva com suporte a PWA, uso em desktop e mobile, projetada para **usuário único**.

## Objetivo do sistema
Criar uma plataforma pessoal completa de gestão financeira que permita ao usuário:
- controlar receitas e despesas
- gerenciar contas bancárias e cartões
- acompanhar faturas e parcelamentos
- visualizar fechamento mensal e anual
- cadastrar e acompanhar investimentos
- controlar milhas aéreas
- registrar metas e projetos financeiros
- manter lista de desejo e lista de mercado
- anexar comprovantes e notas fiscais
- usar IA/OCR para extração assistida de dados de notas fiscais

## Perfil do usuário
- apenas um usuário real utilizará o sistema
- apesar disso, a arquitetura deve seguir padrão profissional, com autenticação e proteção de dados
- o sistema deve ser simples de usar, rápido para lançar dados e agradável visualmente

## Princípios obrigatórios do projeto
1. **mobile-first**
2. **arquitetura profissional, mesmo sendo mono-usuário**
3. **todas as ações importantes devem ser auditáveis**
4. **nenhum OCR deve gravar dados automaticamente sem revisão humana**
5. **lógica financeira separada por módulos**
6. **PWA instalável**
7. **código limpo, tipado e escalável**
8. **visual bonito, moderno e organizado**

## Stack mandatória
### Front-end
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Table
- Recharts
- Zustand ou Context para estados locais simples

### Back-end
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Supabase Row Level Security
- Supabase Edge Functions para rotinas específicas

### PWA
- manifest
- service worker
- cache do shell da aplicação
- suporte inicial a leitura offline parcial

## Requisitos visuais
- interface limpa e premium
- cards com cantos arredondados
- dashboard altamente visual
- uso consistente de espaçamento
- tabelas limpas com filtros e busca
- versões desktop e mobile igualmente bem resolvidas
- preferir experiência parecida com app financeiro moderno

## Navegação principal obrigatória
- Dashboard
- Finanças
  - Mensal
  - Anual
  - Contas
  - Cartões
  - Lançamentos
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
  - Histórico de preços
- Lista de Desejo
- Metas & Projetos
- Relatórios
- Configurações

## Telas que a IA deve construir

### 1. Tela de login
#### Objetivo
Permitir entrada segura do usuário único.

#### Componentes
- campo de e-mail
- campo de senha
- botão entrar
- opção de magic link futura
- recuperação de senha futura

#### Regras
- redirecionar usuário autenticado direto para dashboard
- impedir acesso a rotas privadas sem sessão válida

---

### 2. Dashboard principal
#### Objetivo
Apresentar panorama consolidado do sistema.

#### Blocos obrigatórios
- saldo total em contas
- total investido
- patrimônio consolidado
- receitas do mês
- despesas do mês
- resultado líquido do mês
- cartões com vencimento próximo
- metas em andamento
- milhas por programa
- últimos lançamentos
- gráfico de despesas por categoria
- gráfico de evolução mensal
- gráfico de patrimônio por classe

#### Ações rápidas
- novo lançamento
- nova receita
- nova despesa
- novo aporte em meta
- nova compra no cartão
- novo investimento
- novo registro de milhas
- nova nota fiscal

---

### 3. Finanças > Mensal
#### Objetivo
Centralizar o fechamento do mês.

#### Componentes obrigatórios
- seletor de mês/ano
- resumo do mês
- lista de receitas
- lista de despesas
- filtro por conta
- filtro por cartão
- filtro por categoria
- filtro por tipo
- filtro por tags
- tabela de lançamentos
- calendário financeiro opcional
- botão de exportação

#### Indicadores obrigatórios
- total de receitas
- total de despesas
- saldo do mês
- despesas fixas
- despesas variáveis
- valor de cartão no mês
- percentual por categoria

#### Regras
- compras parceladas devem refletir apenas a parcela do mês selecionado
- lançamentos recorrentes devem aparecer automaticamente se ativos
- anexos devem poder ser visualizados

---

### 4. Finanças > Anual
#### Objetivo
Comparar a vida financeira ao longo do ano.

#### Componentes
- cards por mês
- gráfico anual de receitas x despesas
- gráfico de economia mensal
- ranking de categorias no ano
- comparação entre meses
- total anual consolidado

---

### 5. Finanças > Contas
#### Objetivo
Gerir contas bancárias e carteiras.

#### Campos por conta
- nome da conta
- instituição
- tipo da conta
- saldo inicial
- saldo atual calculado
- cor/ícone
- observações
- status ativa/inativa

#### Tipos permitidos
- conta corrente
- poupança
- carteira
- conta investimento
- dinheiro físico
- conta digital

#### Regras
- saldo atual pode ser calculado a partir dos lançamentos, mas o sistema deve permitir saldo inicial
- contas inativas não podem aparecer em formulários por padrão

---

### 6. Finanças > Cartões
#### Objetivo
Gerenciar cartões, limites, faturas e compras.

#### Dados por cartão
- nome do cartão
- banco/instituição
- bandeira
- limite total
- limite utilizado
- dia de fechamento
- dia de vencimento
- cor/ícone
- status

#### Recursos obrigatórios
- lista de compras por cartão
- agrupamento por fatura
- parcelamentos
- compras futuras já previstas
- alerta de vencimento
- cálculo de limite disponível

#### Regras
- uma compra parcelada gera N registros de parcelas
- cada parcela pertence a uma competência/fatura
- estorno deve ser suportado futuramente

---

### 7. Finanças > Lançamentos
#### Objetivo
Manter visão geral e CRUD completo das movimentações.

#### Tipos de lançamento
- receita
- despesa
- transferência
- ajuste

#### Campos obrigatórios
- descrição
- valor
- data de competência
- data de pagamento
- categoria
- subcategoria futura
- conta origem
- conta destino se transferência
- cartão se aplicável
- observações
- tags
- anexos
- recorrente sim/não
- parcelado sim/não

#### Regras
- transferência não deve contar como despesa nem receita no consolidado
- ajuste serve para correções extraordinárias
- toda despesa ou receita precisa ter categoria

---

### 8. Investimentos
#### Objetivo
Acompanhar carteira de investimentos por classe.

#### Submódulos
- Renda Fixa
- FIIs
- Bolsa
- Cripto

#### Dados do ativo
- nome do ativo
- ticker se houver
- classe
- subtipo
- instituição/corretora
- moeda
- observações

#### Dados por movimentação
- compra
- venda
- aporte
- resgate
- rendimento
- dividendo
- juros
- bonificação futura

#### Indicadores obrigatórios
- valor investido
- valor atual manual ou informado
- preço médio
- quantidade
- rentabilidade nominal
- participação por classe
- proventos acumulados

#### Observação importante
Na primeira versão, a IA deve construir **lançamento manual**, sem depender de integração com corretoras.

---

### 9. Milhas
#### Objetivo
Controlar programas de pontos/milhas.

#### Programas iniciais
- Livelo
- Latam Pass
- Azul

#### Campos por registro
- programa
- tipo de movimentação
- quantidade de pontos
- data
- validade
- origem
- observações

#### Tipos de movimentação
- acúmulo
- transferência
- resgate
- expiração
- ajuste

#### Indicadores
- saldo por programa
- pontos a expirar
- entradas por período
- saídas por período

---

### 10. Mercado
#### Objetivo
Registrar compras de supermercado e construir histórico de preços.

#### Submódulos
- listas de compras
- notas fiscais
- histórico de preços
- análises

#### Recursos obrigatórios
- criar lista de mercado
- marcar item como comprado
- registrar preço por item
- registrar mercado/estabelecimento
- importar itens de nota fiscal revisada
- comparar preço histórico do item

#### Campos de item do mercado
- nome padronizado
- nome lido da nota
- quantidade
- unidade
- preço unitário
- preço total
- estabelecimento
- data da compra
- categoria alimentar/limpeza/higiene/outros

#### Futuro
- rastreamento de preços por estabelecimento
- cestas comparativas
- previsão de melhor mercado

---

### 11. Lista de Desejo
#### Objetivo
Controlar itens desejados e oportunidade de compra.

#### Campos
- nome do item
- categoria
- link
- imagem
- preço atual
- preço desejado
- prioridade
- loja
- observações
- status

#### Status
- ativo
- comprado
- pausado
- descartado

---

### 12. Metas & Projetos
#### Objetivo
Acompanhar objetivos financeiros.

#### Campos da meta
- nome
- descrição
- valor alvo
- valor já acumulado calculado
- prazo
- categoria da meta
- prioridade
- status
- conta destino opcional

#### Campos do aporte
- valor
- data
- origem do recurso
- observações

#### Indicadores
- percentual concluído
- valor restante
- prazo restante
- histórico de aportes
- projeção de conclusão futura

---

### 13. Relatórios
#### Relatórios obrigatórios
- despesas por categoria
- receitas por fonte
- evolução patrimonial
- cartão por período
- investimentos por classe
- metas por progresso
- milhas por programa
- compras de mercado por estabelecimento

---

### 14. Configurações
#### Seções
- perfil
- preferências visuais
- categorias personalizadas
- backup/exportação
- dados iniciais
- tema claro/escuro

---

# Esquema de banco de dados detalhado

## Convenções obrigatórias
- usar UUID como chave primária
- incluir `created_at` e `updated_at` em todas as tabelas principais
- incluir `user_id` nas tabelas vinculadas ao usuário
- usar `deleted_at` apenas onde soft delete fizer sentido
- usar enums quando apropriado
- criar índices para filtros frequentes

## Tabela: profiles
### Finalidade
Dados do perfil do usuário autenticado.

### Campos
- id UUID PK referenciando auth.users.id
- full_name TEXT
- avatar_url TEXT nullable
- currency TEXT default 'BRL'
- locale TEXT default 'pt-BR'
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

## Tabela: bank_accounts
### Campos
- id UUID PK
- user_id UUID FK
- name TEXT
- institution TEXT
- account_type TEXT
- color TEXT nullable
- initial_balance NUMERIC(14,2)
- is_active BOOLEAN default true
- notes TEXT nullable
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

## Tabela: credit_cards
### Campos
- id UUID PK
- user_id UUID FK
- name TEXT
- institution TEXT
- brand TEXT nullable
- credit_limit NUMERIC(14,2)
- closing_day INTEGER
- due_day INTEGER
- color TEXT nullable
- is_active BOOLEAN default true
- notes TEXT nullable
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

## Tabela: categories
### Campos
- id UUID PK
- user_id UUID FK
- name TEXT
- type TEXT
- icon TEXT nullable
- color TEXT nullable
- is_default BOOLEAN default false
- is_active BOOLEAN default true
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

### Observação
`type` deve aceitar: income, expense, transfer, investment, mileage, grocery, goal

## Tabela: tags
### Campos
- id UUID PK
- user_id UUID FK
- name TEXT unique por usuário
- color TEXT nullable
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

## Tabela: transactions
### Finalidade
Centraliza movimentações financeiras.

### Campos
- id UUID PK
- user_id UUID FK
- type TEXT
- description TEXT
- amount NUMERIC(14,2)
- category_id UUID nullable FK
- account_id UUID nullable FK
- destination_account_id UUID nullable FK
- credit_card_id UUID nullable FK
- competency_date DATE
- payment_date DATE nullable
- status TEXT
- notes TEXT nullable
- is_recurring BOOLEAN default false
- recurring_rule TEXT nullable
- installment_group_id UUID nullable
- attachment_count INTEGER default 0
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

### Regras
- type: income, expense, transfer, adjustment
- status: pending, paid, canceled
- transfer exige account_id e destination_account_id
- expense em cartão exige credit_card_id

## Tabela: transaction_tags
### Campos
- transaction_id UUID FK
- tag_id UUID FK
- PK composta

## Tabela: transaction_installments
### Campos
- id UUID PK
- user_id UUID FK
- installment_group_id UUID
- transaction_id UUID FK
- installment_number INTEGER
- total_installments INTEGER
- bill_month DATE
- amount NUMERIC(14,2)
- created_at TIMESTAMPTZ

## Tabela: card_bills
### Campos
- id UUID PK
- user_id UUID FK
- credit_card_id UUID FK
- reference_month DATE
- closing_date DATE
- due_date DATE
- total_amount NUMERIC(14,2)
- status TEXT
- paid_at DATE nullable
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

## Tabela: attachments
### Campos
- id UUID PK
- user_id UUID FK
- related_type TEXT
- related_id UUID
- file_path TEXT
- file_name TEXT
- mime_type TEXT
- file_size BIGINT
- created_at TIMESTAMPTZ

### related_type
- transaction
- grocery_note
- goal
- investment
- wishlist

## Tabela: investment_assets
### Campos
- id UUID PK
- user_id UUID FK
- name TEXT
- ticker TEXT nullable
- asset_class TEXT
- asset_subtype TEXT nullable
- broker TEXT nullable
- currency TEXT default 'BRL'
- notes TEXT nullable
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

### asset_class
- fixed_income
- fii
- stock
- crypto

## Tabela: investment_transactions
### Campos
- id UUID PK
- user_id UUID FK
- asset_id UUID FK
- transaction_type TEXT
- transaction_date DATE
- quantity NUMERIC(20,8) nullable
- unit_price NUMERIC(20,8) nullable
- total_amount NUMERIC(14,2)
- fees NUMERIC(14,2) default 0
- notes TEXT nullable
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

### transaction_type
- buy
- sell
- income
- dividend
- interest
- deposit
- withdraw
- adjustment

## Tabela: mileage_programs
### Campos
- id UUID PK
- user_id UUID FK
- name TEXT
- is_active BOOLEAN default true
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

## Tabela: mileage_entries
### Campos
- id UUID PK
- user_id UUID FK
- program_id UUID FK
- entry_type TEXT
- points INTEGER
- occurred_at DATE
- expires_at DATE nullable
- source TEXT nullable
- notes TEXT nullable
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

### entry_type
- earn
- transfer
- redeem
- expire
- adjustment

## Tabela: grocery_lists
### Campos
- id UUID PK
- user_id UUID FK
- name TEXT
- status TEXT
- notes TEXT nullable
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

## Tabela: grocery_items
### Campos
- id UUID PK
- user_id UUID FK
- list_id UUID nullable FK
- normalized_name TEXT
- raw_name TEXT nullable
- quantity NUMERIC(12,3) nullable
- unit TEXT nullable
- unit_price NUMERIC(14,2) nullable
- total_price NUMERIC(14,2) nullable
- establishment TEXT nullable
- purchased_at DATE nullable
- item_category TEXT nullable
- was_purchased BOOLEAN default false
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

## Tabela: grocery_notes
### Campos
- id UUID PK
- user_id UUID FK
- establishment TEXT nullable
- note_date DATE nullable
- total_amount NUMERIC(14,2) nullable
- raw_extracted_text TEXT nullable
- review_status TEXT default 'pending_review'
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

## Tabela: grocery_price_history
### Campos
- id UUID PK
- user_id UUID FK
- grocery_item_id UUID nullable FK
- normalized_name TEXT
- establishment TEXT
- unit_price NUMERIC(14,2)
- quantity_reference NUMERIC(12,3) nullable
- unit TEXT nullable
- purchased_at DATE
- created_at TIMESTAMPTZ

## Tabela: wishlist_items
### Campos
- id UUID PK
- user_id UUID FK
- name TEXT
- category TEXT nullable
- url TEXT nullable
- image_url TEXT nullable
- current_price NUMERIC(14,2) nullable
- target_price NUMERIC(14,2) nullable
- priority TEXT default 'medium'
- store_name TEXT nullable
- status TEXT default 'active'
- notes TEXT nullable
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

## Tabela: financial_goals
### Campos
- id UUID PK
- user_id UUID FK
- name TEXT
- description TEXT nullable
- target_amount NUMERIC(14,2)
- target_date DATE nullable
- category TEXT nullable
- priority TEXT default 'medium'
- status TEXT default 'active'
- destination_account_id UUID nullable FK
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

## Tabela: goal_contributions
### Campos
- id UUID PK
- user_id UUID FK
- goal_id UUID FK
- amount NUMERIC(14,2)
- contribution_date DATE
- source_account_id UUID nullable FK
- notes TEXT nullable
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

## Tabela: settings
### Campos
- id UUID PK
- user_id UUID FK
- theme TEXT default 'system'
- dashboard_config JSONB default '{}'
- notification_prefs JSONB default '{}'
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

---

# Regras de negócio obrigatórias

## Regras financeiras
1. transferência entre contas não afeta resultado mensal como receita/despesa
2. parcela de cartão deve aparecer apenas na competência correta
3. cancelamento de transação não pode entrar em somatórios
4. metas usam aportes independentes, sem confundir com investimentos
5. anexos pertencem ao registro, mas não alteram cálculo
6. toda compra em cartão deve conseguir gerar parcelas automaticamente
7. lançamentos em dinheiro, conta ou cartão precisam ter origem clara

## Regras de UX
1. formulários devem ser rápidos
2. campos mais usados devem ficar visíveis
3. filtros devem persistir enquanto o usuário navega localmente
4. todas as tabelas grandes devem ter busca, paginação e ordenação
5. telas mobile não podem ser apenas adaptações ruins da versão desktop

## Regras de OCR/IA
1. nunca gravar automaticamente os itens lidos da nota
2. sempre exibir tela de revisão antes da confirmação
3. guardar texto bruto extraído
4. permitir editar item, quantidade, unidade e preço antes de salvar
5. ao confirmar, criar histórico de preços

---

# Fluxos completos que a IA deve implementar

## Fluxo A - criar lançamento de despesa simples
1. usuário clica em novo lançamento
2. escolhe tipo despesa
3. informa descrição, valor, data, categoria e conta
4. opcionalmente adiciona tags e anexo
5. salva
6. sistema atualiza dashboard, mês e conta relacionada

## Fluxo B - compra parcelada no cartão
1. usuário abre novo lançamento
2. escolhe despesa no cartão
3. seleciona cartão
4. informa valor total
5. marca como parcelado
6. informa número de parcelas
7. sistema cria grupo de parcelas
8. sistema distribui parcelas por competência/fatura
9. dashboard e faturas futuras passam a considerar as parcelas

## Fluxo C - transferência entre contas
1. usuário cria lançamento do tipo transferência
2. escolhe conta origem
3. escolhe conta destino
4. informa valor e data
5. sistema registra saída e entrada logicamente vinculadas sem contaminar relatórios de despesa/receita

## Fluxo D - aporte em meta
1. usuário abre meta
2. clica em registrar aporte
3. informa valor, data e origem
4. sistema grava aporte
5. sistema recalcula percentual concluído e valor restante

## Fluxo E - cadastro de investimento
1. usuário seleciona classe do ativo
2. cadastra o ativo se ainda não existir
3. registra compra ou rendimento
4. sistema atualiza histórico do ativo
5. dashboard de investimentos é recalculado

## Fluxo F - nota fiscal por foto
1. usuário abre módulo mercado
2. faz upload de imagem ou PDF
3. sistema envia arquivo ao storage
4. sistema extrai texto via OCR/IA
5. sistema mostra tela de revisão
6. usuário corrige estabelecimento, data, itens, quantidades e preços
7. usuário confirma
8. sistema grava nota, itens e histórico de preços

---

# Estrutura de pastas recomendada para o projeto

```text
/app
  /(auth)
    /login
  /(protected)
    /dashboard
    /financas
      /mensal
      /anual
      /contas
      /cartoes
      /lancamentos
      /categorias
    /investimentos
      /renda-fixa
      /fiis
      /bolsa
      /cripto
    /milhas
      /livelo
      /latam-pass
      /azul
    /mercado
      /listas
      /notas
      /historico
    /lista-de-desejo
    /metas
    /relatorios
    /configuracoes
/components
  /layout
  /dashboard
  /financas
  /investimentos
  /milhas
  /mercado
  /wishlist
  /goals
  /ui
/lib
  /supabase
  /auth
  /utils
  /formatters
  /validators
  /queries
  /calculations
/actions
/hooks
/types
/public
  /icons
  /images
/supabase
  /migrations
  /seed
```

---

# Tipos TypeScript que a IA deve criar
A IA deve gerar interfaces ou types para:
- Profile
- BankAccount
- CreditCard
- Category
- Tag
- Transaction
- TransactionInstallment
- CardBill
- Attachment
- InvestmentAsset
- InvestmentTransaction
- MileageProgram
- MileageEntry
- GroceryList
- GroceryItem
- GroceryNote
- GroceryPriceHistory
- WishlistItem
- FinancialGoal
- GoalContribution
- Settings

---

# Funções de cálculo que a IA deve implementar

## Financeiro
- calcular saldo consolidado
- calcular total de receitas por período
- calcular total de despesas por período
- calcular resultado líquido
- calcular despesas por categoria
- calcular previsão de fatura do cartão
- calcular limite disponível
- calcular total de parcelas futuras

## Metas
- calcular valor acumulado
- calcular valor restante
- calcular percentual concluído
- calcular projeção de conclusão

## Investimentos
- calcular quantidade total do ativo
- calcular preço médio
- calcular total investido
- calcular total de proventos
- calcular distribuição por classe

## Milhas
- calcular saldo por programa
- calcular pontos prestes a expirar

## Mercado
- calcular preço médio por item
- calcular variação histórica
- comparar preço por estabelecimento

---

# Requisitos de API e Server Actions
A IA deve preferir **Server Actions** e/ou camada de serviço organizada para operações críticas.

## Operações mínimas
- criar/editar/excluir conta
- criar/editar/excluir cartão
- criar/editar/excluir categoria
- criar/editar/excluir lançamento
- gerar parcelas
- fechar fatura
- criar/editar/excluir ativo de investimento
- registrar movimentação de investimento
- criar/editar/excluir meta
- registrar aporte de meta
- criar/editar/excluir item de wishlist
- upload de anexo
- criar nota fiscal e itens revisados

---

# Requisitos de autenticação e autorização
1. usar Supabase Auth
2. proteger todas as rotas privadas
3. aplicar RLS em todas as tabelas com `user_id`
4. cada policy deve permitir apenas acesso ao próprio usuário
5. buckets do storage devem seguir a mesma lógica

---

# Requisitos de PWA
1. criar `manifest.webmanifest`
2. ícones para instalação
3. service worker
4. cache de assets e páginas principais
5. fallback elegante para offline parcial
6. layout em mobile com sensação de app instalado

---

# Requisitos de qualidade de código
1. TypeScript estrito
2. validação de formulários com Zod
3. componentes reutilizáveis
4. separação entre UI, regra e acesso a dados
5. nomes de arquivos claros
6. evitar lógica complexa dentro de componentes visuais
7. usar loading, empty states e error states em todas as telas de dados

---

# Prompt mestre para IA programadora

## Objetivo
Crie uma aplicação chamada **Financeiro do Yago**, em Next.js App Router com TypeScript, Tailwind, shadcn/ui e Supabase, em formato PWA, para uso pessoal e mono-usuário, com interface premium, mobile-first e arquitetura profissional.

## Requisitos obrigatórios
- autenticação com Supabase Auth
- banco de dados no Supabase com as tabelas descritas nesta especificação
- Row Level Security em todas as tabelas do usuário
- dashboard consolidado
- módulo Finanças com mensal, anual, contas, cartões, lançamentos e categorias
- módulo Investimentos com renda fixa, FIIs, bolsa e cripto
- módulo Milhas com Livelo, Latam Pass e Azul
- módulo Mercado com listas, notas fiscais e histórico de preços
- módulo Lista de Desejo
- módulo Metas & Projetos
- anexos via Supabase Storage
- estrutura pronta para OCR assistido em notas fiscais
- PWA instalável

## Regras de implementação
- gerar código limpo, tipado e escalável
- criar migrations SQL completas
- criar types TypeScript alinhados ao banco
- criar formulários completos com React Hook Form + Zod
- criar dashboard com gráficos e cards
- implementar CRUD completo dos módulos principais
- usar componentes reutilizáveis
- preparar o projeto para evolução futura

## Ordem de entrega recomendada
1. estrutura base do projeto
2. autenticação
3. layout e navegação
4. banco de dados + migrations
5. módulo Finanças
6. dashboard
7. módulo Metas
8. módulo Investimentos
9. módulo Milhas
10. módulo Mercado
11. PWA
12. refinamentos finais

---

# Backlog de construção por fases

## Fase 1
- setup do projeto
- setup do Supabase
- autenticação
- layout base
- sidebar/topbar
- dashboard esqueleto

## Fase 2
- contas bancárias
- categorias
- lançamentos
- filtros
- mensal

## Fase 3
- cartões
- parcelamentos
- faturas
- anual

## Fase 4
- metas e aportes

## Fase 5
- investimentos

## Fase 6
- milhas

## Fase 7
- wishlist

## Fase 8
- mercado
- nota fiscal
- OCR assistido

## Fase 9
- relatórios
- exportações
- PWA refinado

---

# Entregáveis que a IA deve produzir
1. estrutura completa do projeto
2. migrations SQL
3. políticas RLS
4. types TypeScript
5. componentes de UI
6. páginas e rotas
7. server actions/serviços
8. formulários
9. utilitários de cálculo
10. manifest e estrutura PWA
11. documentação de instalação e execução

---

# Próximo documento a ser criado
Depois desta especificação, o próximo material ideal é um **documento técnico de implementação passo a passo**, com:
- comandos de criação do projeto
- SQL pronto das tabelas
- policies prontas
- estrutura de arquivos inicial
- código inicial das telas principais

