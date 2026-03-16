"use client";

import dynamic from "next/dynamic";

const AnnualAnalytics = dynamic(
  () => import("@/components/finance/annual-analytics").then((mod) => mod.AnnualAnalytics),
  { ssr: false },
);

interface Props {
  monthly: Array<{ month: string; income: number; expense: number; result: number; count: number }>;
  currency: string;
  locale: string;
}

export function AnnualAnalyticsShell(props: Props) {
  return <AnnualAnalytics {...props} />;
}