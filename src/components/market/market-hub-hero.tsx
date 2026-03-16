"use client";

import Link from "next/link";
import { FileText, ListChecks, ShoppingBasket, SquareArrowOutUpRight } from "lucide-react";
import { GroceryItemForm } from "@/components/forms/grocery-item-form";
import { GroceryListForm } from "@/components/forms/grocery-list-form";
import { GroceryNoteForm } from "@/components/forms/grocery-note-form";
import { FormModal } from "@/components/ui/form-modal";

interface ListOption {
  id: string;
  label: string;
}

const FLOWS = [
  { href: "/mercado/listas", label: "Listas" },
  { href: "/mercado/notas", label: "Notas" },
  { href: "/mercado/historico", label: "Histórico" },
] as const;

export function MarketHubHero({ lists }: { lists: ListOption[] }) {
  return (
    <section className="rounded-3xl border border-[color:var(--border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_18%,white),color-mix(in_srgb,#f59e0b_12%,white))] p-5 md:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-black text-slate-900">Mercado</h2>
        <p className="text-sm text-slate-700">Ações principais para lista, item e nota no mesmo painel.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <FormModal
          title="Nova lista"
          triggerLabel="Nova lista"
          size="md"
          triggerVariant="secondary"
          description="Crie uma lista de compras sem trocar de pagina."
        >
          <GroceryListForm />
        </FormModal>

        <FormModal
          title="Novo item"
          triggerLabel="Novo item"
          size="xl"
          triggerVariant="secondary"
          description="Inclua item em lista existente ou solto."
        >
          <GroceryItemForm lists={lists} />
        </FormModal>

        <FormModal
          title="Nova nota"
          triggerLabel="Nova nota"
          size="lg"
          triggerVariant="secondary"
          description="Registrar nota para revisão e comparativo de preco."
        >
          <GroceryNoteForm />
        </FormModal>

        <FormModal
          title="Escolher fluxo"
          triggerLabel="Fluxos"
          size="md"
          triggerVariant="secondary"
          description="Abra rapidamente o fluxo de trabalho de mercado."
        >
          <div className="grid gap-2">
            {FLOWS.map((flow) => (
              <Link
                key={flow.href}
                href={flow.href}
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--button-ghost-hover)]"
              >
                {flow.label}
              </Link>
            ))}
          </div>
        </FormModal>
      </div>

      <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><ListChecks size={14} /> Lista</p>
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><ShoppingBasket size={14} /> Item</p>
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><FileText size={14} /> Nota</p>
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><SquareArrowOutUpRight size={14} /> Fluxos</p>
      </div>
    </section>
  );
}
