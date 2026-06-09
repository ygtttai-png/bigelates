"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { lessonSchema } from "@/lib/validations/lesson";
import { fmtMoney } from "@/utils/currency";
import { today, ymd } from "@/utils/date";
import { DEFAULT_PRICE_GRUP, DEFAULT_PRICE_OZEL, TIME_OPTIONS } from "@/utils/lessons";

interface LessonFormProps {
  lessonId?: string;
}

export function LessonForm({ lessonId }: LessonFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { lessons, students, studio, loading, createLesson, updateLesson, deleteLesson } = useApp();

  const editing = lessonId ? lessons.find((l) => l.id === lessonId) : null;
  const PRICE_OZEL = studio?.settings?.price_ozel ?? DEFAULT_PRICE_OZEL;
  const PRICE_GRUP = studio?.settings?.price_grup ?? DEFAULT_PRICE_GRUP;

  const [date, setDate] = useState(editing?.date ?? ymd(today()));
  const [time, setTime] = useState(editing?.time?.slice(0, 5) ?? "09:00");
  const [type, setType] = useState<"ozel" | "grup">(editing?.type ?? "ozel");
  const [ids, setIds] = useState<string[]>(editing?.student_ids ?? []);
  const [fee, setFee] = useState(Number(editing?.fee ?? PRICE_OZEL));
  const [feeEdited, setFeeEdited] = useState(!!editing);
  const [status, setStatus] = useState(editing?.status ?? "planlandi");
  const [note, setNote] = useState(editing?.note ?? "");
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (feeEdited) return;
    setFee(type === "ozel" ? PRICE_OZEL : PRICE_GRUP * Math.max(1, ids.length));
  }, [type, ids, feeEdited, PRICE_OZEL, PRICE_GRUP]);

  const toggleStudent = (id: string) => {
    setErrors((e) => ({ ...e, ids: null }));
    if (type === "ozel") setIds(ids[0] === id ? [] : [id]);
    else setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  };

  const switchType = (t: "ozel" | "grup") => {
    setType(t);
    if (t === "ozel" && ids.length > 1) setIds(ids.slice(0, 1));
  };

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const save = async () => {
    const payload = {
      date,
      time,
      type,
      studentIds: ids,
      fee: Number(fee),
      status,
      note: note || null,
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
        toast("Ders eklendi · Kaydedildi", { tone: "green", icon: "check" });
      }
      router.push("/calendar/weekly");
    } catch {
      toast("Kayıt başarısız", { tone: "rose", icon: "x" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await deleteLesson(editing.id);
      toast("Ders silindi", { tone: "rose", icon: "trash" });
      router.push("/calendar/weekly");
    } catch {
      toast("Silme başarısız", { tone: "rose", icon: "x" });
    } finally {
      setSaving(false);
    }
  };

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
          <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">Ders tipi</label>
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
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium ${ids.includes(s.id) ? "border-transparent bg-[var(--accent-soft)] font-semibold text-[var(--accent-ink)]" : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-2)]"}`}
                onClick={() => toggleStudent(s.id)}
              >
                <AvatarChip student={s} />
                {s.name}
              </button>
            ))}
          </div>
          {errors.ids && <p className="mt-1 text-xs text-[var(--rose-ink)]">{errors.ids}</p>}
          {errors.studentIds && <p className="mt-1 text-xs text-[var(--rose-ink)]">{errors.studentIds}</p>}
        </div>

        <div className="mb-4 flex flex-wrap gap-5">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--ink-2)]">
              Ders ücreti {type === "grup" && <span className="font-normal text-[var(--ink-3)]">· kişi başı {fmtMoney(PRICE_GRUP)}</span>}
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
          <Button variant="danger" onClick={() => void remove()} disabled={saving}>
            <Icon name="trash" /> Sil
          </Button>
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
