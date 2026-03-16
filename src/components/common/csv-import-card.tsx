"use client";

import { useRef, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  exampleColumns: string[];
  action: (formData: FormData) => Promise<{ ok: boolean; imported: number; errors: string[] }>;
  onSuccess?: () => void;
}

export function CsvImportCard({ title, exampleColumns, action, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await action(fd);
      setResult({ imported: res.imported, errors: res.errors });
      if (res.ok && res.errors.length === 0) {
        onSuccess?.();
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  return (
    <Card>
      <h3 className="mb-1 text-sm font-bold text-slate-700">{title}</h3>
      <p className="mb-2 text-xs text-slate-500">
        CSV com colunas:{" "}
        <span className="font-mono text-slate-700">{exampleColumns.join(", ")}</span>
      </p>
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="flex-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-700"
        />
        <Button type="submit" disabled={isPending} className="shrink-0 text-sm">
          {isPending ? "Importando…" : "Importar"}
        </Button>
      </form>
      {result && (
        <div className="mt-3 space-y-1">
          {result.imported > 0 && (
            <p className="text-xs font-semibold text-emerald-700">
              {result.imported} registro{result.imported !== 1 ? "s" : ""} importado{result.imported !== 1 ? "s" : ""} com sucesso.
            </p>
          )}
          {result.errors.map((err, i) => (
            <p key={i} className="text-xs text-rose-600">
              {err}
            </p>
          ))}
          {result.imported === 0 && result.errors.length === 0 && (
            <p className="text-xs text-slate-500">Nenhum registro novo importado.</p>
          )}
        </div>
      )}
    </Card>
  );
}
