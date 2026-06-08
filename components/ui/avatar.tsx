import type { Student } from "@/types";
import { cn } from "@/lib/utils";

interface AvatarProps {
  student: Pick<Student, "initials" | "color">;
  size?: number;
  ring?: boolean;
  className?: string;
}

export function Avatar({ student, size = 38, ring, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold tracking-tight",
        ring && "shadow-[0_0_0_2px_var(--surface)]",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `${student.color}26`,
        color: student.color,
        fontSize: size * 0.36,
      }}
    >
      {student.initials}
    </span>
  );
}

interface AvatarStackProps {
  students: Pick<Student, "id" | "initials" | "color">[];
  max?: number;
  size?: number;
}

export function AvatarStack({ students, max = 3, size = 30 }: AvatarStackProps) {
  const shown = students.slice(0, max);
  const extra = students.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((s, i) => (
        <span key={s.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.32, zIndex: 10 - i }}>
          <Avatar student={s} size={size} ring />
        </span>
      ))}
      {extra > 0 && (
        <span style={{ marginLeft: -size * 0.32, zIndex: 1 }}>
          <span
            className="grid place-items-center rounded-full bg-[var(--surface-3)] font-bold text-[var(--ink-2)] shadow-[0_0_0_2px_var(--surface)]"
            style={{ width: size, height: size, fontSize: size * 0.34 }}
          >
            +{extra}
          </span>
        </span>
      )}
    </div>
  );
}
