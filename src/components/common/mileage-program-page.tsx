import { deleteMileageEntry } from "@/actions/mileage";
import { importMileageCsv } from "@/actions/mileage";
import { CsvImportCard } from "@/components/common/csv-import-card";
import { MileageEntryForm } from "@/components/forms/mileage-entry-form";
import { MileageGoalForm } from "@/components/forms/mileage-goal-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type EntryType = "earn" | "transfer" | "redeem" | "expire" | "adjustment";

type EntryRow = {
  id: string;
  entry_type: EntryType;
  points: number;
  occurred_at: string;
  expires_at: string | null;
  source: string | null;
  notes: string | null;
};

const ENTRY_LABELS: Record<EntryType, string> = {
  earn: "Acumulo",
  transfer: "Transferencia",
  redeem: "Resgate",
  expire: "Expiracao",
  adjustment: "Ajuste",
};

const ENTRY_TONE: Record<EntryType, string> = {
  earn: "border-emerald-200 bg-emerald-50 text-emerald-800",
  transfer: "border-sky-200 bg-sky-50 text-sky-800",
  redeem: "border-amber-200 bg-amber-50 text-amber-800",
  expire: "border-rose-200 bg-rose-50 text-rose-800",
  adjustment: "border-slate-200 bg-slate-50 text-slate-700",
};

function calcBalance(entries: EntryRow[]) {
  return entries.reduce((sum, e) => {
    const add = e.entry_type === "earn" || e.entry_type === "transfer";
    return sum + (add ? e.points : -e.points);
  }, 0);
}

function getExpiringWithin90Days(entries: EntryRow[]) {
  const today = new Date();
  const cutoff = new Date();
  cutoff.setDate(today.getDate() + 90);
  return entries.filter((e) => {
    if (!e.expires_at || e.entry_type !== "earn") return false;
    const d = new Date(e.expires_at);
    return d >= today && d <= cutoff;
  });
}

