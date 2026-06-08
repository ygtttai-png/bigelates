import type { Lesson, LessonStatus } from "@/types";
import { isSameDay, parseYmd, today, ymd } from "./date";

export const STATUS_META: Record<
  LessonStatus,
  { key: LessonStatus; label: string; tone: "sage" | "green" | "rose" | "muted" }
> = {
  planlandi: { key: "planlandi", label: "Planlandı", tone: "sage" },
  geldi: { key: "geldi", label: "Geldi", tone: "green" },
  gelmedi: { key: "gelmedi", label: "Gelmedi", tone: "rose" },
  iptal: { key: "iptal", label: "İptal", tone: "muted" },
};

export const PAY_LABEL: Record<"odendi" | "bekliyor", string> = {
  odendi: "Ödendi",
  bekliyor: "Bekliyor",
};

export function lessonsOn(lessons: Lesson[], date: Date): Lesson[] {
  const s = ymd(date);
  return lessons
    .filter((l) => l.date === s)
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function lessonsInRange(lessons: Lesson[], start: Date, end: Date): Lesson[] {
  const a = ymd(start);
  const b = ymd(end);
  return lessons.filter((l) => l.date >= a && l.date <= b);
}

export function earnedFee(l: Lesson): number {
  return l.status === "geldi" ? l.fee : 0;
}

export function expectedFee(l: Lesson): number {
  return l.status === "geldi" || l.status === "planlandi" ? l.fee : 0;
}

export function resolveLessonStatus(
  dateStr: string,
  time: string,
  status: LessonStatus
): LessonStatus {
  const date = parseYmd(dateStr);
  const now = today();
  if (status !== "planlandi") return status;
  if (date < now && !isSameDay(date, now)) return status;
  if (isSameDay(date, now)) {
    const hour = parseInt(time.split(":")[0] ?? "0", 10);
    return hour < 12 ? "geldi" : "planlandi";
  }
  return status;
}

export const TIME_OPTIONS: string[] = (() => {
  const options: string[] = [];
  for (let h = 7; h <= 21; h++) {
    options.push(`${String(h).padStart(2, "0")}:00`);
    options.push(`${String(h).padStart(2, "0")}:30`);
  }
  return options;
})();
