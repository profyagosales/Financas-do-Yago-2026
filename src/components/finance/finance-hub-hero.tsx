"use client";

import { CalendarSearch, CreditCard, ListPlus, Settings2 } from "lucide-react";
import { CategoryForm } from "@/components/forms/category-form";
import { CreditCardForm } from "@/components/forms/credit-card-form";
import { TransactionForm } from "@/components/forms/transaction-form";
import { ExportRangeForm } from "@/components/finance/export-range-form";
import { FormModal } from "@/components/ui/form-modal";

interface Option {
  id: string;
  label: string;
}

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface Props {
  defaultStart: string;
  defaultEnd: string;
  categories: Option[];
  accounts: Option[];
  cards: Option[];
  icons: Option[];
  tags: Tag[];
}

export function FinanceHubHero({
  defaultStart,
  defaultEnd,
  categories,
  accounts,
  cards,
  icons,
  tags,
}: Props) {
  return (
    <section className="rounded-3xl border border-[color:var(--border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_18%,white),color-mix(in_srgb,#22c55e_10%,white))] p-5 md:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-black text-slate-900">Financas</h2>
        <p className="text-sm text-slate-700">Acoes rapidas do modulo sem abrir paginas longas.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <FormModal
          title="Escolher mes"
          triggerLabel="Escolher mes"
          size="md"
          triggerVariant="secondary"
          description="Exportacao rapida por periodo no proprio fluxo do hub."
        >
          <ExportRangeForm
            action="/api/exports/financas/mensal"
            defaultStart={defaultStart}
            defaultEnd={defaultEnd}
            submitLabel="Exportar CSV"
            showTypeFilter
            showStatusFilter
            showFormatFilter
            defaultTypeFilter="all"
            defaultStatusFilter="all"
            defaultFormat="csv"
          />
        </FormModal>

        <FormModal
          title="Cadastrar lancamento"
          triggerLabel="Cadastrar lancamento"
          size="xl"
          triggerVariant="secondary"
          description="Receita, despesa, transferencia e ajuste em um unico formulario."
        >
          <TransactionForm
            categories={categories}
            accounts={accounts}
            cards={cards}
            icons={icons}
            tags={tags}
          />
        </FormModal>

        <FormModal
          title="Cadastrar cartao"
          triggerLabel="Cartoes"
          size="md"
          triggerVariant="secondary"
          description="Adicione um novo cartao sem sair do dashboard de financas."
        >
          <CreditCardForm />
        </FormModal>

        <FormModal
          title="Configuracoes rapidas"
          triggerLabel="Configuracoes"
          size="xl"
          triggerVariant="secondary"
          description="Atalhos basicos de categoria e exportacao."
        >
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-700">Categorias</h3>
              <CategoryForm />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-700">Exportacao</h3>
              <ExportRangeForm
                action="/api/exports/financas/mensal"
                defaultStart={defaultStart}
                defaultEnd={defaultEnd}
                submitLabel="Exportar CSV customizado"
                showTypeFilter
                showStatusFilter
                showFormatFilter
                defaultTypeFilter="all"
                defaultStatusFilter="all"
                defaultFormat="csv"
              />
            </div>
          </div>
        </FormModal>
      </div>

      <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><CalendarSearch size={14} /> Mês</p>
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><ListPlus size={14} /> Lançamento</p>
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><CreditCard size={14} /> Cartões</p>
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><Settings2 size={14} /> Configurações</p>
      </div>
    </section>
  );
}