async function getData(programName: string) {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      prefs: { locale: "pt-BR" },
      programId: null as string | null,
      goalPoints: null as number | null,
      goalDueDate: null as string | null,
      goalNotes: null as string | null,
      entries: [] as EntryRow[],
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return {
      hasEnv: true,
      prefs: { locale: "pt-BR" },
      programId: null as string | null,
      goalPoints: null as number | null,
      goalDueDate: null as string | null,
      goalNotes: null as string | null,
      entries: [] as EntryRow[],
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  const { data: programs } = await supabase
    .from("mileage_programs")
    .select("id, goal_points, goal_due_date, goal_notes")
    .eq("user_id", userId)
    .eq("name", programName)
    .limit(1);

  let programId = programs?.[0]?.id ?? null;
  let goalPoints = programs?.[0]?.goal_points === null || programs?.[0]?.goal_points === undefined
    ? null
    : Number(programs[0].goal_points);
  let goalDueDate = programs?.[0]?.goal_due_date ?? null;
  let goalNotes = programs?.[0]?.goal_notes ?? null;

  if (!programId) {
    const { data: created } = await supabase
      .from("mileage_programs")
      .insert({ user_id: userId, name: programName })
      .select("id, goal_points, goal_due_date, goal_notes")
      .single();
    programId = created?.id ?? null;
    goalPoints = created?.goal_points === null || created?.goal_points === undefined ? null : Number(created.goal_points);
    goalDueDate = created?.goal_due_date ?? null;
    goalNotes = created?.goal_notes ?? null;
  }

  if (!programId) {
    return {
      hasEnv: true,
      prefs,
      programId: null as string | null,
      goalPoints: null as number | null,
      goalDueDate: null as string | null,
      goalNotes: null as string | null,
      entries: [] as EntryRow[],
    };
  }

  const { data: raw } = await supabase
    .from("mileage_entries")
    .select("id, entry_type, points, occurred_at, expires_at, source, notes")
    .eq("user_id", userId)
    .eq("program_id", programId)
    .order("occurred_at", { ascending: false })
    .limit(200);

  const entries = (raw ?? []).map((e) => ({
    ...e,
    points: Number(e.points),
  })) as EntryRow[];

  return { hasEnv: true, prefs, programId, goalPoints, goalDueDate, goalNotes, entries };
}

interface Props {
  programName: string;
  subtitle: string;
}

export async function MileageProgramPage({ programName, subtitle }: Props) {
  const { hasEnv, prefs, programId, goalPoints, goalDueDate, goalNotes, entries } = await getData(programName);
  const formatPoints = (value: number) => value.toLocaleString(prefs.locale);

  const balance = calcBalance(entries);
  const earned = entries
    .filter((e) => e.entry_type === "earn" || e.entry_type === "transfer")
    .reduce((s, e) => s + e.points, 0);
  const redeemed = entries
    .filter((e) => e.entry_type === "redeem")
    .reduce((s, e) => s + e.points, 0);
  const expiring = getExpiringWithin90Days(entries);
  const expiringPoints = expiring.reduce((s, e) => s + e.points, 0);
  const goalProgress = goalPoints && goalPoints > 0 ? Math.min(100, Math.round((balance / goalPoints) * 100)) : null;
  const goalRemaining = goalPoints && goalPoints > 0 ? Math.max(goalPoints - balance, 0) : null;

  const ninety = new Date();
  ninety.setDate(ninety.getDate() + 90);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Milhas › {programName}</h1>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>

      {!hasEnv && (
        <Card>
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar dados reais.
          </p>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Saldo atual</p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {formatPoints(balance)}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total acumulado</p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {formatPoints(earned)}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total resgatado</p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {formatPoints(redeemed)}
          </p>
        </Card>

        <Card
          className={
            expiringPoints > 0
              ? "bg-gradient-to-br from-amber-50 to-orange-50"
              : "bg-gradient-to-br from-white to-slate-50"
          }
        >
          <p className="text-xs uppercase tracking-wide text-slate-500">Vencem em 90 dias</p>
          <p
            className={`mt-1 text-2xl font-black ${
              expiringPoints > 0 ? "text-amber-700" : "text-slate-900"
            }`}
          >
            {formatPoints(expiringPoints)}
          </p>
        </Card>
      </div>

      {programId ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Meta de emissao</h3>
              <p className="mt-1 text-xs text-slate-500">
                Defina quantos pontos deseja acumular para a proxima emissao nesse programa.
              </p>
              {goalPoints ? (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {formatPoints(balance)} / {formatPoints(goalPoints)} pontos
                  </p>
                  <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${goalProgress ?? 0}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {goalRemaining === 0 ? "Meta atingida." : `Faltam ${formatPoints(goalRemaining ?? 0)} pontos.`}
                    {goalDueDate ? ` Data alvo: ${goalDueDate}.` : ""}
                  </p>
                  {goalNotes ? <p className="text-xs text-slate-500">{goalNotes}</p> : null}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600">Nenhuma meta definida ainda.</p>
              )}
            </div>

            <div className="w-full max-w-xl">
              <MileageGoalForm
                programId={programId}
                goalPoints={goalPoints}
                goalDueDate={goalDueDate}
                goalNotes={goalNotes}
              />
            </div>
          </div>
        </Card>
      ) : null}

      {programId && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Registrar movimentacao
          </h2>
          <MileageEntryForm programId={programId} />

              <CsvImportCard
                title="Importar movimentações CSV"
                exampleColumns={["program_name", "entry_type", "points", "occurred_at", "expires_at?", "source?", "notes?"]}
                action={importMileageCsv}
              />
        </div>
      )}

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">
          Historico de movimentacoes
        </h3>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma movimentacao registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Data</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Tipo</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Pontos</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Origem</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Vencimento</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Obs.</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Acao</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isPositive =
                    entry.entry_type === "earn" || entry.entry_type === "transfer";
                  const soonExpiry =
                    entry.expires_at && new Date(entry.expires_at) <= ninety;

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 py-2 pr-3">
                        {entry.occurred_at}
                      </td>
                      <td className="border-b border-slate-100 py-2 pr-3">
                        <Badge className={`text-xs ${ENTRY_TONE[entry.entry_type]}`}>
                          {ENTRY_LABELS[entry.entry_type]}
                        </Badge>
                      </td>
                      <td
                        className={`border-b border-slate-100 py-2 pr-3 font-semibold tabular-nums ${
                          isPositive ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {isPositive ? "+" : "−"}
                        {formatPoints(entry.points)}
                      </td>
                      <td className="border-b border-slate-100 py-2 pr-3 text-slate-600">
                        {entry.source ?? "—"}
                      </td>
                      <td
                        className={`border-b border-slate-100 py-2 pr-3 ${
                          soonExpiry ? "font-semibold text-amber-700" : "text-slate-600"
                        }`}
                      >
                        {entry.expires_at ?? "—"}
                      </td>
                      <td className="border-b border-slate-100 py-2 pr-3 text-slate-500">
                        {entry.notes ?? "—"}
                      </td>
                      <td className="border-b border-slate-100 py-2 pr-3">
                        <form action={deleteMileageEntry.bind(null, entry.id)}>
                          <Button type="submit" variant="ghost">
                            Excluir
                          </Button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
