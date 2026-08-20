"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { LessonDeleteButton } from "@/components/features/lessons/lesson-delete-button";
import { lessonSchema } from "@/lib/validations/lesson";
import { fmtMoney } from "@/utils/currency";
import { today, ymd } from "@/utils/date";
import { DEFAULT_PRICE_GRUP, DEFAULT_PRICE_OZEL, TIME_OPTIONS } from "@/utils/lessons";
import { packageAvailabilityByStudent, type PackageAvailability } from "@/utils/students";
import {
  RECURRENCE_COUNTS,
  RECURRENCE_LABELS,
  type LessonRecurrence,
} from "@/utils/recurrence";

interface LessonFormProps {
  lessonId?: string;
}

function packageAlertText(pkg: PackageAvailability): string {
  if (pkg.level === "last") return "paketinde son 1 ders kaldı";
  if (pkg.remaining <= 0) return "paketi bitti, yenilenmesi gerekiyor";
  return `paketindeki ${pkg.remaining} dersin tamamı planlandı`;
}

function resolveInitialDate(editingDate?: string, queryDate?: string | null): string {
  if (editingDate) return editingDate;
  if (queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate)) return queryDate;
  return ymd(today());
}

export function LessonForm({ lessonId }: LessonFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { lessons, lessonTypes, students, studio, loading, createLesson, updateLesson } = useApp();

  const editing = lessonId ? lessons.find((l) => l.id === lessonId) : null;
  const PRICE_OZEL = studio?.settings?.price_ozel ?? DEFAULT_PRICE_OZEL;
  const PRICE_GRUP = studio?.settings?.price_grup ?? DEFAULT_PRICE_GRUP;

  /**
   * Seçilebilir tipler: aktif olanlar + düzenlenen dersin (pasife alınmış olabilir)
   * kendi tipi. Böylece eski bir dersi açtığında tipi kaybolmaz.
   */
  const selectableTypes = lessonTypes.filter(
    (t) => !t.archived_at || t.id === editing?.lesson_type_id
  );

  const [date, setDate] = useState(() =>
    resolveInitialDate(editing?.date, searchParams.get("date"))
  );
  const [time, setTime] = useState(editing?.time?.slice(0, 5) ?? "09:00");
  const [lessonTypeId, setLessonTypeId] = useState<string | null>(
    editing?.lesson_type_id ?? null
  );
  const [type, setType] = useState<"ozel" | "grup">(editing?.type ?? "ozel");
  const [ids, setIds] = useState<string[]>(editing?.student_ids ?? []);
  const [fee, setFee] = useState(Number(editing?.fee ?? PRICE_OZEL));
  const [feeEdited, setFeeEdited] = useState(!!editing);
  const [status, setStatus] = useState(editing?.status ?? "planlandi");
  const [note, setNote] = useState(editing?.note ?? "");
  const [recurrence, setRecurrence] = useState<LessonRecurrence>("none");
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);

  const selectedType = lessonTypes.find((t) => t.id === lessonTypeId) ?? null;
  const defaultTypeId = selectableTypes[0]?.id ?? null;

  /** Birim ücret: ders tipinin güncel fiyatı (grup tipinde kişi başı) */
  const unitPrice = selectedType
    ? Number(selectedType.price)
    : type === "ozel"
      ? PRICE_OZEL
      : PRICE_GRUP;

  // Yeni derste, tipler yüklenince ilk tip seçili gelsin
  useEffect(() => {
    if (editing || lessonTypeId || !defaultTypeId) return;
    const first = lessonTypes.find((t) => t.id === defaultTypeId);
    if (!first) return;
    setLessonTypeId(first.id);
    setType(first.kind);
  }, [editing, lessonTypeId, defaultTypeId, lessonTypes]);

  useEffect(() => {
    if (feeEdited) return;
    setFee(type === "grup" ? unitPrice * Math.max(1, ids.length) : unitPrice);
  }, [type, ids, feeEdited, unitPrice]);

  const toggleStudent = (id: string) => {
    setErrors((e) => ({ ...e, ids: null }));
    if (type === "ozel") setIds(ids[0] === id ? [] : [id]);
    else setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  };

  const selectLessonType = (typeId: string, kind: "ozel" | "grup") => {
    setLessonTypeId(typeId);
    setType(kind);
    // Tip değişince ücret yeni tipin fiyatından hesaplansın
    setFeeEdited(false);
    if (kind === "ozel" && ids.length > 1) setIds(ids.slice(0, 1));
  };

  const switchType = (t: "ozel" | "grup") => {
    setType(t);
    if (t === "ozel" && ids.length > 1) setIds(ids.slice(0, 1));
  };

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  /** Öğrenci id → paket durumu (düzenlenen dersin kendisi planlı sayılmaz) */
  const packageByStudent = packageAvailabilityByStudent(students, lessons, {
    excludeLessonId: lessonId,
  });

  const packageAlerts = ids
    .map((id) => ({ student: students.find((s) => s.id === id), pkg: packageByStudent.get(id) }))
    .filter((a): a is { student: (typeof students)[number]; pkg: PackageAvailability } =>
      !!a.student && !!a.pkg && a.pkg.level !== "ok"
    );

  const hasEmptyPackage = packageAlerts.some((a) => a.pkg.level === "empty");

  const save = async () => {
    const payload = {
      date,
      time,
      type,
      lessonTypeId,
      studentIds: ids,
      fee: Number(fee),
      status,
      note: note || null,
      recurrence: editing ? "none" : recurrence,
    };

    const parsed = lessonSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        const key = e.path[0]?.toString() ?? "form";
        fieldErrors[key] = e.message;
      });
      setErrors(fieldErrors);
      toast("Lütfen eksik alanları doldurun", { tone: "rose", icon: "x" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateLesson(editing.id, parsed.data);
        toast("Ders güncellendi", { tone: "green", icon: "check" });
      } else {
        await createLesson(parsed.data);
        const count =
          parsed.data.recurrence === "weekly"
            ? RECURRENCE_COUNTS.weekly
            : parsed.data.recurrence === "monthly"
              ? RECURRENCE_COUNTS.monthly
              : 1;
        toast(
          count > 1
            ? `${count} ders planlandı · ${RECURRENCE_LABELS[parsed.data.recurrence]}`
            : "Ders eklendi · Kaydedildi",
          { tone: "green", icon: "check" }
        );
      }

      if (packageAlerts.length > 0) {
        const empty = packageAlerts.filter((a) => a.pkg.level === "empty");
        toast(
          empty.length > 0
            ? `${empty.map((a) => a.student.name).join(", ")} · paketi bitti, yenilemeyi unutmayın`
            : `${packageAlerts.map((a) => a.student.name).join(", ")} · paketinde son 1 ders kaldı`,
          { tone: empty.length > 0 ? "rose" : "sage", icon: "alert", duration: 4200 }
        );
      }

      router.push("/calendar/weekly");
    } catch {
      toast("Kayıt başarısız", { tone: "rose", icon: "x" });
    } finally {
      setSaving(false);
    }
  };

  const isRecurringLesson = !!editing?.recurrence_group_id;

  if (loading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-[720px]">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href={editing ? "/calendar/weekly" : "/dashboard"} aria-label="Geri">
            <Icon name="chevronL" />
          </Link>
        </Button>
        <div>
          <div className="text-[12.5px] tracking-wide text-[var(--ink-3)]">
            {editing ? "Ders düzenle" : "Yeni ders"}
          </div>
          <h1 className="text-[27px] font-bold">{editing ? "Dersi Düzenle" : "Ders Ekle"}</h1>
        </div>
      </div>

      <Card className="p-5">
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[13px] font-semibold text-[var(--ink-2)]">Ders tipi</label>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--accent-ink)]"
            >
              <Icon name="settings" size={14} /> Düzenle
            </Link>
          </div>

          {selectableTypes.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {selectableTypes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`rounded-xl border px-3 py-2 text-left text-[13.5px] font-semibold transition-all ${
                      lessonTypeId === t.id
                        ? "border-transparent bg-[var(--accent-soft)] text-[var(--accent-ink)] shadow-[var(--shadow-sm)]"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-2)]"
                    }`}
                    onClick={() => selectLessonType(t.id, t.kind)}
                  >
                    {t.name}
                    <span className="ml-1.5 font-normal text-[var(--ink-3)]">
                      {fmtMoney(Number(t.price))}
                      {t.kind === "grup" ? "/kişi" : ""}
                    </span>
                    {t.archived_at && (
                      <span className="ml-1.5 font-normal text-[var(--ink-3)]">· pasif</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-[var(--ink-3)]">
                Ücret bu derse kaydedilir; ayarlardan fiyat değiştirmek eski dersleri etkilemez.
              </p>
            </>
          ) : (
            <div className="flex gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-1">
              {(["ozel", "grup"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`flex-1 rounded-[9px] px-3 py-2 text-[13.5px] font-semibold transition-all ${type === t ? "bg-[var(--surface)] text-[var(--accent-ink)] shadow-[var(--shadow-sm)]" : "text-[var(--ink-2)]"}`}
                  onClick={() => switchType(t)}
                >
                  {t === "ozel" ? "Özel ders" : "Grup dersi"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-5">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">Tarih</label>
            <input type="date" className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3" value={date} onChange={(e) => setDate(e.target.value)} />
            {errors.date && <p className="mt-1 text-xs text-[var(--rose-ink)]">{errors.date}</p>}
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">Saat</label>
            <select className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3" value={time} onChange={(e) => setTime(e.target.value)}>
              {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {!editing ? (
          <div className="mb-4">
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">Tekrar</label>
            <div className="flex gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-1">
              {(["none", "weekly", "monthly"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`flex-1 rounded-[9px] px-3 py-2 text-[13.5px] font-semibold transition-all ${
                    recurrence === r
                      ? "bg-[var(--surface)] text-[var(--accent-ink)] shadow-[var(--shadow-sm)]"
                      : "text-[var(--ink-2)]"
                  }`}
                  onClick={() => setRecurrence(r)}
                >
                  {RECURRENCE_LABELS[r]}
                </button>
              ))}
            </div>
            {recurrence !== "none" && (
              <p className="mt-1.5 text-xs text-[var(--ink-3)]">
                Aynı saat ve öğrencilerle {RECURRENCE_COUNTS[recurrence]} ders otomatik planlanır.
              </p>
            )}
          </div>
        ) : isRecurringLesson ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--ink-2)]">
            <Icon name="repeat" size={16} className="text-[var(--accent-ink)]" />
            <span>
              Bu ders <strong>{RECURRENCE_LABELS[editing.recurrence]}</strong> tekrar eden serinin parçası.
            </span>
          </div>
        ) : null}

        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">
            {type === "ozel" ? "Öğrenci seç" : `Öğrenciler ${ids.length ? `(${ids.length} seçili)` : ""}`}
          </label>
          <div className="relative mb-2.5">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
            <input className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] pl-10 pr-3" placeholder="Öğrenci ara…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {ids.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {ids.map((id) => {
                const st = students.find((s) => s.id === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1.5 rounded-full border border-transparent bg-[var(--accent-soft)] px-3 py-1.5 text-[13px] font-semibold text-[var(--accent-ink)]">
                    {st?.name}
                    <button type="button" onClick={() => toggleStudent(id)}><Icon name="x" size={13} /></button>
                  </span>
                );
              })}
            </div>
          )}
          <div className="flex max-h-[168px] flex-wrap gap-1.5 overflow-y-auto">
            {filtered.map((s) => {
              const pkg = packageByStudent.get(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium ${ids.includes(s.id) ? "border-transparent bg-[var(--accent-soft)] font-semibold text-[var(--accent-ink)]" : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-2)]"}`}
                  onClick={() => toggleStudent(s.id)}
                >
                  <AvatarChip student={s} />
                  {s.name}
                  {pkg && pkg.level !== "ok" && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${pkg.level === "empty" ? "bg-[var(--rose-soft)] text-[var(--rose-ink)]" : "bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] text-[var(--gold)]"}`}
                    >
                      {pkg.level === "empty" ? "paket bitti" : "son 1"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {errors.ids && <p className="mt-1 text-xs text-[var(--rose-ink)]">{errors.ids}</p>}
          {errors.studentIds && <p className="mt-1 text-xs text-[var(--rose-ink)]">{errors.studentIds}</p>}
        </div>

        {packageAlerts.length > 0 && (
          <div
            className={`mb-4 rounded-xl border px-3 py-2.5 ${
              hasEmptyPackage
                ? "border-[var(--rose)] bg-[var(--rose-soft)]"
                : "border-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_12%,transparent)]"
            }`}
          >
            <div
              className={`flex items-center gap-2 text-[13.5px] font-semibold ${hasEmptyPackage ? "text-[var(--rose-ink)]" : "text-[var(--gold)]"}`}
            >
              <Icon name="alert" size={16} />
              {hasEmptyPackage ? "Paket bitti" : "Paket bitmek üzere"}
            </div>
            <ul className="mt-1.5 space-y-1 text-[13px] text-[var(--ink-2)]">
              {packageAlerts.map(({ student, pkg }) => (
                <li key={student.id}>
                  <strong>{student.name}</strong> — {packageAlertText(pkg)}
                  {pkg.planned > 0 && (
                    <span className="text-[var(--ink-3)]">
                      {" "}
                      ({pkg.remaining} kalan · {pkg.planned} planlı ders)
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-xs text-[var(--ink-3)]">
              Dersi yine de kaydedebilirsiniz; paketi öğrenci kartından yenileyebilirsiniz.
            </p>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-5">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">
              Ders ücreti {type === "grup" && <span className="font-normal text-[var(--ink-3)]">· kişi başı {fmtMoney(unitPrice)}</span>}
            </label>
            <input type="number" className="tnum h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3" value={fee} onChange={(e) => { setFee(Number(e.target.value)); setFeeEdited(true); }} />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">Ders durumu</label>
            <select className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="planlandi">Planlandı</option>
              <option value="geldi">Geldi</option>
              <option value="gelmedi">Gelmedi</option>
              <option value="iptal">İptal</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">
            Not <span className="font-normal text-[var(--ink-3)]">(opsiyonel)</span>
          </label>
          <textarea className="min-h-[78px] w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bu derse özel notlar…" />
        </div>
      </Card>

      <div className="mt-4 flex justify-between">
        {editing ? (
          <div className="flex flex-wrap gap-2">
            <LessonDeleteButton
              lessonId={editing.id}
              scope="single"
              size="sm"
              label="Bu dersi sil"
              redirectTo="/calendar/weekly"
            />
            {isRecurringLesson && (
              <LessonDeleteButton
                lessonId={editing.id}
                scope="future"
                size="sm"
                label="Bu ve sonrakileri sil"
                redirectTo="/calendar/weekly"
              />
            )}
          </div>
        ) : (
          <span />
        )}
        <div className="flex gap-2.5">
          <Button variant="secondary" asChild>
            <Link href={editing ? "/calendar/weekly" : "/dashboard"}>Vazgeç</Link>
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            <Icon name="check" /> {editing ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AvatarChip({ student }: { student: { initials: string; color: string } }) {
  return (
    <span
      className="grid h-[22px] w-[22px] place-items-center rounded-full text-[9px] font-bold"
      style={{ background: `${student.color}2e`, color: student.color }}
    >
      {student.initials}
    </span>
  );
}
