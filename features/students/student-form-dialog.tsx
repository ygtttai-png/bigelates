"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { studentSchema } from "@/lib/validations/student";
import { today, ymd } from "@/utils/date";
import type { Student } from "@/types";

interface StudentFormDialogProps {
  open: boolean;
  onClose: () => void;
  student?: Student | null;
}

const DEFAULT_PACKAGE = 8;

export function StudentFormDialog({ open, onClose, student }: StudentFormDialogProps) {
  const { createStudent, updateStudent } = useApp();
  const toast = useToast();
  const editing = !!student;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<"ozel" | "grup">("ozel");
  const [packageTotal, setPackageTotal] = useState(DEFAULT_PACKAGE);
  const [remaining, setRemaining] = useState(DEFAULT_PACKAGE);
  const [paymentStatus, setPaymentStatus] = useState<"odendi" | "bekliyor">("odendi");
  const [joinDate, setJoinDate] = useState(ymd(today()));
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (student) {
      setName(student.name);
      setPhone(student.phone);
      setType(student.type);
      setPackageTotal(student.package_total);
      setRemaining(student.remaining);
      setPaymentStatus(student.payment_status);
      setJoinDate(student.join_date);
      setNotes(student.notes ?? "");
    } else {
      setName("");
      setPhone("");
      setType("ozel");
      setPackageTotal(DEFAULT_PACKAGE);
      setRemaining(DEFAULT_PACKAGE);
      setPaymentStatus("odendi");
      setJoinDate(ymd(today()));
      setNotes("");
    }
    setErrors({});
  }, [open, student]);

  const handlePackageChange = (value: number) => {
    const next = Math.max(1, value);
    setPackageTotal(next);
    if (!editing) setRemaining(next);
  };

  const save = async () => {
    const payload = {
      name,
      phone,
      type,
      packageTotal,
      remaining,
      paymentStatus,
      joinDate,
      notes: notes || null,
    };

    const parsed = studentSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        const key = e.path[0]?.toString() ?? "form";
        fieldErrors[key] = e.message;
      });
      setErrors(fieldErrors);
      toast("Lütfen eksik alanları kontrol edin", { tone: "rose", icon: "x" });
      return;
    }

    setSaving(true);
    try {
      if (editing && student) {
        await updateStudent(student.id, parsed.data);
        toast("Öğrenci güncellendi", { tone: "green", icon: "check" });
      } else {
        await createStudent(parsed.data);
        toast("Öğrenci eklendi", { tone: "green", icon: "check" });
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
        className="max-h-[92vh] w-full max-w-[540px] overflow-y-auto rounded-t-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)] sm:rounded-[var(--radius-lg)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-form-title"
      >
        <div className="sticky top-0 z-[2] flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-5 py-4">
          <h2 id="student-form-title" className="text-lg font-bold">
            {editing ? "Öğrenciyi Düzenle" : "Yeni Öğrenci"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Kapat">
            <Icon name="x" />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          <Field label="Ad Soyad" error={errors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Öğrenci adı" error={!!errors.name} />
          </Field>

          <Field label="Telefon" error={errors.phone}>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
              error={!!errors.phone}
            />
          </Field>

          <Field label="Ders tipi">
            <div className="flex gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-1">
              {(["ozel", "grup"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`flex-1 rounded-[9px] px-3 py-2 text-[13.5px] font-semibold transition-all ${
                    type === t
                      ? "bg-[var(--surface)] text-[var(--accent-ink)] shadow-[var(--shadow-sm)]"
                      : "text-[var(--ink-2)]"
                  }`}
                  onClick={() => setType(t)}
                >
                  {t === "ozel" ? "Özel ders" : "Grup dersi"}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Paket (toplam ders)" error={errors.packageTotal}>
              <Input
                type="number"
                min={1}
                value={packageTotal}
                onChange={(e) => handlePackageChange(Number(e.target.value))}
                error={!!errors.packageTotal}
              />
            </Field>
            <Field label="Kalan ders" error={errors.remaining}>
              <Input
                type="number"
                min={0}
                max={packageTotal}
                value={remaining}
                onChange={(e) => setRemaining(Number(e.target.value))}
                error={!!errors.remaining}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Ödeme durumu">
              <select
                className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as "odendi" | "bekliyor")}
              >
                <option value="odendi">Ödendi</option>
                <option value="bekliyor">Bekliyor</option>
              </select>
            </Field>
            <Field label="Kayıt tarihi" error={errors.joinDate}>
              <Input
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                error={!!errors.joinDate}
              />
            </Field>
          </div>

          <Field label="Not (opsiyonel)">
            <textarea
              className="min-h-[78px] w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sağlık durumu, tercihler…"
            />
          </Field>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2.5 border-t border-[var(--line)] bg-[var(--surface)] px-5 py-4">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Vazgeç
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            <Icon name="check" />
            {saving ? "Kaydediliyor…" : editing ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-[var(--rose-ink)]">{error}</p>}
    </div>
  );
}
