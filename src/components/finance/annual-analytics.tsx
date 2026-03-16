"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { toMoney } from "@/lib/utils";

interface MonthlyRow {
  month: string;
  income: number;
  expense: number;
  result: number;
  count: number;
}

interface Props {
  monthly: MonthlyRow[];
  currency: string;
  locale: string;
}

export function AnnualAnalytics({ monthly, currency, locale }: Props) {
  const formatMoney = (value: number) => toMoney(value, locale, currency);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Receitas x despesas no ano</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthly}>
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
        <h3 className="mb-3 text-sm font-bold text-slate-700">Sazonalidade do resultado</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" />
              <Tooltip formatter={(value) => formatMoney(Number(value ?? 0))} />
              <Bar dataKey="result" name="Resultado" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}