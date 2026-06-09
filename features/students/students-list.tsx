"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { useApp } from "@/components/providers/app-provider";
import { StudentFormDialog } from "@/features/students/student-form-dialog";
import { PAY_LABEL } from "@/utils/lessons";
import type { Lesson, Student } from "@/types";

function studentStats(lessons: Lesson[], id: string) {
  const mine = lessons.filter((l) => l.student_ids?.includes(id));
  return {
    attended: mine.filter((l) => l.status === "geldi").length,
    missed: mine.filter((l) => l.status === "gelmedi").length,
    upcoming: mine.filter((l) => l.status === "planlandi").length,
  };
}

type FilterKey = "all" | "ozel" | "grup" | "bekliyor";

export function StudentsList() {
  const { students, lessons, loading, error } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [formOpen, setFormOpen] = useState(false);

  const rows = useMemo(
    () =>
      students
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q.toLowerCase()) || s.phone.includes(q)
        )
        .filter(
          (s) =>
            filter === "all" ||
            (filter === "ozel" && s.type === "ozel") ||
            (filter === "grup" && s.type === "grup") ||
            (filter === "bekliyor" && s.payment_status === "bekliyor")
        )
        .map((s) => ({ s, st: studentStats(lessons, s.id) })),
    [students, lessons, q, filter]
  );

  const pending = students.filter((s) => s.payment_status === "bekliyor").length;

  if (loading) return <LoadingState />;
  if (error) return <EmptyState icon="x" message={error} />;

  return (
    <>
      <PageHeader
        eyebrow={`${students.length} öğrenci · ${pending} ödeme bekliyor`}
        title="Öğrenciler"
        action={
          <Button onClick={() => setFormOpen(true)} className="hidden lg:inline-flex">
            <Icon name="plus" />
            Öğrenci Ekle
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[220px] max-w-[360px] flex-1">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
          <input
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] pl-10 pr-3 text-[14.5px] focus:border-[var(--accent)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-soft)]"
            placeholder="İsim veya telefon ara…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setFormOpen(true)} className="lg:hidden">
            <Icon name="plus" size={16} />
            Ekle
          </Button>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["all", "Tümü"],
                ["ozel", "Özel"],
                ["grup", "Grup"],
                ["bekliyor", "Ödeme bekleyen"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  filter === k
                    ? "border-transparent bg-[var(--accent-soft)] font-semibold text-[var(--accent-ink)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-2)] hover:border-[var(--accent)]"
                }`}
                onClick={() => setFilter(k)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="hidden border-b border-[var(--line)] px-[18px] py-3 lg:grid lg:grid-cols-[2.2fr_1.3fr_1fr_1fr_auto] lg:gap-3.5">
          {["Öğrenci", "Ders tipi", "Kalan paket", "Ödeme", ""].map((h) => (
            <span key={h} className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
              {h}
            </span>
          ))}
        </div>
        {rows.map(({ s }) => (
          <StudentRow key={s.id} student={s} />
        ))}
        {rows.length === 0 && students.length === 0 && (
          <EmptyState icon="users" message="Henüz öğrenci yok.">
            <Button onClick={() => setFormOpen(true)}>
              <Icon name="plus" />
              İlk öğrenciyi ekle
            </Button>
          </EmptyState>
        )}
        {rows.length === 0 && students.length > 0 && (
          <EmptyState icon="search" message="Arama kriterlerine uygun öğrenci bulunamadı." />
        )}
      </Card>

      <StudentFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}

function StudentRow({ student: s }: { student: Student }) {
  return (
    <Link
      href={`/students/${s.id}`}
      className="grid grid-cols-[1fr_auto] items-center gap-3.5 border-b border-[var(--line-2)] px-[18px] py-3.5 transition-colors last:border-b-0 hover:bg-[var(--surface-2)] lg:grid-cols-[2.2fr_1.3fr_1fr_1fr_auto]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar student={s} size={42} />
        <div className="min-w-0">
          <div className="text-[14.5px] font-semibold">{s.name}</div>
          <div className="tnum text-[12.5px] text-[var(--ink-2)]">{s.phone}</div>
        </div>
      </div>
      <div className="hidden lg:block">
        <span className={`rounded-[7px] px-2 py-0.5 text-[11px] font-bold uppercase ${s.type === "ozel" ? "bg-[var(--sage-soft)] text-[var(--sage-ink)]" : "bg-[var(--plum-soft)] text-[var(--plum-ink)]"}`}>
          {s.type === "ozel" ? "Özel" : "Grup"}
        </span>
      </div>
      <div className="hidden max-w-[130px] lg:block">
        <div className="mb-1 flex justify-between text-[12.5px]">
          <span className="tnum font-semibold">{s.remaining}/{s.package_total}</span>
          <span className="text-[var(--ink-3)]">kaldı</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded bg-[var(--surface-3)]">
          <div
            className="h-full rounded transition-all"
            style={{
              width: `${(s.remaining / s.package_total) * 100}%`,
              background: s.remaining <= 2 ? "var(--rose)" : "var(--accent)",
            }}
          />
        </div>
      </div>
      <div className="hidden lg:block">
        <Badge tone={s.payment_status === "odendi" ? "green" : "gold"} size="sm">
          {PAY_LABEL[s.payment_status]}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="lg:hidden">
          <Badge tone={s.payment_status === "odendi" ? "green" : "gold"} size="sm">
            {s.remaining} ders
          </Badge>
        </span>
        <Icon name="chevronR" size={18} className="text-[var(--ink-3)]" />
      </div>
    </Link>
  );
}
