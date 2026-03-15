"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export type ExportHistoryRow = {
  id: string;
  module: string;
  export_name: string;
  format: "csv" | "json";
  mode: string | null;
  row_count: number;
  created_at: string;
};

interface Props {
  rows: ExportHistoryRow[];
  nowIso: string;
}

const PAGE_SIZE = 10;

export function ExportHistoryPanel({ rows, nowIso }: Props) {
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [page, setPage] = useState(1);

  const moduleOptions = useMemo(() => {
    return ["all", ...new Set(rows.map((row) => row.module))];
  }, [rows]);

  const filtered = useMemo(() => {
    const now = Date.parse(nowIso);
    const periodDays =
      periodFilter === "7d" ? 7 : periodFilter === "30d" ? 30 : periodFilter === "90d" ? 90 : null;

    return rows.filter((row) => {
      if (moduleFilter !== "all" && row.module !== moduleFilter) return false;
      if (formatFilter !== "all" && row.format !== formatFilter) return false;

      if (periodDays !== null) {
        const cutoff = now - periodDays * 24 * 60 * 60 * 1000;
        if (new Date(row.created_at).getTime() < cutoff) return false;
      }

      if (!query.trim()) return true;
      const hay = [row.module, row.export_name, row.format, row.mode ?? "", row.created_at].join(" ").toLowerCase();
      return hay.includes(query.trim().toLowerCase());
    });
  }, [rows, moduleFilter, formatFilter, periodFilter, query, nowIso]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const pageRows = filtered.slice(startIdx, endIdx);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-4">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nome/modulo/formato"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />

        <select
          value={moduleFilter}
          onChange={(event) => {
            setModuleFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
          {moduleOptions.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "Todos os modulos" : item}
            </option>
          ))}
        </select>

        <select
          value={formatFilter}
          onChange={(event) => {
            setFormatFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">Todos os formatos</option>
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
        </select>

        <select
          value={periodFilter}
          onChange={(event) => {
            setPeriodFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">Todo periodo</option>
          <option value="7d">Ultimos 7 dias</option>
          <option value="30d">Ultimos 30 dias</option>
          <option value="90d">Ultimos 90 dias</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-600">Nenhuma exportacao encontrada para os filtros aplicados.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 py-2 pr-3">Data</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Modulo</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Nome</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Formato</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Modo</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Linhas</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b border-slate-100 py-2 pr-3">{new Date(item.created_at).toLocaleString("pt-BR")}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.module}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.export_name}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.format.toUpperCase()}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.mode ?? "-"}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.row_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Mostrando {startIdx + 1}-{Math.min(endIdx, filtered.length)} de {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="text-xs text-slate-600">Pagina {safePage} de {totalPages}</span>
              <Button
                type="button"
                variant="secondary"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Proxima
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
