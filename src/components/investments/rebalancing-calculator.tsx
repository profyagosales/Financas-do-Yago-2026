"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AssetClass = "fixed_income" | "fii" | "stock" | "crypto";

interface ClassData {
  key: AssetClass;
  label: string;
  totalInvested: number;
}

interface Props {
  classes: ClassData[];
  locale: string;
  currency: string;
}

const STORAGE_KEY = "financeiro-rebalancing-targets";
const CLASS_LABELS: Record<AssetClass, string> = {
  fixed_income: "Renda Fixa",
  fii: "FIIs",
  stock: "Bolsa",
  crypto: "Cripto",
};

type Targets = Partial<Record<AssetClass, number>>;

function formatMoney(value: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

function formatPct(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value) + "%";
}

export function RebalancingCalculator({ classes, locale, currency }: Props) {
  const [targets, setTargets] = useState<Targets>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Targets) : {};
    } catch {
      return {};
    }
  });
  const [saved, setSaved] = useState(false);

  const totalInvested = classes.reduce((s, c) => s + c.totalInvested, 0);
  const totalTarget = Object.values(targets).reduce<number>((s, v) => s + (v ?? 0), 0);
  const targetError = totalTarget > 100.01;

  function handleTargetChange(key: AssetClass, value: string) {
    const num = parseFloat(value.replace(",", "."));
    setTargets((prev) => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
    setSaved(false);
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
    setSaved(true);
  }

  type Row = {
    key: AssetClass;
    label: string;
    totalInvested: number;
    currentPct: number;
    targetPct: number;
    targetAmount: number;
    diff: number;
    diffAmount: number;
  };

  const rows: Row[] = classes.map((c) => {
    const currentPct = totalInvested > 0 ? (c.totalInvested / totalInvested) * 100 : 0;
    const targetPct = targets[c.key] ?? 0;
    const targetAmount = (targetPct / 100) * totalInvested;
    const diff = targetPct - currentPct;
    const diffAmount = targetAmount - c.totalInvested;
    return { ...c, currentPct, targetPct, targetAmount, diff, diffAmount };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm text-slate-600">
          Patrimonio total em investimentos:{" "}
          <span className="font-bold text-slate-900">{formatMoney(totalInvested, locale, currency)}</span>
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-3 pl-4 pr-3 font-medium">Classe</th>
              <th className="py-3 pr-3 font-medium">Investido</th>
              <th className="py-3 pr-3 font-medium">% atual</th>
              <th className="py-3 pr-3 font-medium">% alvo</th>
              <th className="py-3 pr-3 font-medium">Valor alvo</th>
              <th className="py-3 pr-3 font-medium">Diferenca</th>
              <th className="py-3 pr-3 font-medium">Acao</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 pl-4 pr-3 font-medium text-slate-800">{CLASS_LABELS[row.key]}</td>
                <td className="py-3 pr-3 tabular-nums">{formatMoney(row.totalInvested, locale, currency)}</td>
                <td className="py-3 pr-3 tabular-nums text-slate-600">{formatPct(row.currentPct)}</td>
                <td className="py-3 pr-3">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={targets[row.key] ?? ""}
                    onChange={(e) => handleTargetChange(row.key, e.target.value)}
                    placeholder="0"
                    className="w-24 text-right"
                  />
                </td>
                <td className="py-3 pr-3 tabular-nums text-slate-600">
                  {row.targetPct > 0 ? formatMoney(row.targetAmount, locale, currency) : "—"}
                </td>
                <td
                  className={`py-3 pr-3 tabular-nums font-semibold ${
                    Math.abs(row.diffAmount) < 1
                      ? "text-slate-400"
                      : row.diff > 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                  }`}
                >
                  {row.targetPct > 0
                    ? `${row.diff > 0 ? "+" : ""}${formatPct(row.diff)} (${row.diffAmount > 0 ? "+" : ""}${formatMoney(row.diffAmount, locale, currency)})`
                    : "—"}
                </td>
                <td className="py-3 pr-3 text-xs font-semibold">
                  {Math.abs(row.diffAmount) < 1 || row.targetPct === 0 ? (
                    <span className="text-slate-400">—</span>
                  ) : row.diffAmount > 0 ? (
                    <span className="text-emerald-700">Comprar</span>
                  ) : (
                    <span className="text-rose-700">Vender</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 text-slate-700">
              <td className="py-3 pl-4 pr-3 font-bold">Total</td>
              <td className="py-3 pr-3 tabular-nums font-bold">{formatMoney(totalInvested, locale, currency)}</td>
              <td className="py-3 pr-3 tabular-nums font-bold">{formatPct(100)}</td>
              <td
                className={`py-3 pr-3 tabular-nums font-bold ${
                  targetError ? "text-rose-600" : totalTarget > 0 ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {formatPct(totalTarget)}
                {targetError && <span className="ml-1 text-xs">(excede 100%)</span>}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} variant={saved ? "secondary" : "primary"} disabled={targetError}>
          {saved ? "Metas salvas" : "Salvar metas"}
        </Button>
        {targetError && (
          <p className="text-xs text-rose-600">A soma dos percentuais alvo nao pode exceder 100%.</p>
        )}
        {totalTarget > 0 && !targetError && Math.abs(totalTarget - 100) > 0.1 && (
          <p className="text-xs text-amber-600">
            Soma atual: {formatPct(totalTarget)} — {formatPct(100 - totalTarget)} nao alocados.
          </p>
        )}
      </div>
    </div>
  );
}
