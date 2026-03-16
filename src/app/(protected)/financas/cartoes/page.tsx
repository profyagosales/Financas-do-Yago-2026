import { deleteCreditCard } from "@/actions/finance";
import { ModulePage } from "@/components/common/module-page";
import { CreditCardForm } from "@/components/forms/credit-card-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormModal } from "@/components/ui/form-modal";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CardRow = {
  id: string;
  name: string;
  institution: string;
  brand: string | null;
  credit_limit: number | string | null;
  closing_day: number;
  due_day: number;
  is_active: boolean;
  used: number;
  available: number;
};

type BillRow = {
  id: string;
  credit_card_id: string;
  reference_month: string;
  closing_date: string;
  due_date: string;
  total_amount: number | string | null;
  status: string;
};

type TransactionRow = {
  id: string;
  credit_card_id: string | null;
  description: string;
  amount: number | string | null;
  competency_date: string;
  status: string;
};

type InstallmentRow = {
  transaction_id: string;
  bill_month: string;
  installment_number: number;
  total_installments: number;
  amount: number | string | null;
};

type BillPurchaseItem = {
  id: string;
  description: string;
  amount: number;
  status: string;
  installmentLabel: string | null;
};

function toMonthStart(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function daysUntil(dateIso: string) {
  const today = new Date();
  const current = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const due = new Date(`${dateIso}T00:00:00Z`);
  return Math.ceil((due.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
}

async function getCreditCardsAndBills() {
  if (!hasSupabaseEnv()) {
    return { prefs: { currency: "BRL", locale: "pt-BR" }, cards: [] as CardRow[], bills: [] as BillRow[], purchasesByBill: {} as Record<string, BillPurchaseItem[]> };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return { prefs: { currency: "BRL", locale: "pt-BR" }, cards: [] as CardRow[], bills: [] as BillRow[], purchasesByBill: {} as Record<string, BillPurchaseItem[]> };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  const [{ data: cardsData }, { data: txData }, { data: installmentsData }, { data: billsData }] = await Promise.all([
    supabase
      .from("credit_cards")
      .select("id, name, institution, brand, credit_limit, closing_day, due_day, is_active")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("id, credit_card_id, description, amount, competency_date, status")
      .eq("user_id", userId)
      .not("credit_card_id", "is", null)
      .neq("status", "canceled"),
    supabase
      .from("transaction_installments")
      .select("transaction_id, bill_month, installment_number, total_installments, amount")
      .eq("user_id", userId),
    supabase
      .from("card_bills")
      .select("id, credit_card_id, reference_month, closing_date, due_date, total_amount, status")
      .eq("user_id", userId)
      .order("reference_month", { ascending: false })
      .limit(60),
  ]);

  const usedByCard = (txData ?? []).reduce<Record<string, number>>((acc, row) => {
    const key = row.credit_card_id as string;
    acc[key] = (acc[key] ?? 0) + Number(row.amount ?? 0);
    return acc;
  }, {});

  const cards = ((cardsData ?? []) as Omit<CardRow, "used" | "available">[]).map((card) => {
    const used = usedByCard[card.id] ?? 0;
    const limit = Number(card.credit_limit ?? 0);
    return {
      ...card,
      used,
      available: Math.max(0, limit - used),
    };
  });

  const installmentsByTx = ((installmentsData ?? []) as InstallmentRow[]).reduce<Record<string, InstallmentRow[]>>((acc, item) => {
    if (!acc[item.transaction_id]) acc[item.transaction_id] = [];
    acc[item.transaction_id].push(item);
    return acc;
  }, {});

  const purchasesByBill = ((billsData ?? []) as BillRow[]).reduce<Record<string, BillPurchaseItem[]>>((acc, bill) => {
    const items: BillPurchaseItem[] = [];

    for (const tx of (txData ?? []) as TransactionRow[]) {
      if (tx.credit_card_id !== bill.credit_card_id) continue;

      const installments = installmentsByTx[tx.id] ?? [];
      if (installments.length > 0) {
        const match = installments.find((item) => toMonthStart(item.bill_month) === bill.reference_month);
        if (!match) continue;
        items.push({
          id: `${tx.id}-${match.installment_number}`,
          description: tx.description,
          amount: Number(match.amount ?? 0),
          status: tx.status,
          installmentLabel: `${match.installment_number}/${match.total_installments}`,
        });
        continue;
      }

      if (toMonthStart(tx.competency_date) !== bill.reference_month) continue;
      items.push({
        id: tx.id,
        description: tx.description,
        amount: Number(tx.amount ?? 0),
        status: tx.status,
        installmentLabel: null,
      });
    }

    acc[bill.id] = items.sort((a, b) => b.amount - a.amount);
    return acc;
  }, {});

  return {
    prefs,
    cards,
    bills: (billsData ?? []) as BillRow[],
    purchasesByBill,
  };
}

export default async function CartoesPage() {
  const { prefs, cards, bills, purchasesByBill } = await getCreditCardsAndBills();
  const formatMoney = (value: number) => toMoney(value, prefs.locale, prefs.currency);

  return (
    <div className="space-y-4">
      <ModulePage
        title="Finanças > Cartões"
        subtitle="Limite, faturas, vencimento e compras parceladas."
        bullets={[
          "Múltiplos cartões",
          "Alerta de vencimento",
          "Parcelas por competência/fatura",
          "Limite disponível calculado",
        ]}
      />

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Cadastro de cartões</h3>
            <p className="text-xs text-slate-500">Abra o formulário em modal para manter foco na análise de faturas.</p>
          </div>
          <FormModal title="Novo cartão" triggerLabel="Novo cartão" size="md">
            <CreditCardForm />
          </FormModal>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Cartões cadastrados</h3>
        {!hasSupabaseEnv() ? (
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar dados reais.
          </p>
        ) : cards.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhum cartão cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 py-2 pr-3">Cartão</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Instituição</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Bandeira</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Limite total</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Utilizado</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Disponível</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Fechamento/Venc.</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card.id}>
                    <td className="border-b border-slate-100 py-2 pr-3">{card.name}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{card.institution}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{card.brand ?? "-"}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{formatMoney(Number(card.credit_limit))}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{formatMoney(Number(card.used))}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{formatMoney(Number(card.available))}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{card.closing_day}/{card.due_day}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <FormModal title={`Editar: ${card.name}`} triggerLabel="Editar" size="md">
                          <CreditCardForm
                            initialData={{
                              id: card.id,
                              name: card.name,
                              institution: card.institution,
                              brand: card.brand,
                              credit_limit: Number(card.credit_limit),
                              closing_day: card.closing_day,
                              due_day: card.due_day,
                            }}
                          />
                        </FormModal>
                        <form action={deleteCreditCard.bind(null, card.id)}>
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

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Faturas (consolidadas)</h3>
        {!hasSupabaseEnv() ? (
          <p className="text-sm text-slate-600">Conecte ao Supabase para visualizar faturas.</p>
        ) : bills.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma fatura consolidada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 py-2 pr-3">Referência</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Cartão</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Fechamento</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Vencimento</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Status</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="border-b border-slate-100 py-2 pr-3">{bill.reference_month}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{cards.find((card) => card.id === bill.credit_card_id)?.name ?? "-"}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{bill.closing_date}</td>
                    <td className={`border-b border-slate-100 py-2 pr-3 ${daysUntil(bill.due_date) <= 7 && bill.status !== "paid" ? "font-semibold text-amber-700" : ""}`}>
                      {bill.due_date}
                      {bill.status !== "paid" ? <span className="ml-2 text-xs text-slate-500">({daysUntil(bill.due_date)}d)</span> : null}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3">{bill.status}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{formatMoney(Number(bill.total_amount ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Compras por fatura</h3>
        {!hasSupabaseEnv() ? (
          <p className="text-sm text-slate-600">Conecte ao Supabase para visualizar o detalhamento.</p>
        ) : bills.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma fatura consolidada ainda.</p>
        ) : (
          <div className="space-y-4">
            {bills.slice(0, 12).map((bill) => {
              const items = purchasesByBill[bill.id] ?? [];
              const cardName = cards.find((card) => card.id === bill.credit_card_id)?.name ?? "-";
              return (
                <div key={`${bill.id}-details`} className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{cardName} • {bill.reference_month}</p>
                      <p className="text-xs text-slate-500">Fechamento {bill.closing_date} • Vencimento {bill.due_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatMoney(Number(bill.total_amount ?? 0))}</p>
                      <p className="text-xs text-slate-500">{items.length} compra{items.length === 1 ? "" : "s"}</p>
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-sm text-slate-600">Nenhuma compra individual encontrada para essa fatura.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr>
                            <th className="border-b border-slate-200 py-2 pr-3">Descrição</th>
                            <th className="border-b border-slate-200 py-2 pr-3">Parcela</th>
                            <th className="border-b border-slate-200 py-2 pr-3">Status</th>
                            <th className="border-b border-slate-200 py-2 pr-3">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.id}>
                              <td className="border-b border-slate-100 py-2 pr-3">{item.description}</td>
                              <td className="border-b border-slate-100 py-2 pr-3">{item.installmentLabel ?? "À vista"}</td>
                              <td className="border-b border-slate-100 py-2 pr-3">{item.status}</td>
                              <td className="border-b border-slate-100 py-2 pr-3 font-medium">{formatMoney(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
