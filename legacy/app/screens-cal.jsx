// screens-cal.jsx — Weekly calendar (3 view variants) + Monthly calendar
const { useState: useSc, useMemo: useMc } = React;

function CalModeToggle({ mode }) {
  const { go } = useNav();
  return (
    <div className="viewseg">
      <button className={mode === "weekly" ? "on" : ""} onClick={() => go("weekly")}>Hafta</button>
      <button className={mode === "monthly" ? "on" : ""} onClick={() => go("monthly")}>Ay</button>
    </div>
  );
}

function WeekNav({ offset, setOffset, weekStart }) {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const label = sameMonth
    ? `${weekStart.getDate()}–${end.getDate()} ${TR_MONTHS[end.getMonth()]}`
    : `${weekStart.getDate()} ${TR_MONTHS[weekStart.getMonth()].slice(0, 3)} – ${end.getDate()} ${TR_MONTHS[end.getMonth()].slice(0, 3)}`;
  return (
    <div className="row" style={{ gap: 8 }}>
      <IconButton name="chevronL" variant="outline" label="Önceki hafta" onClick={() => setOffset(offset - 1)} />
      <div style={{ minWidth: 130, textAlign: "center", fontWeight: 700, fontSize: 15 }}>{label}</div>
      <IconButton name="chevronR" variant="outline" label="Sonraki hafta" onClick={() => setOffset(offset + 1)} />
      {offset !== 0 && <Button variant="ghost" size="sm" onClick={() => setOffset(0)}>Bugün</Button>}
    </div>
  );
}

function Legend() {
  return (
    <div className="legend hide-mob">
      <span className="legend-item"><span className="legend-dot" style={{ background: "var(--sage)" }} /> Özel</span>
      <span className="legend-item"><span className="legend-dot" style={{ background: "var(--plum)" }} /> Grup</span>
    </div>
  );
}

// mini block used in column + time-grid views
function blockLabel(l) {
  const names = l.studentIds.map((id) => (studentById(id) || {}).name).filter(Boolean);
  return l.type === "grup" ? `Grup · ${names.length}` : (names[0] || "—");
}

