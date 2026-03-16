"use client";

import { Printer } from "lucide-react";
import { FormModal } from "@/components/ui/form-modal";
import { Button } from "@/components/ui/button";

interface PrintFiltersModalProps {
  title?: string;
  description?: string;
  triggerLabel?: string;
  triggerVariant?: "primary" | "secondary" | "ghost";
  defaultStart?: string;
  defaultEnd?: string;
  defaultType?: string;
  defaultStatus?: string;
  iconOnly?: boolean;
}

export function PrintFiltersModal({
  title = "Imprimir relatorio",
  description = "Ajuste filtros de exibicao e gere a versao pronta para impressao.",
  triggerLabel = "Imprimir",
  triggerVariant = "secondary",
  defaultStart,
  defaultEnd,
  defaultType = "all",
  defaultStatus = "all",
  iconOnly = false,
}: PrintFiltersModalProps) {
  return (
    <FormModal
      title={title}
      description={description}
      size="md"
      triggerVariant={triggerVariant}
      triggerLabel={
        iconOnly ? (
          <span className="inline-flex items-center" aria-label={triggerLabel}>
            <Printer size={16} />
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Printer size={16} />
            {triggerLabel}
          </span>
        )
      }
    >
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          window.print();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-[color:var(--muted)]">Data inicial</span>
            <input
              type="date"
              name="start"
              defaultValue={defaultStart}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-[color:var(--muted)]">Data final</span>
            <input
              type="date"
              name="end"
              defaultValue={defaultEnd}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-[color:var(--muted)]">Tipo</span>
            <select
              name="type"
              defaultValue={defaultType}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
              <option value="transfer">Transferencias</option>
              <option value="adjustment">Ajustes</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-[color:var(--muted)]">Status</span>
            <select
              name="status"
              defaultValue={defaultStatus}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="canceled">Cancelado</option>
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--muted-surface)] px-3 py-2 text-xs text-[color:var(--muted)]">
          A impressao usa o conteudo atualmente exibido na tela e aplica o layout otimizado para papel.
        </div>

        <div className="flex justify-end">
          <Button type="submit">Preparar e imprimir</Button>
        </div>
      </form>
    </FormModal>
  );
}
