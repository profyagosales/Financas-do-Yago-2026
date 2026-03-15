import type { SupabaseClient } from "@supabase/supabase-js";

interface CachedIcon {
  icon_url: string;
  source: string;
}

function normalizeQuery(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return normalizeQuery(value).replace(/\s+/g, "").replace(/_/g, "");
}

function candidatesFromQuery(query: string) {
  const normalized = normalizeQuery(query);
  const token = normalized.split(" ").filter(Boolean)[0] ?? "";
  const slug = slugify(query);
  const baseTerms = Array.from(new Set([slug, token].filter(Boolean)));

  const urls: string[] = [];
  for (const term of baseTerms) {
    urls.push(`https://cdn.simpleicons.org/${term}`);
    urls.push(`https://logo.clearbit.com/${term}.com`);
    urls.push(`https://www.google.com/s2/favicons?domain=${term}.com&sz=128`);
  }

  return urls;
}

async function urlSeemsReachable(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const head = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    if (head.ok) return true;
  } catch {
    // noop
  } finally {
    clearTimeout(timeout);
  }

  const secondController = new AbortController();
  const secondTimeout = setTimeout(() => secondController.abort(), 3500);

  try {
    const getReq = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: secondController.signal,
    });
    return getReq.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(secondTimeout);
  }
}

async function discoverIconUrl(query: string) {
  const urls = candidatesFromQuery(query);
  for (const url of urls) {
    const ok = await urlSeemsReachable(url);
    if (ok) return url;
  }
  return null;
}

export async function resolveAndCacheIcon(
  supabase: SupabaseClient,
  userId: string,
  query: string,
): Promise<CachedIcon | null> {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return null;

  const { data: cached } = await supabase
    .from("icon_cache")
    .select("icon_url, source")
    .eq("user_id", userId)
    .eq("normalized_query", normalizedQuery)
    .maybeSingle();

  if (cached?.icon_url) {
    return {
      icon_url: cached.icon_url,
      source: cached.source,
    };
  }

  const discovered = await discoverIconUrl(normalizedQuery);
  if (!discovered) return null;

  await supabase.from("icon_cache").upsert(
    {
      user_id: userId,
      normalized_query: normalizedQuery,
      icon_url: discovered,
      source: "auto_discovery",
      usage_count: 1,
    },
    { onConflict: "user_id,normalized_query" },
  );

  return {
    icon_url: discovered,
    source: "auto_discovery",
  };
}

export function normalizeIconQuery(value: string) {
  return normalizeQuery(value);
}
