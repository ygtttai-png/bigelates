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
