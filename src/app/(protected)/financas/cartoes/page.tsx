import { deleteCreditCard } from "@/actions/finance";
import { ModulePage } from "@/components/common/module-page";
import { CreditCardForm } from "@/components/forms/credit-card-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getCreditCardsAndBills() {
  if (!hasSupabaseEnv()) {
    return { cards: [], bills: [] };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return { cards: [], bills: [] };
  }

  const [{ data: cardsData }, { data: txData }, { data: billsData }] = await Promise.all([
    supabase
      .from("credit_cards")
      .select("id, name, institution, brand, credit_limit, closing_day, due_day, is_active")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("credit_card_id, amount, status")
      .eq("user_id", userId)
      .not("credit_card_id", "is", null)
      .neq("status", "canceled"),
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

  const cards = (cardsData ?? []).map((card) => {
    const used = usedByCard[card.id] ?? 0;
    const limit = Number(card.credit_limit ?? 0);
    return {
      ...card,
      used,
      available: Math.max(0, limit - used),
    };
  });

  return {
    cards,
    bills: billsData ?? [],
  };
}

export default async function CartoesPage() {
  const { cards, bills } = await getCreditCardsAndBills();

  return (
    <div className="space-y-4">
      <ModulePage
        title="Financas > Cartoes"
        subtitle="Limite, faturas, vencimento e compras parceladas."
        bullets={[
          "Multiplos cartoes",
          "Alerta de vencimento",
          "Parcelas por competencia/fatura",
          "Limite disponivel calculado",
        ]}
      />

      <CreditCardForm />

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Cartoes cadastrados</h3>
        {!hasSupabaseEnv() ? (
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar dados reais.
          </p>
        ) : cards.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhum cartao cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 py-2 pr-3">Cartao</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Instituicao</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Bandeira</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Limite total</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Utilizado</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Disponivel</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Fechamento/Venc.</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card.id}>
                    <td className="border-b border-slate-100 py-2 pr-3">{card.name}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{card.institution}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{card.brand ?? "-"}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{toMoney(Number(card.credit_limit))}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{toMoney(Number(card.used))}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{toMoney(Number(card.available))}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{card.closing_day}/{card.due_day}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      <form action={deleteCreditCard.bind(null, card.id)}>
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
                  <th className="border-b border-slate-200 py-2 pr-3">Referencia</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Cartao</th>
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
                    <td className="border-b border-slate-100 py-2 pr-3">{bill.due_date}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{bill.status}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{toMoney(Number(bill.total_amount ?? 0))}</td>
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
