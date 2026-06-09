import type { Lesson } from "@/types";
import { addDays, parseYmd, today, ymd } from "@/utils/date";

const STORAGE_PREFIX = "bigelates:notif:";
export const NOTIFICATIONS_ENABLED_KEY = "bigelates:notifications:enabled";

/** Yarın özeti bu saatte gönderilir (yerel saat) */
export const TOMORROW_SUMMARY_HOUR = 20;
const REMINDER_MINUTES = 30;
const POLL_MS = 30_000;

function storageKey(suffix: string): string {
  return `${STORAGE_PREFIX}${suffix}`;
}

function wasSent(key: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(storageKey(key)) === "1";
}

function markSent(key: string): void {
  localStorage.setItem(storageKey(key), "1");
}

export function areNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== "0";
}

export function setNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? "1" : "0");
}

export function lessonStartAt(lesson: Lesson): Date {
  const [h, m] = lesson.time.split(":").map((v) => parseInt(v, 10));
  const d = parseYmd(lesson.date);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function formatTomorrowBody(ozel: number, grup: number): string {
  const total = ozel + grup;
  const parts: string[] = [];
  if (ozel > 0) parts.push(`${ozel} özel ders`);
  if (grup > 0) parts.push(`${grup} grup dersi`);
  return `Yarın ${total} dersin var: ${parts.join(", ")}.`;
}

function formatReminderBody(lesson: Lesson): string {
  const typeLabel = lesson.type === "ozel" ? "Özel ders" : "Grup dersi";
  return `${formatTime(lesson.time)} — ${typeLabel}. Hazırlan!`;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export async function showAppNotification(
  title: string,
  body: string,
  url = "/dashboard"
): Promise<void> {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;

  const options: NotificationOptions = {
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: `bigelates-${Date.now()}`,
    data: { url },
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return;
      }
    }
  } catch {
    // fallback below
  }

  new Notification(title, options);
}

function getTomorrowLessons(lessons: Lesson[]): Lesson[] {
  const tomorrow = ymd(addDays(today(), 1));
  return lessons.filter((l) => l.date === tomorrow && l.status === "planlandi");
}

function getUpcomingReminders(lessons: Lesson[]): Lesson[] {
  const now = Date.now();
  const windowMs = POLL_MS + 5_000;

  return lessons.filter((l) => {
    if (l.status !== "planlandi") return false;
    const start = lessonStartAt(l).getTime();
    const remindAt = start - REMINDER_MINUTES * 60_000;
    return now >= remindAt && now < remindAt + windowMs;
  });
}

async function maybeSendTomorrowSummary(lessons: Lesson[]): Promise<void> {
  const now = new Date();
  const hour = now.getHours();
  if (hour !== TOMORROW_SUMMARY_HOUR) return;

  const dedupKey = `tomorrow:${ymd(now)}`;
  if (wasSent(dedupKey)) return;

  const tomorrowLessons = getTomorrowLessons(lessons);
  if (tomorrowLessons.length === 0) return;

  const ozel = tomorrowLessons.filter((l) => l.type === "ozel").length;
  const grup = tomorrowLessons.filter((l) => l.type === "grup").length;

  await showAppNotification(
    "Yarınki derslerin",
    formatTomorrowBody(ozel, grup),
    "/calendar/weekly"
  );
  markSent(dedupKey);
}

async function maybeSendReminders(lessons: Lesson[]): Promise<void> {
  const due = getUpcomingReminders(lessons);

  for (const lesson of due) {
    const dedupKey = `reminder:${lesson.id}`;
    if (wasSent(dedupKey)) continue;

    await showAppNotification(
      "Dersin başlamak üzere",
      formatReminderBody(lesson),
      `/lessons/${lesson.id}/edit`
    );
    markSent(dedupKey);
  }
}

export async function runLessonNotificationChecks(lessons: Lesson[]): Promise<void> {
  if (!areNotificationsEnabled()) return;
  if (typeof window === "undefined" || Notification.permission !== "granted") return;

  await maybeSendTomorrowSummary(lessons);
  await maybeSendReminders(lessons);
}

export const LESSON_NOTIFICATION_POLL_MS = POLL_MS;
