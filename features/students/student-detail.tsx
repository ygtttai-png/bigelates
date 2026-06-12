"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Donut } from "@/components/ui/donut";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusPill } from "@/components/ui/status-pill";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { StudentFormDialog } from "@/features/students/student-form-dialog";
import { createClient } from "@/lib/supabase/client";
import { StudentsService } from "@/services/students.service";
import { fmtMoney } from "@/utils/currency";
import { TR_MONTHS, parseYmd } from "@/utils/date";
import { PAY_LABEL } from "@/utils/lessons";
import type { Lesson, Payment } from "@/types";

interface StudentDetailProps {
  studentId: string;
}

export function StudentDetail({ studentId }: StudentDetailProps) {
  const { students, lessons, loading } = useApp();
  const toast = useToast();
  const s = students.find((x) => x.id === studentId);
  const [tab, setTab] = useState<"lessons" | "pay" | "notes">("lessons");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const service = new StudentsService(supabase);
      const data = await service.getPayments(studentId);
      setPayments(data);
      setPaymentsLoading(false);
    }
    void load();
  }, [studentId]);

  const st = useMemo(() => {
    const mine = lessons.filter((l) => l.student_ids?.includes(studentId));
    return {
      attended: mine.filter((l) => l.status === "geldi").length,
      missed: mine.filter((l) => l.status === "gelmedi").length,
      all: [...mine].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
    };
  }, [lessons, studentId]);

  if (loading) return <LoadingState />;
  if (!s) return <EmptyState icon="users" message="Öğrenci bulunamadı." />;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/students" aria-label="Geri">
              <Icon name="chevronL" />
            </Link>
          </Button>
          <div className="flex items-center gap-3.5">
            <Avatar student={s} size={52} />
            <div>
              <h1 className="text-2xl font-bold">{s.name}</h1>
              <div className="mt-0.5 flex items-center gap-2">
                <span className={`rounded-[7px] px-2 py-0.5 text-[11px] font-bold uppercase ${s.type === "ozel" ? "bg-[var(--sage-soft)] text-[var(--sage-ink)]" : "bg-[var(--plum-soft)] text-[var(--plum-ink)]"}`}>
                  {s.type === "ozel" ? "Özel" : "Grup"}
                </span>
                <span className="tnum text-[13px] text-[var(--ink-3)]">{s.phone}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Icon name="edit" /> Düzenle
          </Button>
          <Button variant="secondary" onClick={() => toast("Arama başlatılıyor…", { tone: "sage", icon: "phone" })}>
            <Icon name="phone" /> Ara
          </Button>
          <Button asChild>
            <Link href="/lessons/new"><Icon name="plus" /> Ders ekle</Link>
          </Button>
        </div>
      </div>

      <StudentFormDialog open={editOpen} onClose={() => setEditOpen(false)} student={s} />

      <div className="grid items-start gap-5 lg:grid-cols-[320px_1fr] lg:gap-[22px]">
        <div className="flex flex-col gap-4 lg:gap-[18px]">
          <Card className="p-5">
            <span className="text-[12.5px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
              Kalan ders hakkı
            </span>
            <div className="mt-3.5 flex items-center gap-4">
              <div className="relative shrink-0">
                <Donut value={s.remaining} total={s.package_total} size={104} stroke={12} color={s.remaining <= 2 ? "var(--rose)" : "var(--accent)"} track="var(--surface-3)" />
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div className="tnum text-[22px] font-extrabold leading-none">{s.remaining}</div>
                  <div className="text-[10px] text-[var(--ink-3)]">/ {s.package_total}</div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Kv k="Toplam paket" v={`${s.package_total} ders`} />
                <Kv k="Kullanılan" v={`${s.package_total - s.remaining} ders`} />
                {s.remaining <= 2 && <Badge tone="rose" size="sm">Paket bitmek üzere</Badge>}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <span className="text-[12.5px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
              Kişisel bilgiler
            </span>
            <div className="mt-2">
              <Kv k="Telefon" v={s.phone} />
              <Kv k="Kayıt tarihi" v={`${parseYmd(s.join_date).getDate()} ${TR_MONTHS[parseYmd(s.join_date).getMonth()]} ${parseYmd(s.join_date).getFullYear()}`} />
              <Kv k="Ders tipi" v={s.type === "ozel" ? "Özel ders" : "Grup dersi"} />
              <div className="flex justify-between gap-3 border-b border-[var(--line-2)] py-2.5 text-sm last:border-b-0">
                <span className="text-[var(--ink-2)]">Ödeme durumu</span>
                <Badge tone={s.payment_status === "odendi" ? "green" : "gold"} size="sm">
                  {PAY_LABEL[s.payment_status]}
                </Badge>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-5 text-center">
              <div className="tnum text-[26px] font-extrabold text-[var(--green-ink)]">{st.attended}</div>
              <div className="text-[12.5px] text-[var(--ink-3)]">Katıldığı ders</div>
            </Card>
            <Card className="p-5 text-center">
              <div className="tnum text-[26px] font-extrabold text-[var(--rose-ink)]">{st.missed}</div>
              <div className="text-[12.5px] text-[var(--ink-3)]">Gelmediği ders</div>
            </Card>
          </div>
        </div>

        <Card className="p-5">
          <div className="-mb-px flex gap-1 border-b border-[var(--line)]">
            {(
              [
                ["lessons", "Ders geçmişi"],
                ["pay", "Ödeme geçmişi"],
                ["notes", "Notlar"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                className={`mb-[-1px] border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${tab === k ? "border-[var(--accent)] text-[var(--accent-ink)]" : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"}`}
                onClick={() => setTab(k)}
              >
                {l}
              </button>
            ))}
          </div>

          {tab === "lessons" && (
            <div>
              {st.all.length === 0 && <EmptyState icon="calendar" message="Henüz ders kaydı yok." />}
              {st.all.slice(0, 14).map((l) => (
                <LessonTimelineItem key={l.id} lesson={l} />
              ))}
            </div>
          )}

          {tab === "pay" && (
            <div>
              {paymentsLoading && <LoadingState message="Ödemeler yükleniyor…" />}
              {!paymentsLoading && payments.length === 0 && (
                <EmptyState icon="wallet" message="Ödeme kaydı bulunamadı." />
              )}
              {payments.map((p) => (
                <div key={p.id} className="flex gap-3 border-b border-[var(--line-2)] py-2.5 last:border-b-0">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${p.status === "odendi" ? "bg-[var(--green)]" : "bg-[var(--gold)]"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <span className="text-sm font-semibold">{p.package_label}</span>
                      <span className="tnum font-bold">{fmtMoney(Number(p.amount))}</span>
                    </div>
                    <div className="mt-0.5 flex justify-between">
                      <span className="tnum text-[12.5px] text-[var(--ink-3)]">
                        {parseYmd(p.payment_date).getDate()} {TR_MONTHS[parseYmd(p.payment_date).getMonth()]?.slice(0, 3)} {parseYmd(p.payment_date).getFullYear()}
                      </span>
                      <Badge tone={p.status === "odendi" ? "green" : "gold"} size="sm">
                        {PAY_LABEL[p.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "notes" && (
            <div>
              {s.notes ? (
                <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-4 text-[14.5px] leading-relaxed">
                  <div className="mb-2 flex items-center gap-2 text-[var(--ink-3)]">
                    <Icon name="note" size={16} />
                    <span className="text-[12.5px] font-semibold">Eğitmen notu</span>
                  </div>
                  {s.notes}
                </div>
              ) : (
                <EmptyState icon="note" message="Bu öğrenci için not eklenmemiş." />
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--line-2)] py-1.5 text-sm last:border-b-0">
      <span className="text-[var(--ink-2)]">{k}</span>
      <span className="tnum text-right font-semibold">{v}</span>
    </div>
  );
}

function LessonTimelineItem({ lesson: l }: { lesson: Lesson }) {
  const toneColor: Record<string, string> = {
    green: "var(--green)",
    rose: "var(--rose)",
    sage: "var(--sage)",
    muted: "var(--muted-ink)",
  };

  return (
    <Link
      href={`/lessons/${l.id}/edit`}
      className="flex gap-3 border-b border-[var(--line-2)] py-2.5 last:border-b-0 hover:bg-[var(--surface-2)]"
    >
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--sage)]" style={{ background: toneColor.sage }} />
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2">
          <span className="text-sm font-semibold">
            {parseYmd(l.date).getDate()} {TR_MONTHS[parseYmd(l.date).getMonth()]?.slice(0, 3)} · {l.time.slice(0, 5)}
          </span>
          <StatusPill status={l.status} size="sm" />
        </div>
        <div className="mt-0.5 text-[12.5px] text-[var(--ink-3)]">
          {l.type === "ozel" ? "Özel ders" : "Grup dersi"} · {fmtMoney(Number(l.fee))}
        </div>
      </div>
    </Link>
  );
}
