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
