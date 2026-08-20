import type { Lesson, LessonKind, LessonStatus } from "@/types";
import { isSameDay, parseYmd, today, ymd } from "./date";

/** Ders tipi tanımlanmamışsa kullanılan varsayılan ad */
export function defaultKindLabel(kind: LessonKind): string {
  return kind === "ozel" ? "Özel ders" : "Grup dersi";
}

/**
 * Dersin ekranda görünen tip adı.
 * Kayıt anında yazılan ada bakar — ayarlarda ders tipi sonradan
 * yeniden adlandırılsa bile geçmiş dersler eski adını korur.
 */
export function lessonTypeLabel(lesson: Pick<Lesson, "type" | "type_label">): string {
  return lesson.type_label?.trim() || defaultKindLabel(lesson.type);
}

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

/** Geldi veya gelmedi → paketten 1 ders düşer */
export function consumesPackageCredit(status: LessonStatus): boolean {
  return status === "geldi" || status === "gelmedi";
}

/**
 * Kazanç: geldi + gelmedi (gün içi iptal/no-show ücretli).
 * İptal ve planlı dersler kazanca dahil değil.
 */
export function earnedFee(l: Lesson): number {
  return consumesPackageCredit(l.status) ? l.fee : 0;
}

/** Beklenen kazanç: henüz gerçekleşmemiş planlı dersler */
export function expectedFee(l: Lesson): number {
  return l.status === "planlandi" ? l.fee : 0;
}

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
    for (const m of [0, 15, 30, 45]) {
      options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return options;
})();

export const DEFAULT_PRICE_OZEL = 750;
export const DEFAULT_PRICE_GRUP = 250;

export function newLessonPath(date: string): string {
  return `/lessons/new?date=${date}`;
}
