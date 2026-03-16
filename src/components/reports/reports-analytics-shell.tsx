"use client";

import dynamic from "next/dynamic";

const ReportsAnalytics = dynamic(
  () => import("@/components/reports/reports-analytics").then((mod) => mod.ReportsAnalytics),
  { ssr: false },
);

interface Props {
  currency: string;
  locale: string;
  monthlyTrend: Array<{ month: string; income: number; expense: number; result: number }>;
  categories: Array<{ name: string; total: number }>;
  invByClass: Array<{ asset_class: string; invested: number; sold: number; income: number }>;
}

export function ReportsAnalyticsShell(props: Props) {
  return <ReportsAnalytics {...props} />;
}