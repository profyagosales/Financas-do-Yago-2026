"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  action: string;
  defaultStart: string;
  defaultEnd: string;
  submitLabel: string;
  mode?: "summary" | "detailed";
  buttonVariant?: "primary" | "secondary" | "ghost";
  showTypeFilter?: boolean;
  showStatusFilter?: boolean;
  defaultTypeFilter?: "all" | "income" | "expense" | "transfer" | "adjustment";
  defaultStatusFilter?: "all" | "non_canceled" | "pending" | "paid" | "canceled";
  showFormatFilter?: boolean;
  defaultFormat?: "csv" | "json";
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function ExportRangeForm({
  action,
  defaultStart,
  defaultEnd,
  submitLabel,
  mode,
  buttonVariant = "primary",
  showTypeFilter = false,
  showStatusFilter = false,
  defaultTypeFilter = "all",
  defaultStatusFilter = "all",
  showFormatFilter = false,
  defaultFormat = "csv",
}: Props) {
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [typeFilter, setTypeFilter] = useState(defaultTypeFilter);
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [format, setFormat] = useState(defaultFormat);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isValid = useMemo(() => {
    if (!isIsoDate(start) || !isIsoDate(end)) return false;
    return start < end;
  }, [start, end]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!isValid) {
      event.preventDefault();
      setError("Intervalo invalido: a data inicial deve ser menor que a final.");
      return;
    }

    setError(null);
    setSubmitting(true);

    // Libera novamente caso o navegador bloqueie o download.
    setTimeout(() => setSubmitting(false), 2000);
  }

  return (
    <form action={action} method="get" onSubmit={handleSubmit} className="grid gap-2 rounded-xl border border-slate-200 p-2 md:grid-cols-[1fr_1fr_auto]">
      {mode ? <input type="hidden" name="mode" value={mode} /> : null}
      <input
        type="date"
        name="start"
        value={start}
        onChange={(event) => setStart(event.target.value)}
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        required
      />
      <input
        type="date"
        name="end"
        value={end}
        onChange={(event) => setEnd(event.target.value)}
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        required
      />
      {showTypeFilter ? (
        <select
          name="type"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-1"
        >
          <option value="all">Todos os tipos</option>
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
          <option value="transfer">Transferencia</option>
          <option value="adjustment">Ajuste</option>
        </select>
      ) : null}
      {showStatusFilter ? (
        <select
          name="status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-1"
        >
          <option value="all">Todos os status</option>
          <option value="non_canceled">Somente ativos (sem cancelados)</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="canceled">Cancelado</option>
        </select>
      ) : null}
      {showFormatFilter ? (
        <select
          name="format"
          value={format}
          onChange={(event) => setFormat(event.target.value as typeof format)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-1"
        >
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
        </select>
      ) : null}
      <Button type="submit" variant={buttonVariant} disabled={submitting || !isValid}>
        {submitting ? "Gerando..." : submitLabel}
      </Button>
      {error ? <p className="md:col-span-3 text-xs text-rose-700">{error}</p> : null}
    </form>
  );
}
