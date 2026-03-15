export type IconDomain =
  | "bank"
  | "wallet"
  | "broker"
  | "card"
  | "mileage"
  | "airline"
  | "crypto"
  | "market"
  | "utility"
  | "telecom"
  | "ecommerce"
  | "transport"
  | "insurance"
  | "subscription"
  | "saas"
  | "expense";

export interface IconEntry {
  id: string;
  name: string;
  domain: IconDomain;
  iconUrl?: string;
  fallbackUrls?: string[];
  aliases?: string[];
  emoji?: string;
  isGeneric?: boolean;
}

function clearbitUrl(domain: string) {
  return `https://logo.clearbit.com/${domain}`;
}

function withSimpleIcon(
  id: string,
  name: string,
  domain: IconDomain,
  slug?: string,
  clearbitDomains: string[] = [],
  aliases: string[] = [],
): IconEntry {
  const iconUrl = slug ? `https://cdn.simpleicons.org/${slug}` : undefined;
  const fallbackUrls = clearbitDomains.map((item) => clearbitUrl(item));
  return { id, name, domain, iconUrl, fallbackUrls, aliases };
}

function genericExpense(id: string, name: string, emoji: string, aliases: string[] = []): IconEntry {
  return { id, name, domain: "expense", emoji, aliases, isGeneric: true };
}

