import { ModulePage } from "@/components/common/module-page";
import { InstitutionAvatar } from "@/components/common/institution-avatar";
import { TransactionForm } from "@/components/forms/transaction-form";
import { deleteTransaction, setTransactionStatus, uploadTransactionAttachment } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { findIconByText, getIconsByDomains } from "@/lib/icon-registry";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getFormOptions() {
  if (!hasSupabaseEnv()) {
    return { categories: [], accounts: [], cards: [], icons: [] };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return { categories: [], accounts: [], cards: [], icons: [] };
  }

  const [{ data: categoriesData }, { data: accountsData }, { data: cardsData }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("bank_accounts")
      .select("id, name")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("credit_cards")
      .select("id, name")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  return {
    categories: (categoriesData ?? []).map((item) => ({ id: item.id, label: item.name })),
    accounts: (accountsData ?? []).map((item) => ({ id: item.id, label: item.name })),
    cards: (cardsData ?? []).map((item) => ({ id: item.id, label: item.name })),
    icons: getIconsByDomains(["expense", "subscription", "saas", "market", "transport", "utility", "telecom", "insurance", "ecommerce", "mileage", "airline", "crypto", "broker", "wallet"]).map((item) => ({
      id: item.id,
      label: `${item.name} (${item.domain})`,
    })),
  };
}

async function getTransactions() {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return [];

  const { data } = await supabase
    .from("transactions")
    .select("id, competency_date, description, type, amount, status, icon_key, icon_url")
    .eq("user_id", userId)
    .order("competency_date", { ascending: false })
    .limit(100);

  const transactions = data ?? [];
  const withInferred = transactions.map((item) => {
    const inferred = findIconByText(item.description, [
      "expense",
      "subscription",
      "saas",
      "market",
      "transport",
      "utility",
      "telecom",
      "insurance",
      "ecommerce",
      "mileage",
      "airline",
      "crypto",
      "broker",
      "wallet",
    ]);

    return {
      ...item,
      inferred_icon_key: inferred?.id ?? null,
    };
  });

  const ids = withInferred.map((item) => item.id);
  if (ids.length === 0) return withInferred.map((item) => ({ ...item, attachments: [] }));

  const { data: attachmentsData } = await supabase
    .from("attachments")
    .select("id, related_id, file_name, file_path, attachment_kind, created_at")
    .eq("user_id", userId)
    .eq("related_type", "transaction")
    .in("related_id", ids)
    .order("created_at", { ascending: false });

  const attachmentsWithUrl = await Promise.all(
    (attachmentsData ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage.from("attachments").createSignedUrl(row.file_path, 60 * 60);
      return {
        ...row,
        signed_url: signed?.signedUrl ?? null,
      };
    }),
  );

  const byTransaction = attachmentsWithUrl.reduce<Record<string, typeof attachmentsWithUrl>>((acc, item) => {
    if (!acc[item.related_id]) {
      acc[item.related_id] = [];
    }
    acc[item.related_id].push(item);
    return acc;
  }, {});

  return withInferred.map((item) => ({
    ...item,
    attachments: byTransaction[item.id] ?? [],
  }));
}

export default async function LancamentosPage() {
  const transactions = await getTransactions();
  const options = await getFormOptions();

  return (
    <div className="space-y-4">
      <ModulePage
        title="Financas > Lancamentos"
        subtitle="CRUD completo de receitas, despesas, transferencias e ajustes."
        bullets={[
          "Transferencia sem contaminar resultado mensal",
          "Parcelamentos automativos por grupo",
          "Tags e anexos por lancamento",
          "Filtros por conta, cartao, categoria e tipo",
        ]}
      />
      <TransactionForm categories={options.categories} accounts={options.accounts} cards={options.cards} icons={options.icons} />
      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Tabela de lancamentos</h3>
        {!hasSupabaseEnv() ? (
          <p className="text-sm text-slate-600">Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar dados reais.</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhum lancamento encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 py-2 pr-3">Data</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Descricao</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Tipo</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Status</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Valor</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Anexos</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="border-b border-slate-100 py-2 pr-3">{tx.competency_date}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <InstitutionAvatar iconId={tx.icon_key ?? tx.inferred_icon_key} iconUrl={tx.icon_url} institutionName={tx.description} size={24} />
                        <span>{tx.description}</span>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3">{tx.type}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{tx.status}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{toMoney(Number(tx.amount ?? 0))}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      <div className="space-y-2">
                        <form action={uploadTransactionAttachment} className="flex items-center gap-2">
                          <input type="hidden" name="transaction_id" value={tx.id} />
                          <input type="hidden" name="attachment_kind" value="bill" />
                          <input type="file" name="file" required className="block w-full max-w-[250px] text-xs" />
                          <Button type="submit" variant="secondary">Upload boleto</Button>
                        </form>
                        <form action={uploadTransactionAttachment} className="flex items-center gap-2">
                          <input type="hidden" name="transaction_id" value={tx.id} />
                          <input type="hidden" name="attachment_kind" value="receipt" />
                          <input type="file" name="file" required className="block w-full max-w-[250px] text-xs" />
                          <Button type="submit" variant="secondary">Upload comprovante</Button>
                        </form>
                        {tx.attachments.length > 0 ? (
                          <ul className="space-y-1 text-xs text-slate-600">
                            {tx.attachments.map((att) => (
                              <li key={att.id}>
                                {att.signed_url ? (
                                  <a href={att.signed_url} target="_blank" rel="noreferrer" className="text-sky-700 underline">
                                    {att.attachment_kind === "bill" ? "[Boleto]" : att.attachment_kind === "receipt" ? "[Comprovante]" : "[Arquivo]"} {att.file_name}
                                  </a>
                                ) : (
                                  <span>{att.file_name}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      <div className="flex flex-wrap gap-2">
                        {tx.status !== "paid" ? (
                          <form action={setTransactionStatus.bind(null, tx.id, "paid")}>
                            <Button type="submit">Marcar pago</Button>
                          </form>
                        ) : (
                          <form action={setTransactionStatus.bind(null, tx.id, "pending")}>
                            <Button type="submit" variant="secondary">Voltar pendente</Button>
                          </form>
                        )}
                        <form action={deleteTransaction.bind(null, tx.id)}>
                          <Button type="submit" variant="secondary">Excluir</Button>
                        </form>
                      </div>
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
