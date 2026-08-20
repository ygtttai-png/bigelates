"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const DISMISS_KEY = "bigelates:push-prompt-dismissed";

/**
 * Bu cihaz henüz push bildirimlerine kayıtlı değilse kısa bir davet gösterir.
 * Kayıt sunucuya yazıldığı için uygulama kapalıyken de bildirim düşer.
 */
export function NotificationManager() {
  const { profile } = useApp();
  const toast = useToast();
  const [dismissed, setDismissed] = React.useState(true);

  const push = usePushNotifications({
    userId: profile?.id ?? null,
    studioId: profile?.studio_id ?? null,
  });

  React.useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  // Tarayıcı aboneliği yenilerse kaydı sessizce tazele
  const enable = push.enable;
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "PUSH_SUBSCRIPTION_CHANGED") return;
      if (Notification.permission === "granted") void enable().catch(() => {});
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [enable]);

  const canEnableHere =
    push.supported &&
    push.configured &&
    !push.needsInstall &&
    push.permission !== "denied" &&
    !push.subscribedHere;

  const showPrompt = !push.loading && !dismissed && !!profile && canEnableHere;

  const handleEnable = async () => {
    try {
      await push.enable();
      toast("Bildirimler açıldı", { tone: "green", icon: "check" });
      setDismissed(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Bildirimler açılamadı", {
        tone: "rose",
        icon: "x",
      });
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-4 right-4 z-[190] mx-auto max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-lg)] lg:bottom-6 lg:left-6 lg:right-auto">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-ink)]">
          <Icon name="bell" size={18} />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Ders bildirimleri</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">
            Uygulama kapalıyken bile telefonuna düşsün: ders başlamadan önce hatırlatma ve akşam
            yarının ders özeti.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void handleEnable()} disabled={push.busy}>
              Bildirimleri Aç
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/notifications">Ayarlar</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Şimdi değil
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
