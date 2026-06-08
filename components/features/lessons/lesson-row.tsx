"use client";

import Link from "next/link";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StatusPill } from "@/components/ui/status-pill";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { fmtMoney } from "@/utils/currency";
import type { Lesson } from "@/types";
import { cn } from "@/lib/utils";

interface LessonRowProps {
  lesson: Lesson;
  compact?: boolean;
}

export function LessonRow({ lesson, compact }: LessonRowProps) {
  const { studentById, setLessonStatus } = useApp();
  const toast = useToast();

  const students = (lesson.student_ids ?? [])
    .map((id) => studentById(id))
    .filter(Boolean);
  const names = students.map((s) => s!.name);
  const title =
    lesson.type === "grup"
      ? `Grup dersi · ${names.length} kişi`
      : names[0] ?? "—";
  const sub =
    lesson.type === "grup"
      ? names.join(", ")
      : students[0]?.phone ?? "";

  const mark = async (e: React.MouseEvent, status: "geldi" | "gelmedi") => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await setLessonStatus(lesson.id, status);
      toast(
        status === "geldi"
          ? "Ders tamamlandı · Geldi olarak işaretlendi"
          : "Gelmedi olarak işaretlendi",
        { tone: status === "geldi" ? "green" : "rose", icon: status === "geldi" ? "check" : "x" }
      );
    } catch {
      toast("Durum güncellenemedi", { tone: "rose", icon: "x" });
    }
  };

  return (
    <Link
      href={`/lessons/${lesson.id}/edit`}
      className={cn(
        "relative flex items-center gap-3.5 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 transition-all hover:-translate-y-px hover:shadow-[var(--shadow)]",
        lesson.status === "geldi" && "opacity-[0.96]",
        lesson.status === "iptal" && "opacity-60",
        lesson.type === "ozel" && "before:absolute before:bottom-3 before:left-0 before:top-3 before:w-[3.5px] before:rounded before:bg-[var(--sage)]",
        lesson.type === "grup" && "before:absolute before:bottom-3 before:left-0 before:top-3 before:w-[3.5px] before:rounded before:bg-[var(--plum)]"
      )}
    >
      <div className="tnum min-w-[46px] text-sm font-bold">{lesson.time.slice(0, 5)}</div>
      {lesson.type === "grup" ? (
        <AvatarStack students={students as NonNullable<typeof students[number]>[]} size={34} />
      ) : (
        <Avatar
          student={
            students[0] ?? { initials: "?", color: "#999" }
          }
          size={38}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[14.5px] font-semibold",
              lesson.status === "iptal" && "line-through decoration-[var(--ink-3)]"
            )}
          >
            {title}
          </span>
          <span
            className={cn(
              "rounded-[7px] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
              lesson.type === "ozel"
                ? "bg-[var(--sage-soft)] text-[var(--sage-ink)]"
                : "bg-[var(--plum-soft)] text-[var(--plum-ink)]"
            )}
          >
            {lesson.type === "ozel" ? "Özel" : "Grup"}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[12.5px] text-[var(--ink-2)]">{sub}</div>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="tnum text-sm font-bold">{fmtMoney(Number(lesson.fee))}</span>
        {lesson.status === "planlandi" && !compact ? (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-[34px] w-[34px] text-[var(--green-ink)]"
              title="Geldi"
              onClick={(e) => void mark(e, "geldi")}
            >
              <Icon name="check" size={17} stroke={2.2} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-[34px] w-[34px] text-[var(--rose-ink)]"
              title="Gelmedi"
              onClick={(e) => void mark(e, "gelmedi")}
            >
              <Icon name="x" size={17} stroke={2.2} />
            </Button>
          </div>
        ) : (
          <StatusPill status={lesson.status} size="sm" />
        )}
      </div>
    </Link>
  );
}
