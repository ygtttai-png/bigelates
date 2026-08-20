import type { Lesson, Student } from "@/types";

const STUDENT_COLORS = [
  "#8FA688",
  "#C9A6A0",
  "#A8A29A",
  "#9FB0AE",
  "#C4B59A",
  "#B0A4BE",
  "#A0B4C4",
  "#C9B07E",
] as const;

/** Yeni öğrenci için varsayılan paket boyutu */
export const DEFAULT_PACKAGE_BY_TYPE = {
  ozel: 8,
  grup: 12,
} as const;

export const PACKAGE_OPTIONS = {
  ozel: [4, 8, 10, 12],
  grup: [4, 8, 12, 16, 20],
} as const;

export type PackageLevel = "ok" | "last" | "empty";

export interface PackageAvailability {
  /** Pakette kalan ders — geldi/gelmedi olunca düşer */
  remaining: number;
  /** Henüz sonuçlanmamış, paketten düşecek planlı ders sayısı */
  planned: number;
  /** Yeni planlanabilecek ders sayısı: remaining - planned */
  available: number;
  level: PackageLevel;
}

/**
 * Öğrencinin paket durumu.
 * Planlı dersler henüz paketten düşmediği için, yeni ders planlarken
 * bunları da hesaba katarız — aksi halde paket dolduğu halde uyarı çıkmaz.
 */
export function packageAvailabilityByStudent(
  students: Pick<Student, "id" | "remaining">[],
  lessons: Lesson[],
  options?: { excludeLessonId?: string }
): Map<string, PackageAvailability> {
  const planned = plannedCounts(lessons, options?.excludeLessonId);
  return new Map(
    students.map((s) => [s.id, buildAvailability(s.remaining, planned.get(s.id) ?? 0)])
  );
}

function plannedCounts(lessons: Lesson[], excludeLessonId?: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const lesson of lessons) {
    if (lesson.status !== "planlandi" || lesson.id === excludeLessonId) continue;
    for (const studentId of lesson.student_ids ?? []) {
      counts.set(studentId, (counts.get(studentId) ?? 0) + 1);
    }
  }
  return counts;
}

function buildAvailability(remaining: number, planned: number): PackageAvailability {
  const available = remaining - planned;
  return {
    remaining,
    planned,
    available,
    level: available <= 0 ? "empty" : available === 1 ? "last" : "ok",
  };
}

export function studentInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function studentColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % STUDENT_COLORS.length;
  return STUDENT_COLORS[index] ?? STUDENT_COLORS[0];
}
