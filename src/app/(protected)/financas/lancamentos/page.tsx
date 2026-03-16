import { ModulePage } from "@/components/common/module-page";
import { InstitutionAvatar } from "@/components/common/institution-avatar";
import { TransactionForm } from "@/components/forms/transaction-form";
import { deleteTransaction, importTransactionsCsv, setTransactionStatus, uploadTransactionAttachment } from "@/actions/finance";
import { createTag, deleteTag, getUserTags, toggleTransactionTag } from "@/actions/tags";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormModal } from "@/components/ui/form-modal";
import { findIconByText, getIconsByDomains } from "@/lib/icon-registry";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Tag = { id: string; name: string; color: string | null };

type TransactionRow = {
  id: string;
  competency_date: string;
  description: string;
  type: string;
  amount: number | string | null;
  status: string;
  icon_key: string | null;
  icon_url: string | null;
  inferred_icon_key?: string | null;
  tags?: Tag[];
  attachments?: Array<{
    id: string;
    signed_url: string | null;
    attachment_kind: string | null;
    file_name: string;
  }>;
};

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
  if (!hasSupabaseEnv()) {
    return { prefs: { currency: "BRL", locale: "pt-BR" }, transactions: [] as TransactionRow[] };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return { prefs: { currency: "BRL", locale: "pt-BR" }, transactions: [] as TransactionRow[] };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  const { data } = await supabase
    .from("transactions")
    .select("id, competency_date, description, type, amount, status, icon_key, icon_url")
    .eq("user_id", userId)
    .order("competency_date", { ascending: false })
    .limit(100);

  const transactions = (data ?? []) as TransactionRow[];
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
  if (ids.length === 0) {
    return {
      prefs,
      transactions: withInferred.map((item) => ({ ...item, attachments: [], tags: [] })),
    };
  }

  const [{ data: attachmentsData }, { data: transactionTagsData }] = await Promise.all([
    supabase
      .from("attachments")
      .select("id, related_id, file_name, file_path, attachment_kind, created_at")
      .eq("user_id", userId)
      .eq("related_type", "transaction")
      .in("related_id", ids)
      .order("created_at", { ascending: false }),
    supabase
      .from("transaction_tags")
      .select("transaction_id, tags(id, name, color)")
      .in("transaction_id", ids),
  ]);

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

  type TxTagRow = { transaction_id: string; tags: Tag | Tag[] | null };
  const tagsByTransaction = (transactionTagsData as TxTagRow[] ?? []).reduce<Record<string, Tag[]>>((acc, row) => {
    if (!acc[row.transaction_id]) acc[row.transaction_id] = [];
    const tagData = row.tags;
    if (tagData && !Array.isArray(tagData)) acc[row.transaction_id].push(tagData);
    return acc;
  }, {});

  return {
    prefs,
    transactions: withInferred.map((item) => ({
      ...item,
      attachments: byTransaction[item.id] ?? [],
      tags: tagsByTransaction[item.id] ?? [],
    })),
  };
}

export default async function LancamentosPage() {
  const { prefs, transactions } = await getTransactions();
  const options = await getFormOptions();
  const userTags = await getUserTags();
  const formatMoney = (value: number) => toMoney(value, prefs.locale, prefs.currency);

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
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Novo lancamento</h3>
            <p className="text-xs text-slate-500">Formulario aberto em modal para manter a listagem sempre visivel.</p>
          </div>
          <FormModal title="Novo lancamento" triggerLabel="Adicionar lancamento" size="xl">
            <TransactionForm categories={options.categories} accounts={options.accounts} cards={options.cards} icons={options.icons} tags={userTags} />
          </FormModal>
        </div>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-bold text-slate-700">Importacao por CSV</h3>
        <p className="mb-3 text-xs text-slate-600">
          Colunas obrigatorias: competency_date, description, type, amount. Colunas opcionais: category, account, destination_account, credit_card, status, payment_date, notes.
        </p>
        <form action={importTransactionsCsv} className="flex flex-wrap items-center gap-2">
          <input type="file" name="file" accept=".csv,text/csv" required className="block w-full max-w-[360px] text-sm" />
          <Button type="submit" variant="secondary">Importar CSV</Button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Tipos aceitos: income/expense/transfer/adjustment (ou receita/despesa/transferencia/ajuste). Status aceitos: pending/paid/canceled.
        </p>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Gerenciar tags</h3>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {userTags.map((tag) => (
            <span
              key={tag.id}
              style={tag.color ? { backgroundColor: tag.color + "22", borderColor: tag.color, color: tag.color } : undefined}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {tag.name}
              <form action={deleteTag.bind(null, tag.id)} className="inline">
                <button type="submit" className="text-slate-400 hover:text-red-500" title="Excluir tag">×</button>
              </form>
            </span>
          ))}
          {userTags.length === 0 && <p className="text-xs text-slate-500 italic">Nenhuma tag criada.</p>}
        </div>
        <form action={createTag} className="flex items-center gap-2">
          <input
            type="text"
            name="name"
            placeholder="Nome da tag"
            required
            maxLength={40}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm w-52"
          />
          <input
            type="color"
            name="color"
            defaultValue="#6366f1"
            title="Cor da tag"
            className="h-9 w-10 cursor-pointer rounded border border-slate-300 p-0.5"
          />
          <Button type="submit" variant="secondary">Criar tag</Button>
        </form>
      </Card>

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
                  <th className="border-b border-slate-200 py-2 pr-3">Tags</th>
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
                    <td className="border-b border-slate-100 py-2 pr-3">{formatMoney(Number(tx.amount ?? 0))}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      <div className="flex flex-wrap gap-1 min-w-[120px]">
                        {(tx.tags ?? []).map((tag) => (
                          <span
                            key={tag.id}
                            style={tag.color ? { backgroundColor: tag.color + "22", borderColor: tag.color, color: tag.color } : undefined}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600"
                          >
                            {tag.name}
                            <form action={toggleTransactionTag} className="inline">
                              <input type="hidden" name="transaction_id" value={tx.id} />
                              <input type="hidden" name="tag_id" value={tag.id} />
                              <input type="hidden" name="action" value="remove" />
                              <button type="submit" className="ml-0.5 text-slate-400 hover:text-red-500" title="Remover tag">×</button>
                            </form>
                          </span>
                        ))}
                        {userTags.filter((t) => !(tx.tags ?? []).some((tt) => tt.id === t.id)).slice(0, 5).map((tag) => (
                          <form key={tag.id} action={toggleTransactionTag} className="inline">
                            <input type="hidden" name="transaction_id" value={tx.id} />
                            <input type="hidden" name="tag_id" value={tag.id} />
                            <input type="hidden" name="action" value="add" />
                            <button
                              type="submit"
                              style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                              className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-400 hover:text-slate-600"
                              title={`Adicionar tag ${tag.name}`}
                            >
                              + {tag.name}
                            </button>
                          </form>
                        ))}
                      </div>
                    </td>
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
                        {(tx.attachments ?? []).length > 0 ? (
                          <ul className="space-y-1 text-xs text-slate-600">
                            {(tx.attachments ?? []).map((att: { id: string; signed_url: string | null; attachment_kind: string | null; file_name: string }) => (
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
