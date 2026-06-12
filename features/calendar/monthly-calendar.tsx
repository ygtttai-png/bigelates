"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { useApp } from "@/components/providers/app-provider";
import { fmtMoney } from "@/utils/currency";
import { TR_DAYS_SHORT, TR_MONTHS, addDays, isSameDay, today, ymd } from "@/utils/date";
import { earnedFee, lessonsInRange, newLessonPath } from "@/utils/lessons";

export function MonthlyCalendar() {
  const { lessons, loading } = useApp();
  const [monthOffset, setMonthOffset] = useState(0);
  const TODAY = today();

  const base = useMemo(
    () => new Date(TODAY.getFullYear(), TODAY.getMonth() + monthOffset, 1),
    [monthOffset, TODAY]
  );

  const grid = useMemo(() => {
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const startPad = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -startPad);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [base]);

  const monthLessons = useMemo(() => {
    const map: Record<string, typeof lessons> = {};
    lessons.forEach((l) => {
      (map[l.date] = map[l.date] ?? []).push(l);
    });
    return map;
  }, [lessons]);

  const monthTotal = useMemo(() => {
    const ms = new Date(base.getFullYear(), base.getMonth(), 1);
    const me = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const inM = lessonsInRange(lessons, ms, me);
    return {
      earn: inM.reduce((a, l) => a + earnedFee(l), 0),
      count: inM.filter((l) => l.status !== "iptal").length,
    };
  }, [base, lessons]);

  if (loading) return <LoadingState />;

  return (
    <>
      <PageHeader
        eyebrow="Aylık takvim"
        title={`${TR_MONTHS[base.getMonth()]} ${base.getFullYear()}`}
        action={
          <Button asChild className="hidden lg:inline-flex">
            <Link href="/lessons/new"><Icon name="plus" /> Ders Ekle</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex gap-0.5 rounded-[11px] border border-[var(--line)] bg-[var(--surface-2)] p-0.5">
            <Link href="/calendar/weekly" className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-[var(--ink-2)]">Hafta</Link>
            <span className="rounded-lg bg-[var(--surface)] px-3 py-1.5 text-[13px] font-semibold text-[var(--ink)] shadow-[var(--shadow-sm)]">Ay</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setMonthOffset(monthOffset - 1)} aria-label="Önceki ay">
              <Icon name="chevronL" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setMonthOffset(monthOffset + 1)} aria-label="Sonraki ay">
              <Icon name="chevronR" />
            </Button>
            {monthOffset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => setMonthOffset(0)}>Bu ay</Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[11.5px] text-[var(--ink-3)]">Aylık ders</span>
            <b className="tnum text-base">{monthTotal.count}</b>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11.5px] text-[var(--ink-3)]">Aylık kazanç</span>
            <b className="tnum text-base text-[var(--green-ink)]">{fmtMoney(monthTotal.earn)}</b>
          </div>
        </div>
      </div>

      <Card className="p-5">
        <div className="mb-2 grid grid-cols-7 gap-2">
          {TR_DAYS_SHORT.map((d) => (
            <div key={d} className="pb-1 text-center text-[11.5px] font-semibold uppercase tracking-wide text-[var(--ink-2)]">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {grid.map((d, i) => {
            const inMonth = d.getMonth() === base.getMonth();
            const isToday = isSameDay(d, TODAY);
            const ls = (monthLessons[ymd(d)] ?? []).filter((l) => l.status !== "iptal");
            const earn = ls.reduce((a, l) => a + earnedFee(l), 0);

            if (!inMonth) return <div key={i} className="aspect-[1/0.92]" />;

            return (
              <Link
                key={i}
                href={newLessonPath(ymd(d))}
                className={`flex aspect-[1/0.92] flex-col rounded-[13px] border border-[var(--line)] bg-[var(--surface)] p-2 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow)] ${isToday ? "border-[var(--accent)] shadow-[0_0_0_1px_var(--accent)]" : ""}`}
              >
                <div className="flex justify-between">
                  <span className={`tnum text-sm font-bold ${isToday ? "text-[var(--accent-ink)]" : ""}`}>{d.getDate()}</span>
                  {isToday && (
                    <span className="rounded-full bg-[var(--sage-soft)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--sage-ink)]">
                      Bugün
                    </span>
                  )}
                </div>
                {ls.length ? (
                  <div className="mt-auto">
                    <div className="mt-1 flex gap-0.5">
                      {ls.slice(0, 5).map((l, k) => (
                        <span
                          key={k}
                          className="h-1 flex-1 rounded-sm"
                          style={{ background: l.type === "ozel" ? "var(--sage)" : "var(--plum)" }}
                        />
                      ))}
                    </div>
                    <div className="tnum mt-1 text-[12.5px] font-bold">{ls.length} ders</div>
                    {earn > 0 && <div className="tnum text-[11px] font-semibold text-[var(--green-ink)]">{fmtMoney(earn)}</div>}
                  </div>
                ) : (
                  <div className="mt-auto h-1 w-1 rounded-full bg-[var(--line)]" />
                )}
              </Link>
            );
          })}
        </div>
      </Card>
    </>
  );
}
