"use client";

import { useState } from "react";
import { ArrowLeft, Building2, CalendarDays, CreditCard, ListPlus, Settings2, Tags } from "lucide-react";
import { BankAccountForm } from "@/components/forms/bank-account-form";
import { CategoryForm } from "@/components/forms/category-form";
import { CreditCardForm } from "@/components/forms/credit-card-form";
import { TransactionForm } from "@/components/forms/transaction-form";
import { PrintFiltersModal } from "@/components/common/print-filters-modal";
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
  viewMode: "month" | "year";
  monthParam: string;
  yearParam: string;
  categories: Option[];
  accounts: Option[];
  cards: Option[];
  tags: Tag[];
}

export function FinanceHubHero({
  viewMode,
  monthParam,
  yearParam,
  categories,
  accounts,
  cards,
  tags,
}: Props) {
  const [openSettings, setOpenSettings] = useState(false);

  return (
    <section className="no-print rounded-3xl border border-[color:var(--border)] bg-[linear-gradient(130deg,color-mix(in_srgb,var(--accent)_16%,white),color-mix(in_srgb,#16a34a_9%,white))] p-5 md:p-6">
      <div className="mb-3 flex items-center justify-between">
        <a
          href="/dashboard"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-white/85 text-[color:var(--foreground)] transition hover:opacity-80"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </a>

        <h2 className="text-xl font-black text-[color:var(--foreground)]">Financas</h2>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenSettings((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--border)] bg-white/85 text-[color:var(--foreground)] transition hover:opacity-80"
            aria-label="Configuracoes"
          >
            <Settings2 size={18} />
          </button>
          {openSettings ? (
            <div className="absolute right-0 top-12 z-10 min-w-52 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2 shadow-xl">
              <a
                href="/financas/contas"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--muted-surface)]"
              >
                <Building2 size={15} />
                Gerenciar Contas
              </a>
              <a
                href="/financas/cartoes"
                className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--muted-surface)]"
              >
                <CreditCard size={15} />
                Gerenciar Cartoes
              </a>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <FormModal
          title="Cadastrar lancamento"
          triggerLabel={<span className="inline-flex items-center gap-2"><ListPlus size={16} />Cadastrar</span>}
          size="xl"
          triggerVariant="primary"
        >
          <TransactionForm
            categories={categories}
            accounts={accounts}
            cards={cards}
            tags={tags}
          />
        </FormModal>

        <FormModal
          title="Gerenciar contas"
          triggerLabel={<span className="inline-flex items-center gap-2"><Building2 size={16} />Contas</span>}
          size="md"
          triggerVariant="secondary"
          description="Acesso rapido para cadastrar conta sem sair do hub."
        >
          <BankAccountForm />
        </FormModal>

        <FormModal
          title="Gerenciar cartoes"
          triggerLabel={<span className="inline-flex items-center gap-2"><CreditCard size={16} />Cartoes</span>}
          size="md"
          triggerVariant="secondary"
          description="Adicione um novo cartao sem sair do dashboard de financas."
        >
          <CreditCardForm />
        </FormModal>

        <FormModal
          title="Gerenciar categorias"
          triggerLabel={<span className="inline-flex items-center gap-2"><Tags size={16} />Categorias</span>}
          size="md"
          triggerVariant="secondary"
          description="Cadastro e ajustes de categorias em contexto rapido."
        >
          <CategoryForm />
        </FormModal>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={`?view=year&year=${yearParam}`}
          className={`inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${viewMode === "year" ? "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-fg)]" : "border border-[color:var(--border)] bg-white/85 text-[color:var(--foreground)]"}`}
        >
          <CalendarDays size={15} /> Ano
        </a>
        <a
          href={`?view=month&month=${monthParam}`}
          className={`inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${viewMode === "month" ? "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-fg)]" : "border border-[color:var(--border)] bg-white/85 text-[color:var(--foreground)]"}`}
        >
          <CalendarDays size={15} /> Mes
        </a>

        <PrintFiltersModal
          iconOnly
          triggerLabel="Imprimir"
          title="Imprimir visao financeira"
          description="Ajuste filtros de referencia e gere a impressao da visao atual do hub."
          defaultStart={viewMode === "month" ? `${monthParam}-01` : `${yearParam}-01-01`}
          defaultEnd={viewMode === "month" ? `${monthParam}-31` : `${yearParam}-12-31`}
          triggerVariant="ghost"
        />
      </div>
    </section>
  );
}
