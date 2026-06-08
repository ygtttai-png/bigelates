"use client";

import { useMemo, useState } from "react";
import { StatCard } from "@/components/features/dashboard/stat-card";
import { BarChart } from "@/components/ui/bar-chart";
import { Card } from "@/components/ui/card";
import { Donut } from "@/components/ui/donut";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { useApp } from "@/components/providers/app-provider";
import { fmtMoney, fmtMoneyShort } from "@/utils/currency";
import { TR_DAYS_SHORT, TR_MONTHS, addDays, isSameDay, startOfWeek, today } from "@/utils/date";
import { earnedFee, lessonsInRange, lessonsOn } from "@/utils/lessons";

function sum(arr: ReturnType<typeof useApp>["lessons"], f: (l: (typeof arr)[number]) => number) {
  return arr.reduce((a, l) => a + f(l), 0);
}

export function ReportsView() {
  const { lessons, loading } = useApp();
  const [tab, setTab] = useState<"earnings" | "summary">("earnings");

  if (loading) return <LoadingState />;

  return (
    <>
      <PageHeader
        eyebrow="Raporlar"
        title={tab === "earnings" ? "Kazanç Raporu" : "Haftalık Özet"}
      />
      <div className="mb-5 inline-flex gap-0.5 rounded-[11px] border border-[var(--line)] bg-[var(--surface-2)] p-0.5">
        {(
          [
            ["earnings", "Kazanç", "chart"],
            ["summary", "Haftalık özet", "spark"],
          ] as const
        ).map(([k, l, icon]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${tab === k ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)]" : "text-[var(--ink-2)]"}`}
          >
            <Icon name={icon} size={15} />
            {l}
          </button>
        ))}
      </div>
      {tab === "earnings" ? <EarningsReport lessons={lessons} /> : <WeeklySummary lessons={lessons} />}
    </>
  );
}

