"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LessonDeleteButton } from "@/components/features/lessons/lesson-delete-button";
import { LessonRow } from "@/components/features/lessons/lesson-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { useApp } from "@/components/providers/app-provider";
import { fmtMoney, fmtMoneyShort } from "@/utils/currency";
import { TR_DAYS, TR_DAYS_SHORT, TR_MONTHS, addDays, isSameDay, startOfWeek, today, ymd } from "@/utils/date";
import { earnedFee, lessonsOn, newLessonPath } from "@/utils/lessons";
import type { Lesson } from "@/types";

type ViewMode = "columns" | "timegrid" | "agenda";

export function WeeklyCalendar() {
  const { lessons, loading, error, studentById } = useApp();
  const [view, setView] = useState<ViewMode>("columns");
  const [offset, setOffset] = useState(0);
  const TODAY = today();

  const weekStart = useMemo(() => addDays(startOfWeek(TODAY), offset * 7), [offset, TODAY]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const byDay = useMemo(() => days.map((d) => lessonsOn(lessons, d)), [days, lessons]);

  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const weekLabel = sameMonth
    ? `${weekStart.getDate()}–${end.getDate()} ${TR_MONTHS[end.getMonth()]}`
    : `${weekStart.getDate()} ${TR_MONTHS[weekStart.getMonth()]?.slice(0, 3)} – ${end.getDate()} ${TR_MONTHS[end.getMonth()]?.slice(0, 3)}`;

  if (loading) return <LoadingState />;
  if (error) return <EmptyState icon="x" message={error} />;

  return (
    <>
      <PageHeader
        eyebrow="Haftalık takvim"
        title="Ders Takvimi"
        action={
          <Button asChild className="hidden lg:inline-flex">
            <Link href="/lessons/new"><Icon name="plus" /> Ders Ekle</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <ViewSeg
            items={[
              { href: "/calendar/weekly", label: "Hafta", active: true },
              { href: "/calendar/monthly", label: "Ay", active: false },
            ]}
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setOffset(offset - 1)} aria-label="Önceki hafta">
              <Icon name="chevronL" />
            </Button>
            <div className="min-w-[130px] text-center text-[15px] font-bold">{weekLabel}</div>
            <Button variant="outline" size="icon" onClick={() => setOffset(offset + 1)} aria-label="Sonraki hafta">
              <Icon name="chevronR" />
            </Button>
            {offset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => setOffset(0)}>Bugün</Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="hidden items-center gap-4 lg:flex">
            <LegendDot color="var(--sage)" label="Özel" />
            <LegendDot color="var(--plum)" label="Grup" />
          </div>
          <ViewSeg
            items={[
              { key: "columns", label: "Sütun", icon: "grid", active: view === "columns", onClick: () => setView("columns") },
              { key: "timegrid", label: "Saat", icon: "clock", active: view === "timegrid", onClick: () => setView("timegrid") },
              { key: "agenda", label: "Ajanda", icon: "note", active: view === "agenda", onClick: () => setView("agenda") },
            ]}
          />
        </div>
      </div>

      {view === "columns" && <ColumnsView days={days} byDay={byDay} today={TODAY} studentById={studentById} />}
      {view === "timegrid" && <TimeGridView days={days} byDay={byDay} today={TODAY} studentById={studentById} />}
      {view === "agenda" && <AgendaView days={days} byDay={byDay} today={TODAY} />}
    </>
  );
}

function blockLabel(l: Lesson, studentById: (id: string) => { name: string } | undefined) {
  const names = (l.student_ids ?? []).map((id) => studentById(id)?.name).filter(Boolean);
  return l.type === "grup" ? `Grup · ${names.length}` : names[0] ?? "—";
}

function ColumnsView({
  days,
  byDay,
  today: TODAY,
  studentById,
}: {
  days: Date[];
  byDay: Lesson[][];
  today: Date;
  studentById: (id: string) => { name: string } | undefined;
}) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-[720px]">
        <div className="mb-2.5 grid grid-cols-7 gap-2">
          {days.map((d, i) => (
            <Link
              key={i}
              href={newLessonPath(ymd(d))}
              className={`rounded-xl py-2 text-center transition-colors hover:bg-[var(--surface-2)] ${isSameDay(d, TODAY) ? "bg-[var(--accent-soft)]" : ""}`}
            >
              <div className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--ink-2)]">{TR_DAYS_SHORT[i]}</div>
              <div className={`tnum mt-0.5 text-[19px] font-bold ${isSameDay(d, TODAY) ? "text-[var(--accent-ink)]" : ""}`}>{d.getDate()}</div>
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {byDay.map((ls, i) => (
            <div key={i} className={`relative flex min-h-[60px] min-w-0 flex-col gap-1.5 rounded-[14px] p-2 ${isSameDay(days[i]!, TODAY) ? "bg-[var(--accent-soft)]" : "bg-[var(--surface-2)]"}`}>
              <Link
                href={newLessonPath(ymd(days[i]!))}
                className="absolute inset-0 z-0 rounded-[14px]"
                aria-label={`${ymd(days[i]!)} tarihine ders ekle`}
              />
              {ls.length === 0 && (
                <div className="relative z-[1] flex flex-1 items-center justify-center py-2 text-[11px] text-[var(--ink-3)]">
                  + Ders ekle
                </div>
              )}
              {ls.map((l) => (
                <Link
                  key={l.id}
                  href={`/lessons/${l.id}/edit`}
                  className={`relative z-[1] cursor-pointer rounded-[10px] border border-transparent bg-[var(--surface)] py-2 pl-3 pr-2.5 text-xs shadow-[var(--shadow-sm)] transition-all hover:-translate-y-px hover:shadow-[var(--shadow)] before:absolute before:bottom-2 before:left-0 before:top-2 before:w-[3px] before:rounded ${l.type === "ozel" ? "before:bg-[var(--sage)]" : "before:bg-[var(--plum)]"} ${l.status === "gelmedi" ? "bg-[var(--rose-soft)]" : ""} ${l.status === "iptal" ? "opacity-55" : ""}`}
                >
                  <div className="tnum text-[11.5px] font-bold">{l.time.slice(0, 5)}</div>
                  <div className={`truncate text-xs font-semibold ${l.status === "iptal" ? "line-through" : ""}`}>
                    {blockLabel(l, studentById)}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${l.type === "ozel" ? "bg-[var(--sage-soft)] text-[var(--sage-ink)]" : "bg-[var(--plum-soft)] text-[var(--plum-ink)]"}`}>
                      {l.type === "ozel" ? "Özel" : "Grup"}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <span className="tnum text-[11px]">{fmtMoneyShort(Number(l.fee))}</span>
                      <LessonDeleteButton
                        lessonId={l.id}
                        className="h-6 w-6 shrink-0"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimeGridView({
  days,
  byDay,
  today: TODAY,
  studentById,
}: {
  days: Date[];
  byDay: Lesson[][];
  today: Date;
  studentById: (id: string) => { name: string } | undefined;
}) {
  const H0 = 8;
  const H1 = 21;
  const ROW = 56;
  const hours = Array.from({ length: H1 - H0 }, (_, i) => H0 + i);
  const topFor = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return (h! - H0) * ROW + (m! / 60) * ROW;
  };

  return (
    <Card className="overflow-hidden p-5">
      <div className="overflow-x-auto">
        <div className="grid min-w-[680px] grid-cols-[48px_repeat(7,1fr)] gap-2">
          <div />
          {days.map((d, i) => (
            <Link
              key={i}
              href={newLessonPath(ymd(d))}
              className={`mb-1 rounded-xl py-2 text-center transition-colors hover:bg-[var(--surface-2)] ${isSameDay(d, TODAY) ? "bg-[var(--accent-soft)]" : ""}`}
            >
              <div className="text-[11.5px] font-semibold uppercase text-[var(--ink-2)]">{TR_DAYS_SHORT[i]}</div>
              <div className="tnum text-base font-bold">{d.getDate()}</div>
            </Link>
          ))}
          <div>
            {hours.map((h) => (
              <div key={h} className="tnum h-14 -translate-y-[7px] pr-2.5 text-right text-[11px] text-[var(--ink-3)]">
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {byDay.map((ls, di) => (
            <div key={di} className="relative">
              <Link
                href={newLessonPath(ymd(days[di]!))}
                className="absolute inset-0 z-0"
                aria-label={`${ymd(days[di]!)} tarihine ders ekle`}
              />
              {hours.map((h) => (
                <div key={h} className="relative z-[1] h-14 border-t border-[var(--line-2)]" />
              ))}
              {ls.filter((l) => l.status !== "iptal").map((l) => (
                <div
                  key={l.id}
                  className={`group absolute left-[3px] right-[3px] z-[2] overflow-hidden rounded-[9px] px-2 py-1 pl-[11px] text-[11.5px] shadow-[var(--shadow-sm)] before:absolute before:bottom-1 before:left-0 before:top-1 before:w-[3px] before:rounded ${l.type === "ozel" ? "bg-[var(--sage-soft)] before:bg-[var(--sage)]" : "bg-[var(--plum-soft)] before:bg-[var(--plum)]"} ${l.status === "gelmedi" ? "bg-[var(--rose-soft)]" : ""}`}
                  style={{ top: topFor(l.time.slice(0, 5)) + 2, height: ROW - 6 }}
                >
                  <Link href={`/lessons/${l.id}/edit`} className="block pr-6">
                    <div className="tnum font-bold">{l.time.slice(0, 5)}</div>
                    <div className="truncate">{blockLabel(l, studentById)}</div>
                  </Link>
                  <div className="absolute right-1 top-1">
                    <LessonDeleteButton lessonId={l.id} className="h-5 w-5 opacity-80" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function AgendaView({ days, byDay, today: TODAY }: { days: Date[]; byDay: Lesson[][]; today: Date }) {
  const any = byDay.some((d) => d.length);
  if (!any) {
    return (
      <Card className="p-5">
        <EmptyState icon="calendar" message="Bu hafta planlı ders yok.">
          <Button asChild><Link href="/lessons/new"><Icon name="plus" /> Ders ekle</Link></Button>
        </EmptyState>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      {days.map((d, i) => {
        const ls = byDay[i]!;
        if (!ls.length) return null;
        const earned = ls.reduce((a, l) => a + earnedFee(l), 0);
        const isToday = isSameDay(d, TODAY);
        return (
          <div key={i} className="mb-2">
            <div className="sticky top-0 flex items-baseline gap-2.5 bg-[var(--surface)] px-1 py-3.5">
              <span className={`text-[15px] font-bold ${isToday ? "text-[var(--accent-ink)]" : ""}`}>{TR_DAYS[i]}</span>
              <span className="tnum text-[13px] text-[var(--ink-3)]">
                {d.getDate()} {TR_MONTHS[d.getMonth()]?.slice(0, 3)}{isToday ? " · Bugün" : ""}
              </span>
              <span className="tnum ml-auto text-[13px] font-bold text-[var(--green-ink)]">
                {earned ? fmtMoney(earned) : ""}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {ls.map((l) => <LessonRow key={l.id} lesson={l} />)}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function ViewSeg({
  items,
}: {
  items: Array<
    | { href: string; label: string; active: boolean }
    | { key?: string; label: string; icon?: string; active: boolean; onClick?: () => void }
  >;
}) {
  return (
    <div className="inline-flex gap-0.5 rounded-[11px] border border-[var(--line)] bg-[var(--surface-2)] p-0.5">
      {items.map((item) => {
        if ("href" in item) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${item.active ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)]" : "text-[var(--ink-2)]"}`}
            >
              {item.label}
            </Link>
          );
        }
        return (
          <button
            key={item.key ?? item.label}
            type="button"
            onClick={item.onClick}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${item.active ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)]" : "text-[var(--ink-2)]"}`}
          >
            {item.icon && <Icon name={item.icon as "grid"} size={15} />}
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-[var(--ink-2)]">
      <span className="h-2.5 w-2.5 rounded" style={{ background: color }} />
      {label}
    </span>
  );
}
