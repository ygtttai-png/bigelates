"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NotificationsService, DEFAULT_PREFS } from "@/services/notifications.service";
import {
  getExistingSubscription,
  isPushSupported,
  needsHomeScreenInstall,
  resetServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  VAPID_PUBLIC_KEY,
} from "@/lib/notifications/push";
import type { NotificationDelivery, NotificationPrefs, PushSubscriptionRow } from "@/types";

interface UsePushNotificationsOptions {
  userId: string | null;
  studioId: string | null;
}

export interface PushPrefsInput {
  enabled: boolean;
  reminder_minutes: number;
  summary_hour: number;
  timezone: string;
}

export function usePushNotifications({ userId, studioId }: UsePushNotificationsOptions) {
  const [supported, setSupported] = useState(false);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribedHere, setSubscribedHere] = useState(false);
  const [devices, setDevices] = useState<PushSubscriptionRow[]>([]);
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
  const [prefs, setPrefs] = useState<PushPrefsInput>({ ...DEFAULT_PREFS });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const configured = VAPID_PUBLIC_KEY.length > 0;

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const service = new NotificationsService(createClient());
      const [saved, savedPrefs, recent, current] = await Promise.all([
        service.getSubscriptions(userId),
        service.getPrefs(userId),
        service.getRecentDeliveries(userId),
        getExistingSubscription(),
      ]);

      setDevices(saved);
      setDeliveries(recent);
      if (savedPrefs) {
        setPrefs({
          enabled: savedPrefs.enabled,
          reminder_minutes: savedPrefs.reminder_minutes,
          summary_hour: savedPrefs.summary_hour,
          timezone: savedPrefs.timezone,
        });
      }
      // Bu cihaz hem tarayıcıda hem veritabanında kayıtlı mı
      setSubscribedHere(!!current && saved.some((d) => d.endpoint === current.endpoint));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setSupported(isPushSupported());
    setNeedsInstall(needsHomeScreenInstall());
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!userId) throw new Error("Önce giriş yapmalısın");
    setBusy(true);
    try {
      const keys = await subscribeToPush();
      const service = new NotificationsService(createClient());
      await service.saveSubscription(userId, studioId, keys);
      if (typeof Notification !== "undefined") setPermission(Notification.permission);
      await refresh();
      return keys;
    } finally {
      setBusy(false);
    }
  }, [userId, studioId, refresh]);

  /** Bozuk kurulumu temizleyip bildirimleri baştan açar */
  const resetAndEnable = useCallback(async () => {
    if (!userId) throw new Error("Önce giriş yapmalısın");
    setBusy(true);
    try {
      const ok = await resetServiceWorker();
      if (!ok) {
        throw new Error(
          "Service worker sıfırlandı ama hazır olmadı. Sayfayı kapatıp yeniden aç."
        );
      }
      const keys = await subscribeToPush();
      const service = new NotificationsService(createClient());
      await service.saveSubscription(userId, studioId, keys);
      if (typeof Notification !== "undefined") setPermission(Notification.permission);
      await refresh();
      return keys;
    } finally {
      setBusy(false);
    }
  }, [userId, studioId, refresh]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const endpoint = await unsubscribeFromPush();
      const service = new NotificationsService(createClient());
      if (endpoint) await service.removeSubscription(endpoint);
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const removeDevice = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        const service = new NotificationsService(createClient());
        await service.removeSubscriptionById(id);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const savePrefs = useCallback(
    async (next: PushPrefsInput) => {
      if (!userId) throw new Error("Önce giriş yapmalısın");
      setBusy(true);
      try {
        const service = new NotificationsService(createClient());
        const saved = await service.savePrefs(userId, next);
        setPrefs({
          enabled: saved.enabled,
          reminder_minutes: saved.reminder_minutes,
          summary_hour: saved.summary_hour,
          timezone: saved.timezone,
        });
      } finally {
        setBusy(false);
      }
    },
    [userId]
  );

  const sendTest = useCallback(async () => {
    setBusy(true);
    try {
      const service = new NotificationsService(createClient());
      const delivered = await service.sendTestPush();
      await refresh();
      return delivered;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  return {
    supported,
    configured,
    needsInstall,
    permission,
    subscribedHere,
    devices,
    deliveries,
    prefs,
    loading,
    busy,
    enable,
    resetAndEnable,
    disable,
    removeDevice,
    savePrefs,
    sendTest,
    refresh,
  };
}