function WeeklyCalendar() {
  const { lessons } = useApp();
  const { go } = useNav();
  const [view, setView] = useSc("columns");
  const [offset, setOffset] = useSc(0);
  const weekStart = useMc(() => addDays(startOfWeek(TODAY), offset * 7), [offset]);
  const days = useMc(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const byDay = useMc(() => days.map((d) => lessonsOn(lessons, d)), [days, lessons]);

  const open = (l) => go("editLesson", { id: l.id });

  return (
    <div className="screen-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">Haftalık takvim</div>
          <h1>Ders Takvimi</h1>
        </div>
        <div className="hide-mob"><Button variant="primary" icon="plus" onClick={() => go("addLesson")}>Ders Ekle</Button></div>
      </div>

      <div className="row between wrap" style={{ marginBottom: 18, gap: 12 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <CalModeToggle mode="weekly" />
          <WeekNav offset={offset} setOffset={setOffset} weekStart={weekStart} />
        </div>
        <div className="row" style={{ gap: 14 }}>
          <Legend />
          <div className="viewseg">
            <button className={view === "columns" ? "on" : ""} onClick={() => setView("columns")}><Icon name="grid" size={15} /><span className="hide-mob">Sütun</span></button>
            <button className={view === "timegrid" ? "on" : ""} onClick={() => setView("timegrid")}><Icon name="clock" size={15} /><span className="hide-mob">Saat</span></button>
            <button className={view === "agenda" ? "on" : ""} onClick={() => setView("agenda")}><Icon name="note" size={15} /><span className="hide-mob">Ajanda</span></button>
          </div>
        </div>
      </div>

      {view === "columns" && <ColumnsView days={days} byDay={byDay} open={open} />}
      {view === "timegrid" && <TimeGridView days={days} byDay={byDay} open={open} />}
      {view === "agenda" && <AgendaView days={days} byDay={byDay} open={open} go={go} />}
    </div>
  );
}

// ---- View 1: Columns ----
function ColumnsView({ days, byDay, open }) {
  return (
    <div className="wk-scroll">
      <div className="wk-board">
        <div className="wk-head">
          {days.map((d, i) => {
            const today = isSameDay(d, TODAY);
            return (
              <div key={i} className={`wk-daycol-head ${today ? "today" : ""}`}>
                <div className="wk-dow">{TR_DAYS_SHORT[i]}</div>
                <div className="wk-date tnum">{d.getDate()}</div>
              </div>
            );
          })}
        </div>
        <div className="wk-grid">
          {byDay.map((ls, i) => {
            const today = isSameDay(days[i], TODAY);
            return (
              <div key={i} className={`wk-col ${today ? "today" : ""}`}>
                {ls.length === 0 && <div className="wk-col-empty">—</div>}
                {ls.map((l) => (
                  <div key={l.id} className={`wk-block t-${l.type} s-${l.status}`} onClick={() => open(l)}>
                    <div className="wk-block-time tnum">{l.time}</div>
                    <div className="wk-block-name">{blockLabel(l)}</div>
                    <div className="row between" style={{ marginTop: 4 }}>
                      <span className={`ttag ${l.type}`} style={{ fontSize: 9, padding: "2px 6px" }}>{l.type === "ozel" ? "Özel" : "Grup"}</span>
                      <span className="wk-block-fee tnum" style={{ margin: 0 }}>{fmtMoneyShort(l.fee)}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- View 2: Time grid ----
function TimeGridView({ days, byDay, open }) {
  const H0 = 8, H1 = 21; // 08:00 - 21:00
  const ROW = 56;
  const hours = Array.from({ length: H1 - H0 }, (_, i) => H0 + i);
  const topFor = (time) => {
    const [h, m] = time.split(":").map(Number);
    return (h - H0) * ROW + (m / 60) * ROW;
  };
  return (
    <Card className="card-pad" style={{ overflow: "hidden" }}>
      <div className="wk-scroll">
        <div className="tg-board" style={{ display: "grid", gridTemplateColumns: "48px repeat(7, 1fr)", gap: 8 }}>
          {/* header row */}
          <div></div>
          {days.map((d, i) => {
            const today = isSameDay(d, TODAY);
            return (
              <div key={i} className={`wk-daycol-head ${today ? "today" : ""}`} style={{ marginBottom: 4 }}>
                <div className="wk-dow">{TR_DAYS_SHORT[i]}</div>
                <div className="wk-date tnum" style={{ fontSize: 16 }}>{d.getDate()}</div>
              </div>
            );
          })}
          {/* time gutter */}
          <div>
            {hours.map((h) => <div key={h} className="tg-time tnum">{String(h).padStart(2, "0")}:00</div>)}
          </div>
          {/* day columns */}
          {byDay.map((ls, di) => (
            <div key={di} style={{ position: "relative" }}>
              {hours.map((h) => <div key={h} className="tg-cell" />)}
              {ls.filter((l) => l.status !== "iptal").map((l) => (
                <div key={l.id} className={`tg-event t-${l.type} s-${l.status}`}
                  style={{ top: topFor(l.time) + 2, height: ROW - 6 }} onClick={() => open(l)}>
                  <div className="tg-event-time tnum">{l.time}</div>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{blockLabel(l)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ---- View 3: Agenda ----
function AgendaView({ days, byDay, open, go }) {
  const any = byDay.some((d) => d.length);
  if (!any) return <Card className="card-pad"><div className="empty"><div className="empty-ic"><Icon name="calendar" /></div>Bu hafta planlı ders yok.<div style={{ marginTop: 14 }}><Button variant="primary" icon="plus" onClick={() => go("addLesson")}>Ders ekle</Button></div></div></Card>;
  return (
    <Card className="card-pad">
      {days.map((d, i) => {
        const ls = byDay[i];
        if (!ls.length) return null;
        const earned = ls.reduce((a, l) => a + earnedFee(l), 0);
        const today = isSameDay(d, TODAY);
        return (
          <div className="agenda-day" key={i}>
            <div className="agenda-dayhead" style={{ background: "var(--surface)" }}>
              <span className="agenda-dayname" style={today ? { color: "var(--accent-ink)" } : {}}>{TR_DAYS[i]}</span>
              <span className="agenda-daydate tnum">{d.getDate()} {TR_MONTHS[d.getMonth()].slice(0, 3)}{today ? " · Bugün" : ""}</span>
              <span className="agenda-daytot tnum">{earned ? fmtMoney(earned) : ""}</span>
            </div>
            <div className="col" style={{ gap: 8 }}>
              {ls.map((l) => <LessonRow key={l.id} lesson={l} onOpen={() => open(l)} />)}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

// ---------- Monthly ----------
function MonthlyCalendar() {
  const { lessons } = useApp();
  const { go } = useNav();
  const [monthOffset, setMonthOffset] = useSc(0);
  const base = useMc(() => new Date(TODAY.getFullYear(), TODAY.getMonth() + monthOffset, 1), [monthOffset]);
  const grid = useMc(() => {
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const startPad = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -startPad);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [base]);

  const monthLessons = useMc(() => {
    const map = {};
    lessons.forEach((l) => { (map[l.date] = map[l.date] || []).push(l); });
    return map;
  }, [lessons]);

  const monthTotal = useMc(() => {
    const ms = new Date(base.getFullYear(), base.getMonth(), 1), me = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const inM = lessonsInRange(lessons, ms, me);
    return { earn: inM.reduce((a, l) => a + earnedFee(l), 0), count: inM.filter((l) => l.status !== "iptal").length };
  }, [base, lessons]);

  return (
    <div className="screen-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">Aylık takvim</div>
          <h1>{TR_MONTHS[base.getMonth()]} {base.getFullYear()}</h1>
        </div>
        <div className="hide-mob"><Button variant="primary" icon="plus" onClick={() => go("addLesson")}>Ders Ekle</Button></div>
      </div>

      <div className="row between wrap" style={{ marginBottom: 18, gap: 12 }}>
        <div className="row wrap" style={{ gap: 12 }}>
          <CalModeToggle mode="monthly" />
          <div className="row" style={{ gap: 8 }}>
            <IconButton name="chevronL" variant="outline" label="Önceki ay" onClick={() => setMonthOffset(monthOffset - 1)} />
            <IconButton name="chevronR" variant="outline" label="Sonraki ay" onClick={() => setMonthOffset(monthOffset + 1)} />
            {monthOffset !== 0 && <Button variant="ghost" size="sm" onClick={() => setMonthOffset(0)}>Bu ay</Button>}
          </div>
        </div>
        <div className="row" style={{ gap: 18 }}>
          <div className="col" style={{ alignItems: "flex-end" }}><span className="faint" style={{ fontSize: 11.5 }}>Aylık ders</span><b className="tnum" style={{ fontSize: 16 }}>{monthTotal.count}</b></div>
          <div className="col" style={{ alignItems: "flex-end" }}><span className="faint" style={{ fontSize: 11.5 }}>Aylık kazanç</span><b className="tnum" style={{ fontSize: 16, color: "var(--green-ink)" }}>{fmtMoney(monthTotal.earn)}</b></div>
        </div>
      </div>

      <Card className="card-pad">
        <div className="mo-grid" style={{ marginBottom: 8 }}>
          {TR_DAYS_SHORT.map((d) => <div key={d} className="mo-dowhead">{d}</div>)}
        </div>
        <div className="mo-grid">
          {grid.map((d, i) => {
            const inMonth = d.getMonth() === base.getMonth();
            const today = isSameDay(d, TODAY);
            const ls = (monthLessons[ymd(d)] || []).filter((l) => l.status !== "iptal");
            const earn = ls.reduce((a, l) => a + earnedFee(l), 0);
            if (!inMonth) return <div key={i} className="mo-cell out" />;
            return (
              <div key={i} className={`mo-cell ${today ? "today" : ""}`} onClick={() => ls.length && go("weekly")}>
                <div className="row between">
                  <span className="mo-date tnum">{d.getDate()}</span>
                  {today && <span className="badge badge-soft badge-sage badge-nodot" style={{ fontSize: 9, padding: "2px 6px" }}>Bugün</span>}
                </div>
                {ls.length ? (
                  <div className="mo-count">
                    <div className="mo-bars">
                      {ls.slice(0, 5).map((l, k) => <span key={k} className="mo-bar" style={{ background: l.type === "ozel" ? "var(--sage)" : "var(--plum)" }} />)}
                    </div>
                    <div className="row between" style={{ marginTop: 5 }}>
                      <span className="mo-count-n tnum">{ls.length} ders</span>
                    </div>
                    {earn > 0 && <div className="mo-earn tnum">{fmtMoney(earn)}</div>}
                  </div>
                ) : (
                  <div className="mo-empty-dot" />
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { WeeklyCalendar, MonthlyCalendar });
