"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { toMoney } from "@/lib/utils";

type MonthlyTrend = {
  month: string;
  income: number;
  expense: number;
  result: number;
};

type CategoryItem = {
  name: string;
  total: number;
};

type InvestmentClassItem = {
  asset_class: string;
  invested: number;
  sold: number;
  income: number;
};

interface Props {
  currency: string;
  locale: string;
  monthlyTrend: MonthlyTrend[];
  categories: CategoryItem[];
  invByClass: InvestmentClassItem[];
}

const PIE_COLORS = ["#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#22c55e"];

function classLabel(assetClass: string) {
  if (assetClass === "fixed_income") return "Renda Fixa";
  if (assetClass === "fii") return "FIIs";
  if (assetClass === "stock") return "Bolsa";
  if (assetClass === "crypto") return "Cripto";
  return assetClass;
}

export function ReportsAnalytics({ currency, locale, monthlyTrend, categories, invByClass }: Props) {
  const formatMoney = (value: number) => toMoney(value, locale, currency);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Evolucao financeira</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" />
              <Tooltip formatter={(value) => formatMoney(Number(value ?? 0))} />
              <Area type="monotone" dataKey="income" name="Receitas" stroke="#16a34a" fill="#86efac" />
              <Area type="monotone" dataKey="expense" name="Despesas" stroke="#ea580c" fill="#fdba74" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Composicao das despesas</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categories} dataKey="total" nameKey="name" outerRadius={100} label>
                {categories.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(Number(value ?? 0))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="xl:col-span-2">
        <h3 className="mb-3 text-sm font-bold text-slate-700">Investimentos por classe</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={invByClass.map((item) => ({ ...item, label: classLabel(item.asset_class) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" />
              <Tooltip formatter={(value) => formatMoney(Number(value ?? 0))} />
              <Bar dataKey="invested" name="Investido" fill="#0284c7" radius={[6, 6, 0, 0]} />
              <Bar dataKey="sold" name="Resgatado" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="income" name="Proventos" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}