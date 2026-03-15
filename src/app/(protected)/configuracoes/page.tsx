import { ModulePage } from "@/components/common/module-page";
import { AppSettingsForm } from "@/components/forms/app-settings-form";
import { ProfileSettingsForm } from "@/components/forms/profile-settings-form";
import { Card } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ExportHistoryRow = {
  id: string;
  module: string;
  export_name: string;
  format: "csv" | "json";
  mode: string | null;
  row_count: number;
  created_at: string;
};

async function getSettingsData() {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      profile: { full_name: "", currency: "BRL" as const, locale: "pt-BR" as const },
      settings: { theme: "system" as const, show_charts: true, email_alerts: true, weekly_digest: false },
      stats: { accounts: 0, cards: 0, categories: 0, tags: 0 },
      exports: [] as ExportHistoryRow[],
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

  if (!userId) {
    return {
      hasEnv: true,
      profile: { full_name: "", currency: "BRL" as const, locale: "pt-BR" as const },
      settings: { theme: "system" as const, show_charts: true, email_alerts: true, weekly_digest: false },
      stats: { accounts: 0, cards: 0, categories: 0, tags: 0 },
      exports: [] as ExportHistoryRow[],
    };
  }

  const [
    { data: profileData },
    { data: settingsData },
    { count: accountsCount },
    { count: cardsCount },
    { count: categoriesCount },
    { count: tagsCount },
    { data: exportsData, error: exportsError },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name, currency, locale").eq("id", userId).maybeSingle(),
    supabase
      .from("settings")
      .select("theme, dashboard_config, notification_prefs")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("bank_accounts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("credit_cards").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("tags").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("export_history")
      .select("id, module, export_name, format, mode, row_count, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const dashboardConfig = (settingsData?.dashboard_config ?? {}) as Record<string, unknown>;
  const notificationPrefs = (settingsData?.notification_prefs ?? {}) as Record<string, unknown>;

  return {
    hasEnv: true,
    profile: {
      full_name: profileData?.full_name ?? "",
      currency: (profileData?.currency as "BRL" | "USD" | "EUR") ?? "BRL",
      locale: (profileData?.locale as "pt-BR" | "en-US" | "es-ES") ?? "pt-BR",
    },
    settings: {
      theme: (settingsData?.theme as "system" | "light" | "dark") ?? "system",
      show_charts: Boolean(dashboardConfig.show_charts ?? true),
      email_alerts: Boolean(notificationPrefs.email_alerts ?? true),
      weekly_digest: Boolean(notificationPrefs.weekly_digest ?? false),
    },
    stats: {
      accounts: accountsCount ?? 0,
      cards: cardsCount ?? 0,
      categories: categoriesCount ?? 0,
      tags: tagsCount ?? 0,
    },
    exports: exportsError ? [] : ((exportsData ?? []) as ExportHistoryRow[]),
  };
}

export default async function ConfiguracoesPage() {
  const { hasEnv, profile, settings, stats, exports } = await getSettingsData();

  return (
    <div className="space-y-4">
      <ModulePage
        title="Configuracoes"
        subtitle="Preferencias visuais, perfil, categorias e exportacoes."
        bullets={[
          "Tema claro/escuro/sistema",
          "Perfil de exibicao (nome, moeda e localidade)",
          "Preferencias de dashboard e notificacoes",
          "Diagnostico rapido de cadastros",
        ]}
      />

      {!hasEnv ? (
        <Card>
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar os dados reais.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Contas cadastradas</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.accounts}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Cartoes cadastrados</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.cards}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Categorias</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.categories}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Tags</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.tags}</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Perfil</h2>
          <ProfileSettingsForm
            fullName={profile.full_name}
            currency={profile.currency}
            locale={profile.locale}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Preferencias</h2>
          <AppSettingsForm
            theme={settings.theme}
            showCharts={settings.show_charts}
            emailAlerts={settings.email_alerts}
            weeklyDigest={settings.weekly_digest}
          />
        </div>
      </div>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Historico de exportacoes</h2>
        {exports.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Nenhuma exportacao registrada ainda.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 py-2 pr-3">Data</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Modulo</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Nome</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Formato</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Modo</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Linhas</th>
                </tr>
              </thead>
              <tbody>
                {exports.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b border-slate-100 py-2 pr-3">{new Date(item.created_at).toLocaleString("pt-BR")}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.module}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.export_name}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.format.toUpperCase()}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.mode ?? "-"}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.row_count}</td>
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