function EarningsReport({ lessons }: { lessons: ReturnType<typeof useApp>["lessons"] }) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const TODAY = today();

  const m = useMemo(() => {
    const todayLessons = lessonsOn(lessons, TODAY);
    const wkStart = startOfWeek(TODAY);
    const wkEnd = addDays(wkStart, 6);
    const moStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    const moEnd = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0);
    const wk = lessonsInRange(lessons, wkStart, wkEnd);
    const mo = lessonsInRange(lessons, moStart, moEnd);

    let bars;
    if (period === "week") {
      bars = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(wkStart, i);
        const ls = lessonsOn(lessons, d);
        return {
          label: TR_DAYS_SHORT[i]!,
          value: sum(ls, earnedFee),
          highlight: isSameDay(d, TODAY),
          color: "var(--sage)",
        };
      });
    } else {
      const weeks = [];
      let cur = startOfWeek(moStart);
      let wi = 1;
      while (cur <= moEnd) {
        const we = addDays(cur, 6);
        const ls = lessonsInRange(lessons, cur > moStart ? cur : moStart, we < moEnd ? we : moEnd);
        weeks.push({
          label: `${wi}. hafta`,
          value: sum(ls, earnedFee),
          color: "var(--sage)",
          highlight: cur <= TODAY && TODAY <= we,
        });
        cur = addDays(cur, 7);
        wi++;
      }
      bars = weeks;
    }

    const periodLessons = period === "week" ? wk : mo;
    const ozel = sum(periodLessons.filter((l) => l.type === "ozel"), earnedFee);
    const grup = sum(periodLessons.filter((l) => l.type === "grup"), earnedFee);

    return {
      daily: sum(todayLessons, earnedFee),
      weekly: sum(wk, earnedFee),
      monthly: sum(mo, earnedFee),
      bars,
      ozel,
      grup,
      total: ozel + grup,
    };
  }, [lessons, period, TODAY]);

  const splitTotal = m.total || 1;

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
        <StatCard icon="wallet" tone="green" label="Günlük kazanç" value={fmtMoney(m.daily)} delta="bugün" deltaDir="up" />
        <StatCard icon="chart" tone="sage" label="Haftalık kazanç" value={fmtMoney(m.weekly)} delta="bu hafta" deltaDir="up" />
        <StatCard icon="card" tone="plum" label="Aylık kazanç" value={fmtMoney(m.monthly)} delta={TR_MONTHS[TODAY.getMonth()]} deltaDir="up" />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.7fr_1fr] lg:gap-[22px]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[16.5px] font-bold">Kazanç dağılımı</h3>
            <div className="inline-flex gap-0.5 rounded-[11px] border border-[var(--line)] bg-[var(--surface-2)] p-0.5">
              {(["week", "month"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${period === p ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-sm)]" : "text-[var(--ink-2)]"}`}
                >
                  {p === "week" ? "Hafta" : "Ay"}
                </button>
              ))}
            </div>
          </div>
          <BarChart data={m.bars} height={210} color="var(--sage)" />
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-[16.5px] font-bold">Ders tipine göre gelir</h3>
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <Donut value={m.ozel} total={splitTotal} size={132} stroke={16} color="var(--sage)" track="var(--plum)" />
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="text-[11px] text-[var(--ink-3)]">Toplam</div>
                  <div className="tnum text-lg font-extrabold leading-tight">{fmtMoneyShort(m.total)}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-[var(--sage)]" /> Özel ders</span>
              <span className="tnum"><b>{fmtMoney(m.ozel)}</b> <span className="text-[var(--ink-3)]">· {Math.round((m.ozel / splitTotal) * 100)}%</span></span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-[var(--plum)]" /> Grup dersi</span>
              <span className="tnum"><b>{fmtMoney(m.grup)}</b> <span className="text-[var(--ink-3)]">· {Math.round((m.grup / splitTotal) * 100)}%</span></span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function WeeklySummary({ lessons }: { lessons: ReturnType<typeof useApp>["lessons"] }) {
  const TODAY = today();

  const m = useMemo(() => {
    const wkStart = startOfWeek(TODAY);
    const wkEnd = addDays(wkStart, 6);
    const wk = lessonsInRange(lessons, wkStart, wkEnd);
    const active = wk.filter((l) => l.status !== "iptal");
    const came = wk.filter((l) => l.status === "geldi").length;
    const missed = wk.filter((l) => l.status === "gelmedi").length;
    const planned = wk.filter((l) => l.status === "planlandi").length;
    const cancelled = wk.filter((l) => l.status === "iptal").length;
    const ozel = sum(wk.filter((l) => l.type === "ozel"), earnedFee);
    const grup = sum(wk.filter((l) => l.type === "grup"), earnedFee);
    const CAP = 6 * 8;
    const empty = Math.max(0, CAP - active.length);
    return { wkStart, wkEnd, total: active.length, came, missed, planned, cancelled, ozel, grup, empty, occ: Math.round((active.length / CAP) * 100) };
  }, [lessons, TODAY]);

  const range = `${m.wkStart.getDate()} – ${m.wkEnd.getDate()} ${TR_MONTHS[m.wkEnd.getMonth()]}`;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5 text-[var(--ink-2)]">
        <Icon name="calendar" size={17} />
        <span className="font-semibold">{range} haftası</span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="calendar" tone="sage" label="Toplam ders" value={String(m.total)} />
        <StatCard icon="check" tone="green" label="Gelen öğrenci" value={String(m.came)} />
        <StatCard icon="x" tone="rose" label="Gelmeyen" value={String(m.missed)} />
        <StatCard icon="clock" tone="gold" label="Boş saat" value={String(m.empty)} />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-[22px]">
        <Card className="p-5">
          <h3 className="mb-4 text-[16.5px] font-bold">Kazanç dökümü</h3>
          <Kv k="Özel ders kazancı" v={fmtMoney(m.ozel)} dot="var(--sage)" />
          <Kv k="Grup dersi kazancı" v={fmtMoney(m.grup)} dot="var(--plum)" />
          <div className="mt-1 flex justify-between border-t-2 border-[var(--line)] pt-3.5">
            <span className="font-bold text-[var(--ink)]">Toplam haftalık kazanç</span>
            <span className="tnum text-lg font-bold text-[var(--green-ink)]">{fmtMoney(m.ozel + m.grup)}</span>
          </div>
          <div className="mt-4 flex h-3 overflow-hidden rounded-md">
            <div style={{ width: `${(m.ozel / (m.ozel + m.grup || 1)) * 100}%`, background: "var(--sage)" }} />
            <div className="flex-1 bg-[var(--plum)]" />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-[16.5px] font-bold">Katılım & doluluk</h3>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <Donut value={m.occ} total={100} size={120} stroke={14} color="var(--accent)" track="var(--surface-3)" />
              <div className="absolute inset-0 grid place-items-center text-center">
                <div className="tnum text-[22px] font-extrabold leading-none">{m.occ}%</div>
                <div className="text-[10px] text-[var(--ink-3)]">doluluk</div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2.5">
              <Row label="Gelen" value={m.came} color="var(--green)" />
              <Row label="Gelmeyen" value={m.missed} color="var(--rose)" />
              <Row label="Planlı" value={m.planned} color="var(--sage)" />
              <Row label="İptal" value={m.cancelled} color="var(--muted-ink)" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kv({ k, v, dot }: { k: string; v: string; dot: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--line-2)] py-2.5 text-sm">
      <span className="flex items-center gap-2 text-[var(--ink-2)]">
        <span className="h-2.5 w-2.5 rounded" style={{ background: dot }} />
        {k}
      </span>
      <span className="tnum font-semibold">{v}</span>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex justify-between">
      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded" style={{ background: color }} /> {label}</span>
      <b className="tnum">{value}</b>
    </div>
  );
}
