import { deleteWishlistItem, setWishlistItemStatus } from "@/actions/wishlist";
import { ModulePage } from "@/components/common/module-page";
import { WishlistItemEditForm } from "@/components/forms/wishlist-item-edit-form";
import { WishlistItemForm } from "@/components/forms/wishlist-item-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

type WishlistItemRow = {
  id: string;
  name: string;
  category: string | null;
  url: string | null;
  image_url: string | null;
  current_price: number | null;
  target_price: number | null;
  priority: "low" | "medium" | "high";
  store_name: string | null;
  status: "active" | "bought" | "paused" | "discarded";
  notes: string | null;
};

async function getWishlistItems() {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      prefs: { currency: "BRL", locale: "pt-BR" },
      items: [] as WishlistItemRow[],
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return {
      hasEnv: true,
      prefs: { currency: "BRL", locale: "pt-BR" },
      items: [] as WishlistItemRow[],
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  const { data } = await supabase
    .from("wishlist_items")
    .select("id, name, category, url, image_url, current_price, target_price, priority, store_name, status, notes")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return {
    hasEnv: true,
    prefs,
    items: (data ?? []).map((item) => ({
      ...item,
      current_price: item.current_price === null ? null : Number(item.current_price),
      target_price: item.target_price === null ? null : Number(item.target_price),
    })) as WishlistItemRow[],
  };
}

function priorityLabel(priority: WishlistItemRow["priority"]) {
  if (priority === "high") return "Alta prioridade";
  if (priority === "low") return "Baixa prioridade";
  return "Prioridade media";
}

function statusLabel(status: WishlistItemRow["status"]) {
  if (status === "bought") return "Comprado";
  if (status === "paused") return "Pausado";
  if (status === "discarded") return "Descartado";
  return "Ativo";
}

function statusTone(status: WishlistItemRow["status"]) {
  if (status === "bought") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "paused") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "discarded") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-sky-200 bg-sky-50 text-sky-800";
}

export default async function ListaDesejoPage() {
  const { hasEnv, prefs, items } = await getWishlistItems();
  const formatMoney = (value: number) => toMoney(value, prefs.locale, prefs.currency);

  const activeItems = items.filter((item) => item.status === "active");
  const trackedValue = activeItems.reduce((sum, item) => sum + Number(item.current_price ?? 0), 0);
  const targetValue = activeItems.reduce((sum, item) => sum + Number(item.target_price ?? 0), 0);
  const opportunities = activeItems.filter((item) => {
    if (item.current_price === null || item.target_price === null) return false;
    return item.current_price <= item.target_price;
  }).length;

  return (
    <div className="space-y-4">
      <ModulePage
        title="Lista de Desejo"
        subtitle="Acompanhamento de itens desejados e oportunidades de compra."
        bullets={[
          "Preco atual e preco alvo",
          "Prioridade",
          "Status ativo/comprado/pausado/descartado",
          "Links e imagens",
        ]}
      />

      {!hasEnv ? (
        <Card>
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar os itens reais.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Itens ativos</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{activeItems.length}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Valor monitorado</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{formatMoney(trackedValue)}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Oportunidades no alvo</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{opportunities}</p>
        </Card>
      </div>

      <WishlistItemForm />

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Itens rastreados</h3>
        {!hasSupabaseEnv() ? (
          <p className="text-sm text-slate-600">Conecte ao Supabase para visualizar sua lista real.</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhum item cadastrado ainda.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const dealReady = item.current_price !== null && item.target_price !== null && item.current_price <= item.target_price;
              const priceGap = item.current_price !== null && item.target_price !== null ? item.current_price - item.target_price : null;

              return (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">{item.name}</h4>
                        <Badge className={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                        <Badge className="border-slate-200 bg-white text-slate-700">{priorityLabel(item.priority)}</Badge>
                        {item.category ? <Badge className="border-slate-200 bg-white text-slate-700">{item.category}</Badge> : null}
                        {dealReady ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Preco no alvo</Badge> : null}
                      </div>
                      <div className="grid gap-1 text-sm text-slate-600">
                        <span>Loja: {item.store_name ?? "Nao informada"}</span>
                        <span>Preco atual: {item.current_price !== null ? formatMoney(item.current_price) : "Nao informado"}</span>
                        <span>Preco desejado: {item.target_price !== null ? formatMoney(item.target_price) : "Nao informado"}</span>
                        {priceGap !== null ? (
                          <span>{priceGap <= 0 ? `Abaixo do alvo em ${formatMoney(Math.abs(priceGap))}` : `Faltam ${formatMoney(priceGap)} para atingir o alvo`}</span>
                        ) : null}
                      </div>
                      {item.notes ? <p className="text-sm text-slate-500">{item.notes}</p> : null}
                      <div className="flex flex-wrap gap-3 text-sm">
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noreferrer" className="text-sky-700 underline">
                            Abrir produto
                          </a>
                        ) : null}
                        {item.image_url ? (
                          <a href={item.image_url} target="_blank" rel="noreferrer" className="text-sky-700 underline">
                            Abrir imagem
                          </a>
                        ) : null}
                      </div>

                      {item.image_url ? (
                        <a href={item.image_url} target="_blank" rel="noreferrer" className="block w-fit">
                          <img
                            src={item.image_url}
                            alt={`Imagem de ${item.name}`}
                            className="h-24 w-24 rounded-xl border border-slate-200 object-cover"
                            loading="lazy"
                          />
                        </a>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.status !== "active" ? (
                        <form action={setWishlistItemStatus.bind(null, item.id, "active")}>
                          <Button type="submit" variant="secondary">Ativar</Button>
                        </form>
                      ) : null}
                      {item.status !== "paused" ? (
                        <form action={setWishlistItemStatus.bind(null, item.id, "paused")}>
                          <Button type="submit" variant="secondary">Pausar</Button>
                        </form>
                      ) : null}
                      {item.status !== "bought" ? (
                        <form action={setWishlistItemStatus.bind(null, item.id, "bought")}>
                          <Button type="submit">Marcar comprado</Button>
                        </form>
                      ) : null}
                      {item.status !== "discarded" ? (
                        <form action={setWishlistItemStatus.bind(null, item.id, "discarded")}>
                          <Button type="submit" variant="ghost">Descartar</Button>
                        </form>
                      ) : null}
                      <form action={deleteWishlistItem.bind(null, item.id)}>
                        <Button type="submit" variant="ghost">Excluir</Button>
                      </form>
                    </div>
                  </div>

                  <div className="mt-3">
                    <WishlistItemEditForm
                      id={item.id}
                      initialValues={{
                        name: item.name,
                        category: item.category ?? "",
                        url: item.url ?? "",
                        image_url: item.image_url ?? "",
                        current_price: item.current_price ?? undefined,
                        target_price: item.target_price ?? undefined,
                        priority: item.priority,
                        store_name: item.store_name ?? "",
                        status: item.status,
                        notes: item.notes ?? "",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {hasEnv && activeItems.length > 0 ? (
        <Card>
          <h3 className="mb-3 text-sm font-bold text-slate-700">Resumo financeiro da lista</h3>
          <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-600">
            <div className="rounded-xl bg-slate-50 px-3 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Valor atual agregado</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{formatMoney(trackedValue)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Valor alvo agregado</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{formatMoney(targetValue)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Economia potencial ate o alvo</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{formatMoney(Math.max(trackedValue - targetValue, 0))}</p>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
