export interface DisplayPrefs {
  currency: string;
  locale: string;
}

const DEFAULT_PREFS: DisplayPrefs = {
  currency: "BRL",
  locale: "pt-BR",
};

interface SupabaseLike {
  from: (table: string) => any;
}

export async function getDisplayPrefsForUser(supabase: SupabaseLike, userId?: string): Promise<DisplayPrefs> {
  if (!userId) return DEFAULT_PREFS;

  const { data } = await supabase
    .from("profiles")
    .select("currency, locale")
    .eq("id", userId)
    .maybeSingle();

  return {
    currency: data?.currency ?? DEFAULT_PREFS.currency,
    locale: data?.locale ?? DEFAULT_PREFS.locale,
  };
}