export const ICON_REGISTRY: IconEntry[] = [
  withSimpleIcon("bancodobrasil", "Banco do Brasil", "bank", "bancodobrasil", ["bb.com.br"], ["bb"]),
  withSimpleIcon("caixa", "Caixa", "bank", "caixa", ["caixa.gov.br"]),
  withSimpleIcon("itau", "Itau", "bank", "itau", ["itau.com.br"]),
  withSimpleIcon("bradesco", "Bradesco", "bank", "bradesco", ["bradesco.com.br"]),
  withSimpleIcon("santander", "Santander", "bank", "santander", ["santander.com.br"]),
  withSimpleIcon("nubank", "Nubank", "bank", "nubank", ["nubank.com.br"]),
  withSimpleIcon("inter", "Inter", "bank", "bancointer", ["bancointer.com.br"]),
  withSimpleIcon("c6bank", "C6 Bank", "bank", undefined, ["c6bank.com.br"]),
  withSimpleIcon("sicredi", "Sicredi", "bank", "sicredi", ["sicredi.com.br"]),
  withSimpleIcon("sicoob", "Sicoob", "bank", "sicoob", ["sicoob.com.br"]),
  withSimpleIcon("banrisul", "Banrisul", "bank", undefined, ["banrisul.com.br"]),
  withSimpleIcon("bmg", "Banco BMG", "bank", undefined, ["bancobmg.com.br"]),
  withSimpleIcon("pan", "Banco Pan", "bank", undefined, ["bancopan.com.br"]),
  withSimpleIcon("sofisa", "Sofisa", "bank", undefined, ["sofisa.com.br"]),
  withSimpleIcon("daycoval", "Daycoval", "bank", undefined, ["daycoval.com.br"]),
  withSimpleIcon("willbank", "Will Bank", "bank", undefined, ["willbank.com.br"]),
  withSimpleIcon("next", "Next", "bank", undefined, ["next.me"]),
  withSimpleIcon("original", "Banco Original", "bank", undefined, ["original.com.br"]),
  withSimpleIcon("brb", "BRB", "bank", undefined, ["novo.brb.com.br"]),

  withSimpleIcon("btg", "BTG Pactual", "broker", "btgpactual", ["btgpactual.com"]),
  withSimpleIcon("xp", "XP Investimentos", "broker", "x", ["xp.com.br"]),
  withSimpleIcon("rico", "Rico", "broker", undefined, ["rico.com.vc"]),
  withSimpleIcon("clear", "Clear", "broker", undefined, ["clear.com.br"]),
  withSimpleIcon("avenue", "Avenue", "broker", undefined, ["avenue.us"]),
  withSimpleIcon("genial", "Genial Investimentos", "broker", undefined, ["genialinvestimentos.com.br"]),
  withSimpleIcon("modalmais", "Modalmais", "broker", undefined, ["modalmais.com.br"]),
  withSimpleIcon("itauasset", "Itau Asset", "broker", undefined, ["itauassetmanagement.com.br"]),
  withSimpleIcon("bbasset", "BB Asset", "broker", undefined, ["bb.com.br"]),
  withSimpleIcon("nuinvest", "NuInvest", "broker", undefined, ["nuinvest.com.br"]),
  withSimpleIcon("interinvest", "Inter Invest", "broker", undefined, ["bancointer.com.br"]),
  withSimpleIcon("orama", "Orama", "broker", undefined, ["orama.com.br"]),

  withSimpleIcon("picpay", "PicPay", "wallet", "picpay", ["picpay.com"]),
  withSimpleIcon("mercadopago", "Mercado Pago", "wallet", "mercadopago", ["mercadopago.com.br"]),
  withSimpleIcon("paypal", "PayPal", "wallet", "paypal", ["paypal.com"]),
  withSimpleIcon("wise", "Wise", "wallet", "wise", ["wise.com"]),
  withSimpleIcon("nomad", "Nomad", "wallet", undefined, ["nomadglobal.com"]),
  withSimpleIcon("pagbank", "PagBank", "wallet", "pagbank", ["pagbank.com.br"]),
  withSimpleIcon("recargapay", "RecargaPay", "wallet", undefined, ["recargapay.com.br"]),
  withSimpleIcon("ame", "Ame Digital", "wallet", undefined, ["ame.com.br"]),
  withSimpleIcon("applepay", "Apple Pay", "wallet", "applepay", ["apple.com"]),
  withSimpleIcon("googlepay", "Google Pay", "wallet", "googlepay", ["pay.google.com"]),

  withSimpleIcon("visa", "Visa", "card", "visa", ["visa.com"]),
  withSimpleIcon("mastercard", "Mastercard", "card", "mastercard", ["mastercard.com"]),
  withSimpleIcon("elo", "Elo", "card", "elo", ["elo.com.br"]),
  withSimpleIcon("amex", "American Express", "card", "americanexpress", ["americanexpress.com"]),
  withSimpleIcon("hipercard", "Hipercard", "card", undefined, ["itau.com.br"]),

  withSimpleIcon("binance", "Binance", "crypto", "binance", ["binance.com"]),
  withSimpleIcon("coinbase", "Coinbase", "crypto", "coinbase", ["coinbase.com"]),
  withSimpleIcon("kraken", "Kraken", "crypto", "kraken", ["kraken.com"]),
  withSimpleIcon("bybit", "Bybit", "crypto", "bybit", ["bybit.com"]),
  withSimpleIcon("okx", "OKX", "crypto", "okx", ["okx.com"]),
  withSimpleIcon("metamask", "MetaMask", "crypto", "metamask", ["metamask.io"]),
  withSimpleIcon("ledger", "Ledger", "crypto", "ledger", ["ledger.com"]),
  withSimpleIcon("mercadobitcoin", "Mercado Bitcoin", "crypto", undefined, ["mercadobitcoin.com.br"]),
  withSimpleIcon("foxbit", "Foxbit", "crypto", undefined, ["foxbit.com.br"]),

  withSimpleIcon("livelo", "Livelo", "mileage", undefined, ["livelo.com.br"]),
  withSimpleIcon("latampass", "Latam Pass", "mileage", undefined, ["latampass.com"]),
  withSimpleIcon("tudoazul", "TudoAzul", "mileage", undefined, ["tudoazul.voeazul.com.br"]),
  withSimpleIcon("smiles", "Smiles", "mileage", undefined, ["smiles.com.br"]),
  withSimpleIcon("esfera", "Esfera", "mileage", undefined, ["esfera.com.vc"]),
  withSimpleIcon("dotz", "Dotz", "mileage", undefined, ["dotz.com.br"]),

  withSimpleIcon("latam", "LATAM", "airline", "latamairlines", ["latamairlines.com"]),
  withSimpleIcon("azul", "Azul", "airline", "azul", ["voeazul.com.br"]),
  withSimpleIcon("gol", "GOL", "airline", "gol", ["voegol.com.br"]),

  withSimpleIcon("neoenergia", "Neoenergia", "utility", undefined, ["neoenergia.com"]),
  withSimpleIcon("caesb", "CAESB", "utility", undefined, ["caesb.df.gov.br"]),
  withSimpleIcon("sabesp", "Sabesp", "utility", undefined, ["sabesp.com.br"]),
  withSimpleIcon("copasa", "Copasa", "utility", undefined, ["copasa.com.br"]),
  withSimpleIcon("sanepar", "Sanepar", "utility", undefined, ["sanepar.com.br"]),
  withSimpleIcon("enel", "Enel", "utility", "enel", ["enel.com.br"]),
  withSimpleIcon("equatorial", "Equatorial", "utility", undefined, ["equatorialenergia.com.br"]),
  withSimpleIcon("cemig", "Cemig", "utility", undefined, ["cemig.com.br"]),
  withSimpleIcon("cpfl", "CPFL", "utility", undefined, ["cpfl.com.br"]),
  withSimpleIcon("naturgy", "Naturgy", "utility", "naturgy", ["naturgy.com.br"]),

  withSimpleIcon("vivo", "Vivo", "telecom", "vivo", ["vivo.com.br"]),
  withSimpleIcon("claro", "Claro", "telecom", "claro", ["claro.com.br"]),
  withSimpleIcon("tim", "TIM", "telecom", "tim", ["tim.com.br"]),
  withSimpleIcon("oi", "Oi", "telecom", "oi", ["oi.com.br"]),
  withSimpleIcon("algar", "Algar", "telecom", undefined, ["algartelecom.com.br"]),

  withSimpleIcon("mercadolivre", "Mercado Livre", "ecommerce", "mercadolibre", ["mercadolivre.com.br"]),
  withSimpleIcon("amazon", "Amazon", "ecommerce", "amazon", ["amazon.com.br"]),
  withSimpleIcon("shopee", "Shopee", "ecommerce", "shopee", ["shopee.com.br"]),
  withSimpleIcon("aliexpress", "AliExpress", "ecommerce", "aliexpress", ["aliexpress.com"]),
  withSimpleIcon("magalu", "Magazine Luiza", "ecommerce", "magalu", ["magazineluiza.com.br"]),
  withSimpleIcon("americanas", "Americanas", "ecommerce", undefined, ["americanas.com.br"]),

  withSimpleIcon("carrefour", "Carrefour", "market", "carrefour", ["carrefour.com.br"]),
  withSimpleIcon("assai", "Assai", "market", undefined, ["assai.com.br"]),
  withSimpleIcon("atacadao", "Atacadao", "market", undefined, ["atacadao.com.br"]),
  withSimpleIcon("paodeacucar", "Pao de Acucar", "market", undefined, ["paodeacucar.com"]),
  withSimpleIcon("extra", "Extra", "market", undefined, ["extra.com.br"]),
  withSimpleIcon("dia", "DIA", "market", undefined, ["dia.com.br"]),
  withSimpleIcon("ifood", "iFood", "market", "ifood", ["ifood.com.br"]),
  withSimpleIcon("rappi", "Rappi", "market", "rappi", ["rappi.com.br"]),
  withSimpleIcon("ubereats", "Uber Eats", "market", "ubereats", ["ubereats.com"]),
  withSimpleIcon("drogasil", "Drogasil", "market", undefined, ["drogasil.com.br"]),
  withSimpleIcon("drogaraia", "Droga Raia", "market", undefined, ["drogaraia.com.br"]),

  withSimpleIcon("uber", "Uber", "transport", "uber", ["uber.com"]),
  withSimpleIcon("99", "99", "transport", undefined, ["99app.com"]),
  withSimpleIcon("shell", "Shell", "transport", "shell", ["shell.com.br"]),
  withSimpleIcon("ipiranga", "Ipiranga", "transport", undefined, ["ipiranga.com.br"]),
  withSimpleIcon("petrobras", "Petrobras", "transport", "petrobras", ["petrobras.com.br"]),

  withSimpleIcon("porto", "Porto", "insurance", "porto", ["porto.com.br"]),
  withSimpleIcon("tokio", "Tokio Marine", "insurance", undefined, ["tokiomarine.com.br"]),
  withSimpleIcon("sulamerica", "SulAmerica", "insurance", "sulamerica", ["sulamerica.com.br"]),
  withSimpleIcon("allianz", "Allianz", "insurance", "allianz", ["allianz.com.br"]),

  withSimpleIcon("netflix", "Netflix", "subscription", "netflix", ["netflix.com"]),
  withSimpleIcon("primevideo", "Prime Video", "subscription", "primevideo", ["primevideo.com"], ["amazonprime", "amazon prime"]),
  withSimpleIcon("disneyplus", "Disney+", "subscription", "disneyplus", ["disneyplus.com"]),
  withSimpleIcon("max", "Max", "subscription", "max", ["max.com"]),
  withSimpleIcon("globoplay", "Globoplay", "subscription", undefined, ["globoplay.globo.com"]),
  withSimpleIcon("spotify", "Spotify", "subscription", "spotify", ["spotify.com"]),
  withSimpleIcon("youtubepremium", "YouTube Premium", "subscription", "youtube", ["youtube.com"], ["youtube premium"]),
  withSimpleIcon("applemusic", "Apple Music", "subscription", "applemusic", ["music.apple.com"]),
  withSimpleIcon("deezer", "Deezer", "subscription", "deezer", ["deezer.com"]),
  withSimpleIcon("xboxgamepass", "Xbox Game Pass", "subscription", "xbox", ["xbox.com"], ["gamepass", "game pass"]),
  withSimpleIcon("playstationplus", "PlayStation Plus", "subscription", "playstation", ["playstation.com"], ["ps plus"]),
  withSimpleIcon("nintendoswitchonline", "Nintendo Switch Online", "subscription", "nintendoswitch", ["nintendo.com"]),

  withSimpleIcon("chatgpt", "ChatGPT", "saas", "openai", ["openai.com"], ["openai", "gpt"]),
  withSimpleIcon("github", "GitHub", "saas", "github", ["github.com"]),
  withSimpleIcon("notion", "Notion", "saas", "notion", ["notion.so"]),
  withSimpleIcon("slack", "Slack", "saas", "slack", ["slack.com"]),
  withSimpleIcon("dropbox", "Dropbox", "saas", "dropbox", ["dropbox.com"]),
  withSimpleIcon("googleone", "Google One", "saas", "googleone", ["one.google.com"]),
  withSimpleIcon("microsoft365", "Microsoft 365", "saas", "microsoft", ["microsoft.com"], ["office", "office365"]),
  withSimpleIcon("adobe", "Adobe", "saas", "adobe", ["adobe.com"]),
  withSimpleIcon("canva", "Canva", "saas", "canva", ["canva.com"]),
  withSimpleIcon("figma", "Figma", "saas", "figma", ["figma.com"]),

  genericExpense("rent", "Aluguel", "🏠", ["aluguel", "moradia"]),
  genericExpense("condo", "Condominio", "🏢", ["condominio"]),
  genericExpense("gym", "Academia", "💪", ["gym", "fitness", "wellhub", "gympass", "totalpass", "smartfit", "bluefit"]),
  genericExpense("water", "Conta de agua", "💧", ["agua"]),
  genericExpense("electricity", "Conta de luz", "💡", ["energia", "luz"]),
  genericExpense("internet", "Internet", "🌐", ["banda larga", "wifi"]),
  genericExpense("phone", "Telefone", "📱", ["celular"]),
  genericExpense("health", "Plano de saude", "🏥", ["saude", "unimed", "amil", "bradesco saude"]),
  genericExpense("education", "Educacao", "🎓", ["faculdade", "curso", "escola"]),
  genericExpense("daycare", "Creche", "🧸", ["bercario"]),
  genericExpense("food", "Alimentacao", "🍽️", ["restaurante", "mercado", "supermercado"]),
  genericExpense("transport", "Transporte", "🚗", ["uber", "99", "combustivel", "metro"]),
  genericExpense("fuel", "Combustivel", "⛽", ["gasolina", "etanol", "diesel"]),
  genericExpense("parking", "Estacionamento", "🅿️", ["parking"]),
  genericExpense("toll", "Pedagio", "🛣️", ["pedagio"]),
  genericExpense("insurance_expense", "Seguro", "🛡️", ["seguro"]),
  genericExpense("iptu", "IPTU", "🏘️", ["iptu"]),
  genericExpense("ipva", "IPVA", "🚘", ["ipva"]),
  genericExpense("taxes", "Impostos", "🧾", ["imposto", "tributo"]),
  genericExpense("pet", "Pets", "🐾", ["pet", "veterinario", "racao"]),
  genericExpense("travel", "Viagem", "✈️", ["hotel", "passagem", "viagem"]),
  genericExpense("home_maintenance", "Manutencao da casa", "🧰", ["reforma", "conserto"]),
  genericExpense("emergency", "Emergencias", "🚨", ["emergencia"]),
  genericExpense("charity", "Doacoes", "🤝", ["doacao"]),
  genericExpense("investment_contribution", "Aporte em investimentos", "📈", ["aporte", "investimento"]),
];

