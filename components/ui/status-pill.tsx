import type { LessonStatus } from "@/types";
import { STATUS_META } from "@/utils/lessons";
import { Badge } from "./badge";

interface StatusPillProps {
  status: LessonStatus;
  size?: "sm" | "md";
}

export function StatusPill({ status, size = "md" }: StatusPillProps) {
  const s = STATUS_META[status] ?? STATUS_META.planlandi;
  return (
    <Badge tone={s.tone} size={size}>
      {s.label}
    </Badge>
  );
}
