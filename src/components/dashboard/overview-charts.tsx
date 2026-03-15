"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { toMoney } from "@/lib/utils";

const evolution = [
  { month: "Jan", receitas: 9300, despesas: 6100 },
  { month: "Fev", receitas: 9400, despesas: 6400 },
  { month: "Mar", receitas: 9700, despesas: 5900 },
  { month: "Abr", receitas: 9800, despesas: 6300 },
  { month: "Mai", receitas: 10200, despesas: 6500 },
];

const categories = [
  { name: "Moradia", value: 2300 },
  { name: "Mercado", value: 1300 },
  { name: "Transporte", value: 700 },
  { name: "Lazer", value: 850 },
  { name: "Saude", value: 600 },
];

export function OverviewCharts() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Evolucao mensal</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => toMoney(Number(value ?? 0))} />
              <Area type="monotone" dataKey="receitas" stroke="#0ea5e9" fill="#bae6fd" />
              <Area type="monotone" dataKey="despesas" stroke="#f97316" fill="#fed7aa" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Despesas por categoria</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categories} dataKey="value" nameKey="name" outerRadius={100} fill="#0284c7" label />
              <Tooltip formatter={(value) => toMoney(Number(value ?? 0))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