export function getIconsByDomain(domain: IconDomain) {
  return ICON_REGISTRY.filter((item) => item.domain === domain);
}

export function getIconsByDomains(domains: IconDomain[]) {
  const domainSet = new Set(domains);
  return ICON_REGISTRY.filter((item) => domainSet.has(item.domain));
}

export function getIconById(id?: string | null) {
  if (!id) return null;
  return ICON_REGISTRY.find((item) => item.id === id) ?? null;
}

export function searchIcons(query: string, domains?: IconDomain[]) {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];

  const source = domains ? getIconsByDomains(domains) : ICON_REGISTRY;
  return source.filter((item) => {
    const inName = item.name.toLowerCase().includes(normalized);
    const inId = item.id.toLowerCase().includes(normalized);
    const inAliases = (item.aliases ?? []).some((alias) => alias.toLowerCase().includes(normalized));
    return inName || inId || inAliases;
  });
}

export function findIconByText(text?: string | null, domains?: IconDomain[]) {
  const normalized = (text ?? "").toLowerCase();
  if (!normalized) return null;

  const source = domains ? getIconsByDomains(domains) : ICON_REGISTRY;

  const exactAlias = source.find((item) =>
    [item.name, item.id, ...(item.aliases ?? [])].some((word) => normalized.includes(word.toLowerCase())),
  );

  return exactAlias ?? null;
}
