"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import type { LessonDeleteScope } from "@/lib/validations/lesson";
import { cn } from "@/lib/utils";

interface LessonDeleteButtonProps {
  lessonId: string;
  scope?: LessonDeleteScope;
  redirectTo?: string;
  onDeleted?: () => void;
  className?: string;
  size?: "sm" | "icon";
  label?: string;
}

export function LessonDeleteButton({
  lessonId,
  scope = "single",
  redirectTo,
  onDeleted,
  className,
  size = "icon",
  label,
}: LessonDeleteButtonProps) {
  const { deleteLesson } = useApp();
  const toast = useToast();
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const message =
      scope === "future"
        ? "Bu ders ve sonraki tekrarlar silinsin mi?"
        : "Bu ders silinsin mi?";

    if (!window.confirm(message)) return;

    try {
      await deleteLesson(lessonId, scope);
      toast(
        scope === "future" ? "Tekrarlayan dersler silindi" : "Ders silindi",
        { tone: "rose", icon: "trash" }
      );
      onDeleted?.();
      if (redirectTo) router.push(redirectTo);
    } catch {
      toast("Silme başarısız", { tone: "rose", icon: "x" });
    }
  };

  if (size === "sm") {
    return (
      <Button
        type="button"
        variant={scope === "future" ? "outline" : "danger"}
        size="sm"
        className={className}
        onClick={(e) => void handleDelete(e)}
      >
        <Icon name={scope === "future" ? "repeat" : "trash"} />
        {label ?? "Sil"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("h-[34px] w-[34px] text-[var(--rose-ink)]", className)}
      title="Dersi sil"
      onClick={(e) => void handleDelete(e)}
    >
      <Icon name="trash" size={16} />
    </Button>
  );
}
