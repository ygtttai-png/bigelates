"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { lessonTypeSchema } from "@/lib/validations/lesson-type";
import type { LessonKind, LessonType } from "@/types";

interface LessonTypeDialogProps {
  open: boolean;
  onClose: () => void;
  lessonType?: LessonType | null;
}

export function LessonTypeDialog({ open, onClose, lessonType }: LessonTypeDialogProps) {
  const { createLessonType, updateLessonType } = useApp();
  const toast = useToast();
  const editing = !!lessonType;

  const [name, setName] = useState("");
  const [kind, setKind] = useState<LessonKind>("ozel");
  const [price, setPrice] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(lessonType?.name ?? "");
    setKind(lessonType?.kind ?? "ozel");
    setPrice(lessonType ? String(Number(lessonType.price)) : "");
    setErrors({});
  }, [open, lessonType]);

  const save = async () => {
    const parsed = lessonTypeSchema.safeParse({
      name,
      kind,
      price: Number(price),
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        fieldErrors[e.path[0]?.toString() ?? "form"] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      if (editing && lessonType) {
        await updateLessonType(lessonType.id, parsed.data);
        toast("Ders tipi güncellendi · yeni dersler bu ücretle eklenir", {
          tone: "green",
          icon: "check",
        });
      } else {
        await createLessonType(parsed.data);
        toast("Ders tipi eklendi", { tone: "green", icon: "check" });
      }
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Kayıt başarısız", {
        tone: "rose",
        icon: "x",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[8000] grid place-items-end bg-[rgba(30,24,16,0.42)] p-0 backdrop-blur-[3px] sm:place-items-center sm:p-5"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[92vh] w-full max-w-[460px] overflow-y-auto rounded-t-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)] sm:rounded-[var(--radius-lg)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-type-title"
      >
        <div className="sticky top-0 z-[2] flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-5 py-4">
          <h2 id="lesson-type-title" className="text-lg font-bold">
            {editing ? "Ders Tipini Düzenle" : "Yeni Ders Tipi"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Kapat">
            <Icon name="x" />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">
              Ders adı
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Yoga dersi"
              error={!!errors.name}
              autoFocus
            />
            {errors.name && <p className="mt-1 text-xs text-[var(--rose-ink)]">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">
              Katılım
            </label>
            <div className="flex gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-1">
              {(["ozel", "grup"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`flex-1 rounded-[9px] px-3 py-2 text-[13.5px] font-semibold transition-all ${
                    kind === k
                      ? "bg-[var(--surface)] text-[var(--accent-ink)] shadow-[var(--shadow-sm)]"
                      : "text-[var(--ink-2)]"
                  }`}
                  onClick={() => setKind(k)}
                >
                  {k === "ozel" ? "Tek kişilik" : "Grup"}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-[var(--ink-3)]">
              {kind === "ozel"
                ? "Derse tek öğrenci seçilir, ücret sabittir."
                : "Derse birden çok öğrenci seçilir, ücret kişi başı hesaplanır."}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">
              Ücret {kind === "grup" && <span className="font-normal text-[var(--ink-3)]">(kişi başı)</span>}
            </label>
            <Input
              type="number"
              inputMode="decimal"
              className="tnum"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              error={!!errors.price}
            />
            {errors.price && <p className="mt-1 text-xs text-[var(--rose-ink)]">{errors.price}</p>}
          </div>

          {editing && (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5 text-[13px] text-[var(--ink-2)]">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <Icon name="alert" size={15} className="text-[var(--gold)]" />
                Geçmiş dersler etkilenmez
              </div>
              Kaydedilmiş dersler kendi ücretini ve o günkü adını korur. Bu değişiklik
              yalnızca bundan sonra ekleyeceğin dersler için geçerli.
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2.5 border-t border-[var(--line)] bg-[var(--surface)] px-5 py-4">
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            <Icon name="check" /> {editing ? "Güncelle" : "Ekle"}
          </Button>
        </div>
      </div>
    </div>
  );
}
