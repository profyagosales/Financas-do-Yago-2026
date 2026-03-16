"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { ArrowUpDown, FilePlus2, Landmark, PieChart } from "lucide-react";
import { InvestmentAssetForm } from "@/components/forms/investment-asset-form";
import { InvestmentTransactionForm } from "@/components/forms/investment-transaction-form";
import { FormModal } from "@/components/ui/form-modal";

interface AssetOption {
  id: string;
  label: string;
}

type AssetClass = "fixed_income" | "fii" | "stock" | "crypto";

const CLASSES: Array<{ value: AssetClass; label: string; href: Route }> = [
  { value: "fixed_income", label: "Renda Fixa", href: "/investimentos/renda-fixa" },
  { value: "fii", label: "FIIs", href: "/investimentos/fiis" },
  { value: "stock", label: "Bolsa", href: "/investimentos/bolsa" },
  { value: "crypto", label: "Cripto", href: "/investimentos/cripto" },
];

function InvestmentAssetQuickForm() {
  const [assetClass, setAssetClass] = useState<AssetClass>("fixed_income");

  return (
    <div className="space-y-3">
      <select
        value={assetClass}
        onChange={(event) => setAssetClass(event.target.value as AssetClass)}
        className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
      >
        {CLASSES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <InvestmentAssetForm key={assetClass} assetClass={assetClass} />
    </div>
  );
}

export function InvestmentsHubHero({ assets }: { assets: AssetOption[] }) {
  const assetCount = assets.length;
  const hasAssets = assetCount > 0;

  const summary = useMemo(() => {
    if (!hasAssets) return "Nenhum ativo cadastrado ainda.";
    if (assetCount === 1) return "1 ativo pronto para movimentacoes.";
    return `${assetCount} ativos prontos para movimentacoes.`;
  }, [assetCount, hasAssets]);

  return (
    <section className="rounded-3xl border border-[color:var(--border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_18%,white),color-mix(in_srgb,#38bdf8_10%,white))] p-5 md:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-black text-slate-900">Investimentos</h2>
        <p className="text-sm text-slate-700">Comandos principais do modulo sem navegar por varias telas.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <FormModal
          title="Escolher classe"
          triggerLabel="Escolher classe"
          size="md"
          triggerVariant="secondary"
          description="Acesse a classe certa com um clique."
        >
          <div className="grid gap-2">
            {CLASSES.map((item) => (
              <Link
                key={item.value}
                href={item.href}
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--button-ghost-hover)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </FormModal>

        <FormModal
          title="Novo ativo"
          triggerLabel="Novo ativo"
          size="xl"
          triggerVariant="secondary"
          description="Cadastre um ativo de qualquer classe direto no hub."
        >
          <InvestmentAssetQuickForm />
        </FormModal>

        <FormModal
          title="Nova movimentacao"
          triggerLabel="Movimentacao"
          size="xl"
          triggerVariant="secondary"
          description="Registre compra, venda, aporte, provento ou ajuste."
        >
          {hasAssets ? (
            <InvestmentTransactionForm assets={assets} />
          ) : (
            <p className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-sm text-[color:var(--muted)]">
              Cadastre um ativo primeiro para registrar movimentacoes.
            </p>
          )}
        </FormModal>

        <FormModal
          title="Carteira e rebalanceamento"
          triggerLabel="Carteira"
          size="md"
          triggerVariant="secondary"
          description="Atalhos de revisao da carteira atual."
        >
          <div className="grid gap-2">
            <Link
              href="/investimentos/rebalanceamento"
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--button-ghost-hover)]"
            >
              Abrir rebalanceamento
            </Link>
            <p className="rounded-xl bg-white/75 px-3 py-2 text-sm text-slate-700">{summary}</p>
          </div>
        </FormModal>
      </div>

      <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><Landmark size={14} /> Classe</p>
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><FilePlus2 size={14} /> Ativo</p>
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><ArrowUpDown size={14} /> Movimentacao</p>
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><PieChart size={14} /> Carteira</p>
      </div>
    </section>
  );
}
