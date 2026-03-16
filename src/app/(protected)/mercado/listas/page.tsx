import { deleteGroceryItem, deleteGroceryList, markGroceryItemPurchased, toggleGroceryItemFavorite } from "@/actions/grocery";
import { ModulePage } from "@/components/common/module-page";
import { GroceryItemForm } from "@/components/forms/grocery-item-form";
import { GroceryListForm } from "@/components/forms/grocery-list-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormModal } from "@/components/ui/form-modal";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ListRow = { id: string; name: string; status: string; notes: string | null };
type ItemRow = {
  id: string;
  list_id: string | null;
  raw_name: string;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  total_price: number | null;
  establishment: string | null;
  item_category: string | null;
  is_favorite: boolean;
  was_purchased: boolean;
  purchased_at: string | null;
};

async function getListsPageData() {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      prefs: { currency: "BRL", locale: "pt-BR" },
      lists: [] as ListRow[],
      items: [] as ItemRow[],
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return {
      hasEnv: true,
      prefs: { currency: "BRL", locale: "pt-BR" },
      lists: [] as ListRow[],
      items: [] as ItemRow[],
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  const [{ data: listsData }, { data: itemsData }] = await Promise.all([
    supabase
      .from("grocery_lists")
      .select("id, name, status, notes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("grocery_items")
      .select("id, list_id, raw_name, quantity, unit, unit_price, total_price, establishment, item_category, is_favorite, was_purchased, purchased_at")
      .eq("user_id", userId)
      .order("is_favorite", { ascending: false })
      .order("was_purchased", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  return {
    hasEnv: true,
    prefs,
    lists: (listsData ?? []) as ListRow[],
    items: (itemsData ?? []).map((item) => ({
      ...item,
      quantity: item.quantity === null ? null : Number(item.quantity),
      unit_price: item.unit_price === null ? null : Number(item.unit_price),
      total_price: item.total_price === null ? null : Number(item.total_price),
    })) as ItemRow[],
  };
}

export default async function MercadoListasPage() {
  const { hasEnv, prefs, lists, items } = await getListsPageData();
  const formatMoney = (value: number) => toMoney(value, prefs.locale, prefs.currency);

  const listMap = new Map(lists.map((l) => [l.id, l.name]));
  const itemsByList = items.reduce<Record<string, ItemRow[]>>((acc, item) => {
    const key = item.list_id ?? "__none";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const totalItems = items.length;
  const purchased = items.filter((i) => i.was_purchased).length;
  const toBuy = totalItems - purchased;
  const favorites = items.filter((i) => i.is_favorite);
  const costEstimate = items
    .filter((i) => !i.was_purchased && i.unit_price !== null)
    .reduce((sum, i) => sum + Number(i.unit_price), 0);

  return (
    <div className="space-y-4">
      <ModulePage
        title="Mercado > Listas"
        subtitle="Listas de compra reutilizaveis e controle de itens."
        bullets={[
          "Itens por lista",
          "Itens favoritos reutilizaveis",
          "Marcar como comprado",
          "Preco por item",
          "Historico de precos automatico",
        ]}
      />

      {!hasEnv ? (
        <Card>
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar dados reais.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Listas</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{lists.length}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total de itens</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{totalItems}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">A comprar</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{toBuy}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Favoritos</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{favorites.length}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Estimativa restante</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{formatMoney(costEstimate)}</p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Itens favoritos</h3>
        {favorites.length === 0 ? (
          <p className="text-sm text-slate-600">Marque itens recorrentes como favoritos para acesso rapido.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {favorites.map((item) => (
              <div
                key={item.id}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                <span className="font-semibold">{item.raw_name}</span>
                {item.item_category ? <span className="ml-2 text-xs text-amber-700">{item.item_category}</span> : null}
                {item.unit_price !== null ? <span className="ml-2 text-xs text-amber-700">{formatMoney(item.unit_price)}</span> : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <FormModal title="Nova lista de mercado" triggerLabel="Nova lista" size="md">
            <GroceryListForm />
          </FormModal>
          <FormModal title="Novo item de mercado" triggerLabel="Novo item" size="lg">
            <GroceryItemForm lists={lists.map((l) => ({ id: l.id, label: l.name }))} />
          </FormModal>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Minhas listas</h3>
        {lists.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma lista cadastrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 py-2 pr-3">Nome</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Status</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Itens</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Comprados</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {lists.map((list) => {
                  const listItems = itemsByList[list.id] ?? [];
                  const listPurchased = listItems.filter((i) => i.was_purchased).length;
                  return (
                    <tr key={list.id}>
                      <td className="border-b border-slate-100 py-2 pr-3 font-medium">{list.name}</td>
                      <td className="border-b border-slate-100 py-2 pr-3">{list.status}</td>
                      <td className="border-b border-slate-100 py-2 pr-3">{listItems.length}</td>
                      <td className="border-b border-slate-100 py-2 pr-3">{listPurchased}</td>
                      <td className="border-b border-slate-100 py-2 pr-3">
                        <form action={deleteGroceryList.bind(null, list.id)}>
                          <Button type="submit" variant="ghost">Excluir lista</Button>
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

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Itens ({totalItems})</h3>
        {items.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhum item cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 py-2 pr-3">Lista</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Item</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Qtd</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Preco un.</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Estabelecimento</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Status</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={item.was_purchased ? "opacity-50" : ""}>
                    <td className="border-b border-slate-100 py-2 pr-3 text-slate-500">
                      {item.list_id ? (listMap.get(item.list_id) ?? "—") : "—"}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      <span className={item.was_purchased ? "line-through" : ""}>{item.raw_name}</span>
                      {item.is_favorite ? <span className="ml-2 text-xs font-semibold text-amber-600">Favorito</span> : null}
                      {item.item_category ? (
                        <span className="ml-2 text-xs text-slate-400">{item.item_category}</span>
                      ) : null}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      {item.quantity !== null ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}` : "—"}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      {item.unit_price !== null ? formatMoney(item.unit_price) : "—"}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.establishment ?? "—"}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      {item.was_purchased ? "Comprado" : "A comprar"}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      <div className="flex gap-2">
                        <form action={toggleGroceryItemFavorite.bind(null, item.id)}>
                          <Button type="submit" variant="secondary">
                            {item.is_favorite ? "Remover favorito" : "Favoritar"}
                          </Button>
                        </form>
                        <form action={markGroceryItemPurchased.bind(null, item.id)}>
                          <Button type="submit" variant="secondary">
                            {item.was_purchased ? "Desmarcar" : "Marcar comprado"}
                          </Button>
                        </form>
                        <form action={deleteGroceryItem.bind(null, item.id)}>
                          <Button type="submit" variant="ghost">Excluir</Button>
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
