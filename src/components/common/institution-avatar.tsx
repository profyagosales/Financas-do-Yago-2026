"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Building2, CreditCard, Droplets, Lightbulb, Wallet } from "lucide-react";
import { getIconById } from "@/lib/icon-registry";
import { getInstitutionById } from "@/lib/institutions";

interface Props {
  institutionId?: string | null;
  institutionName?: string | null;
  iconId?: string | null;
  iconUrl?: string | null;
  size?: number;
}

function pickFallbackIcon(name?: string | null) {
  const normalized = (name ?? "").toLowerCase();
  if (normalized.includes("neoenergia") || normalized.includes("luz") || normalized.includes("enel")) return "lightbulb";
  if (normalized.includes("caesb") || normalized.includes("agua")) return "droplets";
  if (normalized.includes("visa") || normalized.includes("mastercard") || normalized.includes("elo")) return "credit-card";
  if (normalized.includes("binance") || normalized.includes("wallet") || normalized.includes("carteira")) return "wallet";
  return "building";
}

export function InstitutionAvatar({ institutionId, institutionName, iconId, iconUrl, size = 32 }: Props) {
  const institution = getInstitutionById(institutionId ?? undefined);
  const genericIcon = getIconById(iconId ?? institutionId ?? undefined);
  const label = institution?.name ?? genericIcon?.name ?? institutionName ?? "Instituicao";

  const iconCandidates = useMemo(() => {
    const urls = [
      iconUrl ?? undefined,
      institution?.iconUrl,
      ...(institution?.fallbackUrls ?? []),
      genericIcon?.iconUrl,
      ...(genericIcon?.fallbackUrls ?? []),
    ].filter((item): item is string => Boolean(item));
    return Array.from(new Set(urls));
  }, [iconUrl, institution?.iconUrl, institution?.fallbackUrls, genericIcon?.iconUrl, genericIcon?.fallbackUrls]);

  const [index, setIndex] = useState(0);

  if (iconCandidates.length > 0 && index < iconCandidates.length) {
    return (
      <Image
        src={iconCandidates[index]}
        alt={label}
        className="rounded-lg border border-slate-200 bg-white p-1"
        width={size}
        height={size}
        onError={() => {
          setIndex((prev) => prev + 1);
        }}
      />
    );
  }

  if (genericIcon?.emoji) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50"
        style={{ width: size, height: size }}
        title={label}
      >
        <span style={{ fontSize: Math.max(14, Math.floor(size * 0.52)) }}>{genericIcon.emoji}</span>
      </span>
    );
  }

  const fallbackIcon = pickFallbackIcon(label);
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600"
      style={{ width: size, height: size }}
    >
      {fallbackIcon === "lightbulb" ? <Lightbulb size={16} /> : null}
      {fallbackIcon === "droplets" ? <Droplets size={16} /> : null}
      {fallbackIcon === "credit-card" ? <CreditCard size={16} /> : null}
      {fallbackIcon === "wallet" ? <Wallet size={16} /> : null}
      {fallbackIcon === "building" ? <Building2 size={16} /> : null}
    </span>
  );
}
