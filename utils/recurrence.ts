import { addMonths, addWeeks } from "date-fns";
import { parseYmd, ymd } from "./date";

export type LessonRecurrence = "none" | "weekly" | "monthly";

export const RECURRENCE_LABELS: Record<LessonRecurrence, string> = {
  none: "Tek seferlik",
  weekly: "Her hafta",
  monthly: "Her ay",
};

/** Kaç tekrar oluşturulacak (ilk ders dahil) */
export const RECURRENCE_COUNTS: Record<Exclude<LessonRecurrence, "none">, number> = {
  weekly: 12,
  monthly: 6,
};

export function generateRecurringDates(
  startDate: string,
  recurrence: Exclude<LessonRecurrence, "none">,
  count = RECURRENCE_COUNTS[recurrence]
): string[] {
  const dates: string[] = [startDate];
  let current = parseYmd(startDate);

  for (let i = 1; i < count; i++) {
    current = recurrence === "weekly" ? addWeeks(current, 1) : addMonths(current, 1);
    dates.push(ymd(current));
  }

  return dates;
}
