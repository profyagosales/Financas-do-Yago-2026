import { ModulePage } from "@/components/common/module-page";
import { AccountReconciliationForm } from "@/components/forms/account-reconciliation-form";
import { BankAccountForm } from "@/components/forms/bank-account-form";
import { InstitutionAvatar } from "@/components/common/institution-avatar";
import { deleteBankAccount } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormModal } from "@/components/ui/form-modal";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AccountRow = {
  id: string;
  name: string;
  institution: string;
  account_type: string;
  icon_key: string | null;
  initial_balance: number | string | null;
  reconciled_balance: number | string | null;
  reconciled_at: string | null;
  reconciliation_notes: string | null;
  current_balance: number;
  reconciliation_diff: number | null;
  is_active: boolean;
};

type PaidTransactionRow = {
  type: string;
  amount: number | string | null;
  account_id: string | null;
  destination_account_id: string | null;
};

async function getAccounts() {
  if (!hasSupabaseEnv()) {
    return { prefs: { currency: "BRL", locale: "pt-BR" }, accounts: [] as AccountRow[] };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return { prefs: { currency: "BRL", locale: "pt-BR" }, accounts: [] as AccountRow[] };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  const [{ data }, { data: transactionsData }] = await Promise.all([
    supabase
      .from("bank_accounts")
      .select("id, name, institution, account_type, icon_key, initial_balance, reconciled_balance, reconciled_at, reconciliation_notes, is_active")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("type, amount, account_id, destination_account_id")
      .eq("user_id", userId)
      .eq("status", "paid"),
  ]);

  const currentBalanceByAccount = new Map<string, number>();
  for (const tx of (transactionsData ?? []) as PaidTransactionRow[]) {
    const amount = Number(tx.amount ?? 0);
    if (tx.type === "income" || tx.type === "adjustment") {
      if (tx.account_id) currentBalanceByAccount.set(tx.account_id, (currentBalanceByAccount.get(tx.account_id) ?? 0) + amount);
      continue;
    }

    if (tx.type === "expense") {
      if (tx.account_id) currentBalanceByAccount.set(tx.account_id, (currentBalanceByAccount.get(tx.account_id) ?? 0) - amount);
      continue;
    }

    if (tx.type === "transfer") {
      if (tx.account_id) currentBalanceByAccount.set(tx.account_id, (currentBalanceByAccount.get(tx.account_id) ?? 0) - amount);
      if (tx.destination_account_id) currentBalanceByAccount.set(tx.destination_account_id, (currentBalanceByAccount.get(tx.destination_account_id) ?? 0) + amount);
    }
  }

  return {
    prefs,
    accounts: ((data ?? []) as AccountRow[]).map((account) => {
      const currentBalance = Number(account.initial_balance ?? 0) + (currentBalanceByAccount.get(account.id) ?? 0);
      const reconciledBalance = account.reconciled_balance === null ? null : Number(account.reconciled_balance);
      return {
        ...account,
        current_balance: currentBalance,
        reconciliation_diff: reconciledBalance === null ? null : reconciledBalance - currentBalance,
      };
    }),
  };
}

export default async function ContasPage() {
  const { prefs, accounts } = await getAccounts();
  const formatMoney = (value: number) => toMoney(value, prefs.locale, prefs.currency);

  return (
    <div className="space-y-4">
      <ModulePage
        title="Financas > Contas"
        subtitle="Cadastro de bancos, carteiras e contas de investimento."
        bullets={[
          "Saldo inicial e saldo atual calculado",
          "Tipos de conta obrigatorios",
          "Contas inativas fora dos formularios por padrao",
          "Conciliação manual com divergencia por conta",
        ]}
      />
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Cadastro de contas</h3>
            <p className="text-xs text-slate-500">Crie contas sem ocupar espaço fixo da tela principal.</p>
          </div>
          <FormModal title="Nova conta" triggerLabel="Nova conta" size="md">
            <BankAccountForm />
          </FormModal>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Contas cadastradas</h3>
        {!hasSupabaseEnv() ? (
          <p className="text-sm text-slate-600">Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar dados reais.</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma conta cadastrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 py-2 pr-3">Nome</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Instituicao</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Tipo</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Saldo inicial</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Saldo atual</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Ultima conciliacao</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Divergencia</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Status</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <InstitutionAvatar institutionId={account.icon_key} institutionName={account.institution} />
                        <span>{account.name}</span>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3">{account.institution}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{account.account_type}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{formatMoney(Number(account.initial_balance ?? 0))}</td>
                    <td className="border-b border-slate-100 py-2 pr-3 font-medium">{formatMoney(account.current_balance)}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      {account.reconciled_at ? (
                        <div>
                          <p>{account.reconciled_at}</p>
                          <p className="text-xs text-slate-500">{formatMoney(Number(account.reconciled_balance ?? 0))}</p>
                        </div>
                      ) : "—"}
                    </td>
                    <td className={`border-b border-slate-100 py-2 pr-3 font-medium ${
                      account.reconciliation_diff === null
                        ? "text-slate-400"
                        : Math.abs(account.reconciliation_diff) < 0.01
                          ? "text-emerald-700"
                          : "text-amber-700"
                    }`}>
                      {account.reconciliation_diff === null ? "—" : formatMoney(account.reconciliation_diff)}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3">{account.is_active ? "Ativa" : "Inativa"}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      <form action={deleteBankAccount.bind(null, account.id)}>
                        <Button type="submit" variant="secondary">Excluir</Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Conciliacao manual</h3>
        {accounts.length === 0 ? (
          <p className="text-sm text-slate-600">Cadastre uma conta para registrar conciliacoes.</p>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={`${account.id}-reconciliation`} className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-slate-900">{account.name}</p>
                  <p className="text-xs text-slate-500">Saldo atual realizado: {formatMoney(account.current_balance)}</p>
                  {account.reconciliation_diff !== null ? (
                    <p className={`text-xs ${Math.abs(account.reconciliation_diff) < 0.01 ? "text-emerald-700" : "text-amber-700"}`}>
                      {Math.abs(account.reconciliation_diff) < 0.01 ? "Conta conciliada" : `Divergencia atual: ${formatMoney(account.reconciliation_diff)}`}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">Nenhuma conciliacao registrada ainda.</p>
                  )}
                </div>

                <FormModal title={`Conciliar conta: ${account.name}`} triggerLabel="Conciliar conta" size="md">
                  <AccountReconciliationForm
                    accountId={account.id}
                    reconciledBalance={account.reconciled_balance === null ? null : Number(account.reconciled_balance)}
                    reconciledAt={account.reconciled_at}
                    reconciliationNotes={account.reconciliation_notes}
                  />
                </FormModal>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
