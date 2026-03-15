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
}: Props) {
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
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
    <form action={action} method="get" onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] rounded-xl border border-slate-200 p-2">
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
      <Button type="submit" variant={buttonVariant} disabled={submitting || !isValid}>
        {submitting ? "Gerando..." : submitLabel}
      </Button>
      {error ? <p className="sm:col-span-3 text-xs text-rose-700">{error}</p> : null}
    </form>
  );
}
