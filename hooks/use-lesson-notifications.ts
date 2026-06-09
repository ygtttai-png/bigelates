"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lesson } from "@/types";
import {
  LESSON_NOTIFICATION_POLL_MS,
  requestNotificationPermission,
  runLessonNotificationChecks,
  setNotificationsEnabled,
} from "@/lib/notifications/lesson-notifications";

interface UseLessonNotificationsOptions {
  lessons: Lesson[];
  enabled?: boolean;
}

export function useLessonNotifications({ lessons, enabled = true }: UseLessonNotificationsOptions) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "Notification" in window);
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const enableNotifications = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      setNotificationsEnabled(true);
      await runLessonNotificationChecks(lessons);
    }
    return result;
  }, [lessons]);

  useEffect(() => {
    if (!enabled || !supported || permission !== "granted") return;

    void runLessonNotificationChecks(lessons);

    const id = window.setInterval(() => {
      void runLessonNotificationChecks(lessons);
    }, LESSON_NOTIFICATION_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void runLessonNotificationChecks(lessons);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, supported, permission, lessons]);

  return {
    supported,
    permission,
    enableNotifications,
  };
}
