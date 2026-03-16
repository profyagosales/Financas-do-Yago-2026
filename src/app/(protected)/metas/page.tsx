import { deleteGoal, setGoalStatus } from "@/actions/goals";
import { ModulePage } from "@/components/common/module-page";
import { GoalContributionForm } from "@/components/forms/goal-contribution-form";
import { GoalForm } from "@/components/forms/goal-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormModal } from "@/components/ui/form-modal";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney, toPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

type GoalRow = {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  target_date: string | null;
  category: string | null;
  priority: "low" | "medium" | "high";
  status: "active" | "paused" | "completed";
  destination_account_id: string | null;
};

type ContributionRow = {
  id: string;
  goal_id: string;
  amount: number;
  contribution_date: string;
  source_account_id: string | null;
  notes: string | null;
};

async function getGoalsPageData() {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      prefs: { currency: "BRL", locale: "pt-BR" },
      goals: [],
      accounts: [],
      contributions: [],
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

  if (!userId) {
    return {
      hasEnv: true,
      prefs: { currency: "BRL", locale: "pt-BR" },
      goals: [],
      accounts: [],
      contributions: [],
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  const [{ data: goalsData }, { data: accountsData }, { data: contributionsData }] = await Promise.all([
    supabase
      .from("financial_goals")
      .select("id, name, description, target_amount, target_date, category, priority, status, destination_account_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("bank_accounts")
      .select("id, name")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("goal_contributions")
      .select("id, goal_id, amount, contribution_date, source_account_id, notes")
      .eq("user_id", userId)
      .order("contribution_date", { ascending: false })
      .limit(100),
  ]);

  return {
    hasEnv: true,
    prefs,
    goals: (goalsData ?? []).map((goal) => ({
      ...goal,
      target_amount: Number(goal.target_amount ?? 0),
    })) as GoalRow[],
    accounts: (accountsData ?? []).map((account) => ({ id: account.id, label: account.name })),
    contributions: (contributionsData ?? []).map((item) => ({
      ...item,
      amount: Number(item.amount ?? 0),
    })) as ContributionRow[],
  };
}

function statusTone(status: GoalRow["status"]) {
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "paused") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-sky-200 bg-sky-50 text-sky-800";
}

function priorityLabel(priority: GoalRow["priority"]) {
  if (priority === "high") return "Alta prioridade";
  if (priority === "low") return "Baixa prioridade";
  return "Prioridade media";
}

export default async function MetasPage() {
  const { hasEnv, prefs, goals, accounts, contributions } = await getGoalsPageData();
  const formatMoney = (value: number) => toMoney(value, prefs.locale, prefs.currency);

  const accountMap = new Map(accounts.map((account) => [account.id, account.label]));
  const contributedByGoal = contributions.reduce<Record<string, number>>((acc, item) => {
    acc[item.goal_id] = (acc[item.goal_id] ?? 0) + item.amount;
    return acc;
  }, {});

  const goalsWithProgress = goals.map((goal) => {
    const contributed = contributedByGoal[goal.id] ?? 0;
    const progress = goal.target_amount > 0 ? Math.min(contributed / goal.target_amount, 1) : 0;

    return {
      ...goal,
      contributed,
      remaining: Math.max(goal.target_amount - contributed, 0),
      progress,
    };
  });

  const totalTarget = goalsWithProgress.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalContributed = goalsWithProgress.reduce((sum, goal) => sum + goal.contributed, 0);
  const activeGoals = goalsWithProgress.filter((goal) => goal.status === "active").length;
  const recentContributions = contributions.slice(0, 8).map((item) => {
    const goal = goals.find((entry) => entry.id === item.goal_id);
    return {
      ...item,
      goalName: goal?.name ?? "Meta removida",
      accountName: item.source_account_id ? accountMap.get(item.source_account_id) ?? "Conta removida" : "Sem conta",
    };
  });

  return (
    <div className="space-y-4">
      <ModulePage
        title="Metas e Projetos"
        subtitle="Controle de objetivo, prazo, percentual concluido e historico de aportes."
        bullets={[
          "Aportes multiplos por meta",
          "Calculo de valor restante e prazo",
          "Origem do aporte registrada",
          "Status ativa, pausada e concluida",
        ]}
      />

      {!hasEnv ? (
        <Card>
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar as metas reais.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Metas ativas</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{activeGoals}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Total planejado</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{formatMoney(totalTarget)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Ja aportado</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{formatMoney(totalContributed)}</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <FormModal title="Nova meta" triggerLabel="Criar meta" size="lg">
            <GoalForm accounts={accounts} />
          </FormModal>
          <FormModal title="Registrar aporte" triggerLabel="Novo aporte" size="lg">
            <GoalContributionForm
              goals={goalsWithProgress.filter((goal) => goal.status !== "completed").map((goal) => ({ id: goal.id, label: goal.name }))}
              accounts={accounts}
            />
          </FormModal>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card>
          <h3 className="mb-3 text-sm font-bold text-slate-700">Carteira de metas</h3>
          {goalsWithProgress.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhuma meta cadastrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {goalsWithProgress.map((goal) => (
                <div key={goal.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">{goal.name}</h4>
                        <Badge className={statusTone(goal.status)}>{goal.status}</Badge>
                        <Badge className="border-[color:var(--border)] bg-[color:var(--muted-surface)] text-[color:var(--foreground)]">{priorityLabel(goal.priority)}</Badge>
                        {goal.category ? <Badge className="border-[color:var(--border)] bg-[color:var(--muted-surface)] text-[color:var(--foreground)]">{goal.category}</Badge> : null}
                      </div>
                      {goal.description ? <p className="text-sm text-slate-600">{goal.description}</p> : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {goal.status !== "active" ? (
                        <form action={setGoalStatus.bind(null, goal.id, "active")}>
                          <Button type="submit" variant="secondary">Ativar</Button>
                        </form>
                      ) : null}
                      {goal.status === "active" ? (
                        <form action={setGoalStatus.bind(null, goal.id, "paused")}>
                          <Button type="submit" variant="secondary">Pausar</Button>
                        </form>
                      ) : null}
                      {goal.status !== "completed" ? (
                        <form action={setGoalStatus.bind(null, goal.id, "completed")}>
                          <Button type="submit">Concluir</Button>
                        </form>
                      ) : null}
                      <form action={deleteGoal.bind(null, goal.id)}>
                        <Button type="submit" variant="ghost">Excluir</Button>
                      </form>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-sky-700" style={{ width: `${goal.progress * 100}%` }} />
                    </div>
                    <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-4">
                      <span>Progresso: {toPercent(goal.progress)}</span>
                      <span>Alvo: {formatMoney(goal.target_amount)}</span>
                      <span>Aportado: {formatMoney(goal.contributed)}</span>
                      <span>Restante: {formatMoney(goal.remaining)}</span>
                    </div>
                    <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                      <span>Prazo: {goal.target_date ?? "Sem data definida"}</span>
                      <span>Conta destino: {goal.destination_account_id ? accountMap.get(goal.destination_account_id) ?? "Conta removida" : "Não definida"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-bold text-slate-700">Últimos aportes</h3>
          {recentContributions.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhum aporte registrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {recentContributions.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{item.goalName}</span>
                    <span className="font-semibold text-slate-900">{formatMoney(item.amount)}</span>
                  </div>
                  <p className="mt-1 text-slate-600">{item.contribution_date} • {item.accountName}</p>
                  {item.notes ? <p className="mt-1 text-slate-500">{item.notes}</p> : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
