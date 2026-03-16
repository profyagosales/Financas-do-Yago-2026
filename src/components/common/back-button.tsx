"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button type="button" variant="ghost" onClick={() => router.back()} className="gap-2">
      <ArrowLeft size={16} />
      Voltar
    </Button>
  );
}
