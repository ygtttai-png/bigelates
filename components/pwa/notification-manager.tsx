"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useApp } from "@/components/providers/app-provider";
import { useLessonNotifications } from "@/hooks/use-lesson-notifications";
import {
  areNotificationsEnabled,
  setNotificationsEnabled,
} from "@/lib/notifications/lesson-notifications";

export function NotificationManager() {
  const { lessons } = useApp();
  const [dismissed, setDismissed] = React.useState(false);
  const [enabled, setEnabled] = React.useState(true);

  React.useEffect(() => {
    setEnabled(areNotificationsEnabled());
  }, []);

  const { supported, permission, enableNotifications } = useLessonNotifications({
    lessons,
    enabled,
  });

  const showPrompt =
    supported &&
    enabled &&
    permission === "default" &&
    !dismissed;

  const handleEnable = async () => {
    const result = await enableNotifications();
    if (result === "granted") {
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setNotificationsEnabled(false);
    setEnabled(false);
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
            Yarınki ders özetini ve ders başlamadan 30 dakika önce hatırlatma al.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => void handleEnable()}>
              Bildirimleri Aç
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
