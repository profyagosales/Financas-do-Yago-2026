"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type ReminderItem = {
  id: string;
  title: string;
  body: string;
  dueDate: string;
  severity: "high" | "medium";
};

interface Props {
  reminders: ReminderItem[];
}

const STORAGE_KEY = "financeiro-reminders-last-day";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function canUseNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function LocalReminders({ reminders }: Props) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    canUseNotifications() ? Notification.permission : "unsupported",
  );

  const sorted = useMemo(
    () => [...reminders].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [reminders],
  );

  const dueTodayOrOverdue = sorted.filter((item) => item.severity === "high");

  const sendNotifications = useCallback(async () => {
    if (!canUseNotifications() || Notification.permission !== "granted") return;

    const critical = sorted.slice(0, 3);
    for (const item of critical) {
      new Notification(item.title, {
        body: item.body,
        tag: `financeiro-${item.id}`,
      });
    }

    localStorage.setItem(STORAGE_KEY, todayKey());
  }, [sorted]);

  const enableNotifications = async () => {
    if (!canUseNotifications()) return;
    const next = await Notification.requestPermission();
    setPermission(next);
    if (next === "granted") {
      await sendNotifications();
    }
  };

  useEffect(() => {
    if (!canUseNotifications()) return;
    if (Notification.permission !== "granted") return;
    if (sorted.length === 0) return;

    const lastSentDay = localStorage.getItem(STORAGE_KEY);
    if (lastSentDay === todayKey()) return;

    void sendNotifications();
  }, [sendNotifications, sorted]);

  if (sorted.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-700">Lembretes locais</h3>
          <p className="text-xs text-slate-500">Vencimentos e pendencias para os proximos dias.</p>
        </div>
        <div className="flex items-center gap-2">
          {permission === "granted" ? (
            <Button type="button" variant="secondary" onClick={() => void sendNotifications()}>
              Notificar agora
            </Button>
          ) : permission === "unsupported" ? (
            <span className="text-xs text-slate-500">Notificacao não suportada neste navegador</span>
          ) : (
            <Button type="button" variant="secondary" onClick={() => void enableNotifications()}>
              Ativar notificacoes
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {sorted.slice(0, 8).map((item) => (
          <div key={item.id} className="flex items-start justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <div>
              <p className="font-semibold text-slate-900">{item.title}</p>
              <p className="text-slate-600">{item.body}</p>
            </div>
            <span
              className={
                "rounded-md px-2 py-1 text-xs font-semibold " +
                (item.severity === "high"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-amber-100 text-amber-800")
              }
            >
              {item.severity === "high" ? "Hoje/Atrasado" : "Proximo"}
            </span>
          </div>
        ))}
      </div>

      {dueTodayOrOverdue.length > 0 ? (
        <p className="mt-3 text-xs text-rose-700">Voce tem {dueTodayOrOverdue.length} lembretes criticos para hoje ou em atraso.</p>
      ) : null}
    </Card>
  );
}
