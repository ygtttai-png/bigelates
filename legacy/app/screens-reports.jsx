// screens-reports.jsx — Earnings report + Weekly summary (one screen, toggled)
const { useState: useSr, useMemo: useMr } = React;

function sum(arr, f) { return arr.reduce((a, l) => a + f(l), 0); }

function Reports() {
  const { lessons } = useApp();
  const { nav } = useNav();
  const [tab, setTab] = useSr(nav.params.tab || "earnings");

  return (
    <div className="screen-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">Raporlar</div>
          <h1>{tab === "earnings" ? "Kazanç Raporu" : "Haftalık Özet"}</h1>
        </div>
      </div>
      <div className="viewseg" style={{ marginBottom: 20 }}>
        <button className={tab === "earnings" ? "on" : ""} onClick={() => setTab("earnings")}><Icon name="chart" size={15} /> Kazanç</button>
        <button className={tab === "summary" ? "on" : ""} onClick={() => setTab("summary")}><Icon name="spark" size={15} /> Haftalık özet</button>
      </div>
      {tab === "earnings" ? <EarningsReport lessons={lessons} /> : <WeeklySummary lessons={lessons} />}
    </div>
  );
}

function EarningsReport({ lessons }) {
  const [period, setPeriod] = useSr("week");

  const m = useMr(() => {
    const today = lessonsOn(lessons, TODAY);
    const wkStart = startOfWeek(TODAY), wkEnd = addDays(wkStart, 6);
    const moStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    const moEnd = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0);
    const wk = lessonsInRange(lessons, wkStart, wkEnd);
    const mo = lessonsInRange(lessons, moStart, moEnd);

    // bar data
    let bars;
    if (period === "week") {
      bars = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(wkStart, i);
        const ls = lessonsOn(lessons, d);
        return { label: TR_DAYS_SHORT[i], value: sum(ls, earnedFee), highlight: isSameDay(d, TODAY), color: "var(--sage)" };
      });
    } else {
      // weeks of the month
      const weeks = [];
      let cur = startOfWeek(moStart);
      let wi = 1;
      while (cur <= moEnd) {
        const we = addDays(cur, 6);
        const ls = lessonsInRange(lessons, cur > moStart ? cur : moStart, we < moEnd ? we : moEnd);
        weeks.push({ label: wi + ". hafta", value: sum(ls, earnedFee), color: "var(--sage)", highlight: cur <= TODAY && TODAY <= we });
        cur = addDays(cur, 7); wi++;
      }
      bars = weeks;
    }

    const periodLessons = period === "week" ? wk : mo;
    const ozel = sum(periodLessons.filter((l) => l.type === "ozel"), earnedFee);
    const grup = sum(periodLessons.filter((l) => l.type === "grup"), earnedFee);

    return {
      daily: sum(today, earnedFee),
      weekly: sum(wk, earnedFee),
      monthly: sum(mo, earnedFee),
      bars, ozel, grup, total: ozel + grup,
    };
  }, [lessons, period]);

  const splitTotal = m.total || 1;

  return (
    <div>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 22 }}>
        <StatCard icon="wallet" tone="green" label="Günlük kazanç" value={fmtMoney(m.daily)} delta="bugün" deltaDir="up" />
        <StatCard icon="chart" tone="sage" label="Haftalık kazanç" value={fmtMoney(m.weekly)} delta="bu hafta" deltaDir="up" />
        <StatCard icon="card" tone="plum" label="Aylık kazanç" value={fmtMoney(m.monthly)} delta={TR_MONTHS[TODAY.getMonth()]} deltaDir="up" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 22, alignItems: "start" }} className="dash-cols">
        <Card className="card-pad">
          <div className="row between" style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 16.5 }}>Kazanç dağılımı</h3>
            <div className="viewseg">
              <button className={period === "week" ? "on" : ""} onClick={() => setPeriod("week")}>Hafta</button>
              <button className={period === "month" ? "on" : ""} onClick={() => setPeriod("month")}>Ay</button>
            </div>
          </div>
          <BarChart data={m.bars} height={210} color="var(--sage)" />
        </Card>

        <Card className="card-pad">
          <h3 style={{ fontSize: 16.5, marginBottom: 16 }}>Ders tipine göre gelir</h3>
          <div className="row" style={{ gap: 18, justifyContent: "center", marginBottom: 18 }}>
            <div style={{ position: "relative", flex: "none" }}>
              <Donut value={m.ozel} total={splitTotal} size={132} stroke={16} color="var(--sage)" track="var(--plum)" />
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
                <div><div className="faint" style={{ fontSize: 11 }}>Toplam</div><div className="tnum" style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>{fmtMoneyShort(m.total)}</div></div>
              </div>
            </div>
          </div>
          <div className="col" style={{ gap: 12 }}>
            <div className="row between">
              <span className="row" style={{ gap: 8 }}><span className="legend-dot" style={{ background: "var(--sage)" }} /> Özel ders</span>
              <span className="tnum"><b>{fmtMoney(m.ozel)}</b> <span className="faint">· {Math.round(m.ozel / splitTotal * 100)}%</span></span>
            </div>
            <div className="row between">
              <span className="row" style={{ gap: 8 }}><span className="legend-dot" style={{ background: "var(--plum)" }} /> Grup dersi</span>
              <span className="tnum"><b>{fmtMoney(m.grup)}</b> <span className="faint">· {Math.round(m.grup / splitTotal * 100)}%</span></span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function WeeklySummary({ lessons }) {
  const m = useMr(() => {
    const wkStart = startOfWeek(TODAY), wkEnd = addDays(wkStart, 6);
    const wk = lessonsInRange(lessons, wkStart, wkEnd);
    const active = wk.filter((l) => l.status !== "iptal");
    const came = wk.filter((l) => l.status === "geldi").length;
    const missed = wk.filter((l) => l.status === "gelmedi").length;
    const planned = wk.filter((l) => l.status === "planlandi").length;
    const cancelled = wk.filter((l) => l.status === "iptal").length;
    const ozel = sum(wk.filter((l) => l.type === "ozel"), earnedFee);
    const grup = sum(wk.filter((l) => l.type === "grup"), earnedFee);
    const CAP = 6 * 8; // 6 working days × 8 prime slots
    const empty = Math.max(0, CAP - active.length);
    return { wkStart, wkEnd, total: active.length, came, missed, planned, cancelled, ozel, grup, empty, occ: Math.round(active.length / CAP * 100) };
  }, [lessons]);

  const range = `${m.wkStart.getDate()} – ${m.wkEnd.getDate()} ${TR_MONTHS[m.wkEnd.getMonth()]}`;

  return (
    <div>
      <div className="row" style={{ marginBottom: 18, gap: 10, color: "var(--ink-2)" }}><Icon name="calendar" size={17} /><span style={{ fontWeight: 600 }}>{range} haftası</span></div>

      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <StatCard icon="calendar" tone="sage" label="Toplam ders" value={m.total} />
        <StatCard icon="check" tone="green" label="Gelen öğrenci" value={m.came} />
        <StatCard icon="x" tone="rose" label="Gelmeyen" value={m.missed} />
        <StatCard icon="clock" tone="gold" label="Boş saat" value={m.empty} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignItems: "start" }} className="dash-cols">
        <Card className="card-pad">
          <h3 style={{ fontSize: 16.5, marginBottom: 16 }}>Kazanç dökümü</h3>
          <div className="col" style={{ gap: 0 }}>
            <div className="kv"><span className="kv-k row" style={{ gap: 8 }}><span className="legend-dot" style={{ background: "var(--sage)" }} /> Özel ders kazancı</span><span className="kv-v tnum">{fmtMoney(m.ozel)}</span></div>
            <div className="kv"><span className="kv-k row" style={{ gap: 8 }}><span className="legend-dot" style={{ background: "var(--plum)" }} /> Grup dersi kazancı</span><span className="kv-v tnum">{fmtMoney(m.grup)}</span></div>
            <div className="kv" style={{ borderTop: "2px solid var(--line)", marginTop: 4, paddingTop: 14 }}><span className="kv-k" style={{ fontWeight: 700, color: "var(--ink)" }}>Toplam haftalık kazanç</span><span className="kv-v tnum" style={{ fontSize: 18, color: "var(--green-ink)" }}>{fmtMoney(m.ozel + m.grup)}</span></div>
          </div>
          <div className="row" style={{ height: 12, borderRadius: 6, overflow: "hidden", marginTop: 18, gap: 0 }}>
            <div style={{ width: (m.ozel / (m.ozel + m.grup || 1) * 100) + "%", background: "var(--sage)" }} />
            <div style={{ flex: 1, background: "var(--plum)" }} />
          </div>
        </Card>

        <Card className="card-pad">
          <h3 style={{ fontSize: 16.5, marginBottom: 16 }}>Katılım & doluluk</h3>
          <div className="row" style={{ gap: 20 }}>
            <div style={{ position: "relative", flex: "none" }}>
              <Donut value={m.occ} total={100} size={120} stroke={14} color="var(--accent)" track="var(--surface-3)" />
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
                <div><div className="tnum" style={{ fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{m.occ}%</div><div className="faint" style={{ fontSize: 10 }}>doluluk</div></div>
              </div>
            </div>
            <div className="col grow" style={{ gap: 10 }}>
              <div className="row between"><span className="row" style={{ gap: 8 }}><span className="legend-dot" style={{ background: "var(--green)" }} /> Gelen</span><b className="tnum">{m.came}</b></div>
              <div className="row between"><span className="row" style={{ gap: 8 }}><span className="legend-dot" style={{ background: "var(--rose)" }} /> Gelmeyen</span><b className="tnum">{m.missed}</b></div>
              <div className="row between"><span className="row" style={{ gap: 8 }}><span className="legend-dot" style={{ background: "var(--sage)" }} /> Planlı</span><b className="tnum">{m.planned}</b></div>
              <div className="row between"><span className="row" style={{ gap: 8 }}><span className="legend-dot" style={{ background: "var(--muted-ink)" }} /> İptal</span><b className="tnum">{m.cancelled}</b></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { Reports });
