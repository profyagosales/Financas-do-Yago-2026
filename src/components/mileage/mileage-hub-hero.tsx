"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { Goal, Plane, PlusCircle, Route as RouteIcon } from "lucide-react";
import { MileageEntryForm } from "@/components/forms/mileage-entry-form";
import { MileageGoalForm } from "@/components/forms/mileage-goal-form";
import { FormModal } from "@/components/ui/form-modal";

interface ProgramOption {
  id: string;
  name: string;
  href: Route;
  goalPoints?: number | null;
  goalDueDate?: string | null;
  goalNotes?: string | null;
}

function ProgramSelector({
  programs,
  mode,
}: {
  programs: ProgramOption[];
  mode: "entry" | "goal";
}) {
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");

  const selected = useMemo(() => programs.find((item) => item.id === programId), [programId, programs]);

  if (programs.length === 0 || !selected) {
    return (
      <p className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-sm text-[color:var(--muted)]">
        Cadastre um programa de milhas antes de usar esta acao.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <select
        value={programId}
        onChange={(event) => setProgramId(event.target.value)}
        className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
      >
        {programs.map((program) => (
          <option key={program.id} value={program.id}>
            {program.name}
          </option>
        ))}
      </select>

      {mode === "entry" ? (
        <MileageEntryForm key={`entry-${selected.id}`} programId={selected.id} />
      ) : (
        <MileageGoalForm
          key={`goal-${selected.id}`}
          programId={selected.id}
          goalPoints={selected.goalPoints}
          goalDueDate={selected.goalDueDate}
          goalNotes={selected.goalNotes}
        />
      )}
    </div>
  );
}

export function MileageHubHero({ programs }: { programs: ProgramOption[] }) {
  return (
    <section className="rounded-3xl border border-[color:var(--border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_18%,white),color-mix(in_srgb,#f59e0b_12%,white))] p-5 md:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-black text-slate-900">Milhas</h2>
        <p className="text-sm text-slate-700">Acoes principais por programa sem sair da visao geral.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <FormModal
          title="Escolher programa"
          triggerLabel="Escolher programa"
          size="md"
          triggerVariant="secondary"
          description="Abra rapidamente o programa desejado."
        >
          <div className="grid gap-2">
            {programs.length === 0 ? (
              <p className="rounded-xl bg-white/75 px-3 py-2 text-sm text-slate-700">Sem programas ativos ainda.</p>
            ) : (
              programs.map((program) => (
                <Link
                  key={program.id}
                  href={program.href}
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--button-ghost-hover)]"
                >
                  {program.name}
                </Link>
              ))
            )}
          </div>
        </FormModal>

        <FormModal
          title="Nova movimentacao"
          triggerLabel="Movimentacao"
          size="xl"
          triggerVariant="secondary"
          description="Registro de acumulo, resgate, expiracao e ajustes."
        >
          <ProgramSelector programs={programs} mode="entry" />
        </FormModal>

        <FormModal
          title="Meta de emissao"
          triggerLabel="Meta"
          size="xl"
          triggerVariant="secondary"
          description="Defina objetivo de pontos por programa."
        >
          <ProgramSelector programs={programs} mode="goal" />
        </FormModal>

        <FormModal
          title="Atalhos de controle"
          triggerLabel="Atalhos"
          size="md"
          triggerVariant="secondary"
          description="Acompanhe vencimento e revisao de saldo."
        >
          <div className="space-y-2 text-sm text-slate-700">
            <p className="rounded-xl bg-white/75 px-3 py-2">Use a acao de movimentacao para registrar expiracoes rapidamente.</p>
            <p className="rounded-xl bg-white/75 px-3 py-2">Programas ativos no momento: {programs.length}.</p>
          </div>
        </FormModal>
      </div>

      <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><Plane size={14} /> Programa</p>
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><PlusCircle size={14} /> Pontos</p>
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><Goal size={14} /> Meta</p>
        <p className="flex items-center gap-1 rounded-lg bg-white/70 px-3 py-2"><RouteIcon size={14} /> Controle</p>
      </div>
    </section>
  );
}
