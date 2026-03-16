import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { OfflineQueueBanner } from "@/components/pwa/offline-queue-banner";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="mx-auto flex w-full max-w-[1560px] gap-0 px-0 lg:px-3">
        <Sidebar />
        <div className="min-h-screen min-w-0 flex-1">
          <MobileNav />
          <main className="mx-auto w-full max-w-[1240px] p-4 md:p-6 lg:px-8">{children}</main>
        </div>
      </div>
      <OfflineQueueBanner />
    </div>
  );
}
