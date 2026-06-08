"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);

  React.useEffect(() => {
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (ios && !window.matchMedia("(display-mode: standalone)").matches) {
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-4 right-4 z-[200] mx-auto max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-lg)] lg:bottom-6 lg:left-auto lg:right-6">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-ink)]">
          <Icon name="spark" size={18} />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Uygulamayı yükle</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">
            {isIOS && !deferredPrompt
              ? "Safari'de Paylaş → Ana Ekrana Ekle ile Bigelates'i yükleyin."
              : "Bigelates'i ana ekranınıza ekleyerek native uygulama gibi kullanın."}
          </p>
          <div className="mt-3 flex gap-2">
            {deferredPrompt && (
              <Button size="sm" onClick={() => void handleInstall()}>
                Uygulamayı Yükle
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setVisible(false)}>
              Daha sonra
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
