import { ModulePage } from "@/components/common/module-page";
import { BankAccountForm } from "@/components/forms/bank-account-form";
import { InstitutionAvatar } from "@/components/common/institution-avatar";
import { deleteBankAccount } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  is_active: boolean;
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

  const { data } = await supabase
    .from("bank_accounts")
    .select("id, name, institution, account_type, icon_key, initial_balance, is_active")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { prefs, accounts: (data ?? []) as AccountRow[] };
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
          "Historico e observacoes por conta",
        ]}
      />
      <BankAccountForm />

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
    </div>
  );
}
