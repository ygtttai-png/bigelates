"use client";

import Link from "next/link";
import { useMemo } from "react";
import { StatCard } from "@/components/features/dashboard/stat-card";
import { LessonRow } from "@/components/features/lessons/lesson-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Donut } from "@/components/ui/donut";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { useApp } from "@/components/providers/app-provider";
import { fmtMoney } from "@/utils/currency";
import { TR_DAYS, TR_MONTHS, addDays, dowIndex, startOfWeek, today } from "@/utils/date";
import {
  earnedFee,
  expectedFee,
  lessonsInRange,
  lessonsOn,
} from "@/utils/lessons";

export function DashboardView() {
  const { lessons, profile, loading, error } = useApp();
  const TODAY = today();

  const m = useMemo(() => {
    const todays = lessonsOn(lessons, TODAY);
    const wkStart = startOfWeek(TODAY);
    const wkEnd = addDays(wkStart, 6);
    const moStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    const moEnd = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0);
    const wk = lessonsInRange(lessons, wkStart, wkEnd);
    const mo = lessonsInRange(lessons, moStart, moEnd);
    const sum = (arr: typeof lessons, f: (l: (typeof lessons)[number]) => number) =>
      arr.reduce((a, l) => a + f(l), 0);
    const busyToday = todays.filter((l) => l.status !== "iptal").length;
    const WORK_SLOTS = 12;
    return {
      todays,
      daily: sum(todays, earnedFee),
      dailyExpected: sum(todays, expectedFee),
      weekly: sum(wk, earnedFee),
      monthly: sum(mo, earnedFee),
      empty: Math.max(0, WORK_SLOTS - busyToday),
      came: wk.filter((l) => l.status === "geldi").length,
      missed: wk.filter((l) => l.status === "gelmedi").length,
      planned: wk.filter((l) => l.status === "planlandi").length,
    };
  }, [lessons, TODAY]);

  if (loading) return <LoadingState />;
  if (error) {
    return (
      <EmptyState icon="x" message={error}>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Yeniden dene
        </Button>
      </EmptyState>
    );
  }

  const attended = m.came;
  const missed = m.missed;
  const total = m.came + m.missed || 1;
  const firstName = profile?.full_name?.split(" ")[0] ?? "Bige";

  return (
    <>
      <PageHeader
        eyebrow={`${TR_DAYS[dowIndex(TODAY)]}, ${TODAY.getDate()} ${TR_MONTHS[TODAY.getMonth()]} ${TODAY.getFullYear()}`}
        title={`Günaydın, ${firstName} 🌿`}
        action={
          <Button asChild className="hidden lg:inline-flex">
            <Link href="/lessons/new">
              <Icon name="plus" size={18} />
              Ders Ekle
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard icon="wallet" tone="green" label="Günlük kazanç" value={fmtMoney(m.daily)} delta={m.dailyExpected > m.daily ? `+${fmtMoney(m.dailyExpected - m.daily)} beklenen` : "bugün"} deltaDir="up" />
        <StatCard icon="chart" tone="sage" label="Haftalık kazanç" value={fmtMoney(m.weekly)} delta="bu hafta" deltaDir="up" />
        <StatCard icon="card" tone="plum" label="Aylık kazanç" value={fmtMoney(m.monthly)} delta={TR_MONTHS[TODAY.getMonth()]} deltaDir="up" />
        <StatCard icon="clock" tone="gold" label="Bugün boş saat" value={`${m.empty} saat`} />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr] lg:gap-[22px]">
        <div>
          <div className="mb-3.5 flex items-center justify-between px-0.5">
            <h3 className="text-[16.5px] font-bold">Bugünkü dersler</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar/weekly">
                Takvime git <Icon name="chevronR" size={15} />
              </Link>
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {m.todays.length === 0 ? (
              <Card className="p-5">
                <EmptyState icon="calendar" message="Bugün planlı ders yok." />
              </Card>
            ) : (
              m.todays.map((l) => <LessonRow key={l.id} lesson={l} />)
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:gap-[22px]">
          <Card className="p-5">
            <h3 className="mb-3.5 text-[16.5px] font-bold">Bu hafta katılım</h3>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Donut value={attended} total={total} size={118} stroke={13} color="var(--green)" track="var(--surface-3)" />
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <div className="tnum text-2xl font-extrabold leading-none">
                      {Math.round((attended / total) * 100)}%
                    </div>
                    <div className="text-[11px] text-[var(--ink-3)]">katılım</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-[var(--green)]" /> Gelen</span><b className="tnum">{attended}</b></div>
                <div className="flex justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-[var(--rose)]" /> Gelmeyen</span><b className="tnum">{missed}</b></div>
                <div className="flex justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-[var(--sage)]" /> Planlı</span><b className="tnum">{m.planned}</b></div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3.5 text-[16.5px] font-bold">Hızlı işlem</h3>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" full asChild className="justify-start">
                <Link href="/lessons/new"><Icon name="plus" /> Yeni ders ekle</Link>
              </Button>
              <Button variant="secondary" full asChild className="justify-start">
                <Link href="/students"><Icon name="users" /> Öğrencileri görüntüle</Link>
              </Button>
              <Button variant="secondary" full asChild className="justify-start">
                <Link href="/reports"><Icon name="chart" /> Kazanç raporu</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
