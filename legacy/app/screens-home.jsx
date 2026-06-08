// screens-home.jsx — Login, Dashboard, shared LessonRow
const { useState: useS1, useMemo: useM1 } = React;

// ---------- shared lesson row with quick actions ----------
function LessonRow({ lesson, onOpen, compact }) {
  const { actions } = useApp();
  const toast = useToast();
  const names = lesson.studentIds.map((id) => (studentById(id) || {}).name).filter(Boolean);
  const title = lesson.type === "grup"
    ? `Grup dersi · ${names.length} kişi`
    : names[0] || "—";
  const sub = lesson.type === "grup" ? names.join(", ") : (studentById(lesson.studentIds[0]) || {}).phone;

  const mark = (e, status) => {
    e.stopPropagation();
    actions.setStatus(lesson.id, status);
    toast(status === "geldi" ? "Ders tamamlandı · Geldi olarak işaretlendi" : "Gelmedi olarak işaretlendi", { tone: status === "geldi" ? "green" : "rose", icon: status === "geldi" ? "check" : "x" });
  };

  return (
    <div className={`lesson t-${lesson.type} ${lesson.status === "geldi" ? "done" : ""} ${lesson.status === "iptal" ? "cancelled" : ""} ${onOpen ? "lesson-hover" : ""}`} onClick={onOpen}>
      <div className="lesson-time tnum">{lesson.time}</div>
      {lesson.type === "grup"
        ? <AvatarStack ids={lesson.studentIds} size={34} />
        : <Avatar student={studentById(lesson.studentIds[0]) || { initials: "?", color: "#999" }} size={38} />}
      <div className="lesson-main">
        <div className="row gap-sm" style={{ gap: 8 }}>
          <span className="lesson-name">{title}</span>
          <span className={`ttag ${lesson.type}`}>{lesson.type === "ozel" ? "Özel" : "Grup"}</span>
        </div>
        <div className="lesson-meta">
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{sub}</span>
        </div>
      </div>
      <div className="row" style={{ gap: 10 }}>
        <span className="tnum" style={{ fontWeight: 700, fontSize: 14 }}>{fmtMoney(lesson.fee)}</span>
        {lesson.status === "planlandi" && !compact ? (
          <div className="row" style={{ gap: 6 }}>
            <button className="icon-btn icon-btn-outline" style={{ width: 34, height: 34, color: "var(--green-ink)" }} title="Geldi" onClick={(e) => mark(e, "geldi")}><Icon name="check" size={17} stroke={2.2} /></button>
            <button className="icon-btn icon-btn-outline" style={{ width: 34, height: 34, color: "var(--rose-ink)" }} title="Gelmedi" onClick={(e) => mark(e, "gelmedi")}><Icon name="x" size={17} stroke={2.2} /></button>
          </div>
        ) : (
          <StatusPill status={lesson.status} size="sm" />
        )}
      </div>
    </div>
  );
}

// ---------- Login ----------
function LoginScreen() {
  const { setLoggedIn } = useApp();
  const [email, setEmail] = useS1("bige@bigelates.com");
  const [pass, setPass] = useS1("••••••••");
  const [remember, setRemember] = useS1(true);
  const [busy, setBusy] = useS1(false);

  const submit = (e) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => setLoggedIn(true), 550);
  };

  return (
    <div className="login">
      <div className="login-art">
        <div className="login-orb" style={{ width: 320, height: 320, top: -80, right: -60 }} />
        <div className="login-orb" style={{ width: 200, height: 200, bottom: 80, left: -50 }} />
        <div className="login-orb" style={{ width: 120, height: 120, top: "40%", right: "30%", background: "rgba(255,255,255,.05)" }} />
        <div className="row" style={{ gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(255,255,255,.16)", display: "grid", placeItems: "center", position: "relative" }}>
            <span style={{ width: 13, height: 13, border: "2.2px solid #fff", borderRadius: "50%" }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: "-.03em" }}>Bigelates</span>
        </div>
        <div className="login-art-quote">Her ders, dengeyi yeniden bulmak için bir nefes. Stüdyonu tek ekrandan yönet.</div>
        <div className="login-art-cite">Bige Pilates Studio · Eğitmen Paneli</div>
      </div>

      <div className="login-form-wrap">
        <form className="login-card" onSubmit={submit}>
          <div className="login-logo" />
          <h1 style={{ fontSize: 26 }}>Tekrar hoş geldin</h1>
          <p className="muted" style={{ marginTop: 6, marginBottom: 26 }}>Devam etmek için hesabına giriş yap.</p>

          <div className="field">
            <label>E-posta</label>
            <div className="input-icon-wrap">
              <Icon name="user" size={17} />
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@bigelates.com" />
            </div>
          </div>
          <div className="field">
            <label>Şifre</label>
            <div className="input-icon-wrap">
              <Icon name="eye" size={17} />
              <input className="input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
            </div>
          </div>
          <div className="row between" style={{ marginBottom: 22 }}>
            <label className="checkbox"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Beni hatırla</label>
            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "var(--accent-ink)", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>Şifremi unuttum</a>
          </div>
          <Button variant="primary" size="lg" full type="submit" disabled={busy}>{busy ? "Giriş yapılıyor…" : "Giriş yap"}</Button>
          <p className="faint" style={{ textAlign: "center", marginTop: 20, fontSize: 13 }}>Demo · giriş bilgileri hazır, sadece tıkla</p>
        </form>
      </div>
    </div>
  );
}

// ---------- Dashboard ----------
function StatCard({ icon, tone, label, value, delta, deltaDir }) {
  const toneMap = { sage: ["var(--sage-soft)", "var(--sage-ink)"], green: ["var(--green-soft)", "var(--green-ink)"], rose: ["var(--rose-soft)", "var(--rose-ink)"], plum: ["var(--plum-soft)", "var(--plum-ink)"], gold: ["color-mix(in oklab, var(--gold) 16%, transparent)", "var(--gold)"] };
  const [bg, fg] = toneMap[tone] || toneMap.sage;
  return (
    <Card className="stat">
      <div className="stat-ic" style={{ background: bg, color: fg }}><Icon name={icon} size={19} /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-val tnum">{value}</div>
      {delta && <div className={`stat-delta ${deltaDir}`}><Icon name={deltaDir === "up" ? "arrowUR" : "arrowDR"} size={13} stroke={2.2} />{delta}</div>}
    </Card>
  );
}

function Dashboard() {
  const { lessons } = useApp();
  const { go } = useNav();

  const m = useM1(() => {
    const todays = lessonsOn(lessons, TODAY);
    const wkStart = startOfWeek(TODAY), wkEnd = addDays(wkStart, 6);
    const moStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    const moEnd = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0);
    const wk = lessonsInRange(lessons, wkStart, wkEnd);
    const mo = lessonsInRange(lessons, moStart, moEnd);
    const sum = (arr, f) => arr.reduce((a, l) => a + f(l), 0);
    const busyToday = todays.filter((l) => l.status !== "iptal").length;
    const WORK_SLOTS = 12; // 08:00-20:00
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
      wkTotal: wk.filter((l) => l.status !== "iptal").length,
    };
  }, [lessons]);

  const attended = m.came, missed = m.missed, total = m.came + m.missed || 1;

  return (
    <div className="screen-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">{TR_DAYS[dowIndex(TODAY)]}, {TODAY.getDate()} {TR_MONTHS[TODAY.getMonth()]} {TODAY.getFullYear()}</div>
          <h1>Günaydın, Bige 🌿</h1>
        </div>
        <div className="hide-mob"><Button variant="primary" icon="plus" onClick={() => go("addLesson")}>Ders Ekle</Button></div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <StatCard icon="wallet" tone="green" label="Günlük kazanç" value={fmtMoney(m.daily)} delta={m.dailyExpected > m.daily ? `+${fmtMoney(m.dailyExpected - m.daily)} beklenen` : "bugün"} deltaDir="up" />
        <StatCard icon="chart" tone="sage" label="Haftalık kazanç" value={fmtMoney(m.weekly)} delta="bu hafta" deltaDir="up" />
        <StatCard icon="card" tone="plum" label="Aylık kazanç" value={fmtMoney(m.monthly)} delta={TR_MONTHS[TODAY.getMonth()]} deltaDir="up" />
        <StatCard icon="clock" tone="gold" label="Bugün boş saat" value={m.empty + " saat"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 22, alignItems: "start" }} className="dash-cols">
        <div>
          <SectionTitle action={<button className="btn btn-ghost btn-sm" onClick={() => go("weekly")}>Takvime git <Icon name="chevronR" size={15} /></button>}>Bugünkü dersler</SectionTitle>
          <div className="col" style={{ gap: 9 }}>
            {m.todays.length === 0 && (
              <Card className="card-pad"><div className="empty"><div className="empty-ic"><Icon name="calendar" /></div>Bugün planlı ders yok.</div></Card>
            )}
            {m.todays.map((l) => <LessonRow key={l.id} lesson={l} onOpen={() => go("editLesson", { id: l.id })} />)}
          </div>
        </div>

        <div className="col" style={{ gap: 22 }}>
          <Card className="card-pad">
            <SectionTitle>Bu hafta katılım</SectionTitle>
            <div className="row" style={{ gap: 18 }}>
              <div style={{ position: "relative", flex: "none" }}>
                <Donut value={attended} total={total} size={118} stroke={13} color="var(--green)" track="var(--surface-3)" />
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
                  <div>
                    <div className="tnum" style={{ fontWeight: 800, fontSize: 24, lineHeight: 1 }}>{Math.round((attended / total) * 100)}%</div>
                    <div className="faint" style={{ fontSize: 11 }}>katılım</div>
                  </div>
                </div>
              </div>
              <div className="col grow" style={{ gap: 12 }}>
                <div className="row between"><span className="row" style={{ gap: 8 }}><span className="legend-dot" style={{ background: "var(--green)" }} /> Gelen</span><b className="tnum">{attended}</b></div>
                <div className="row between"><span className="row" style={{ gap: 8 }}><span className="legend-dot" style={{ background: "var(--rose)" }} /> Gelmeyen</span><b className="tnum">{missed}</b></div>
                <div className="row between"><span className="row" style={{ gap: 8 }}><span className="legend-dot" style={{ background: "var(--sage)" }} /> Planlı</span><b className="tnum">{m.planned}</b></div>
              </div>
            </div>
          </Card>

          <Card className="card-pad">
            <SectionTitle>Hızlı işlem</SectionTitle>
            <div className="col" style={{ gap: 9 }}>
              <Button variant="secondary" full icon="plus" onClick={() => go("addLesson")} style={{ justifyContent: "flex-start" }}>Yeni ders ekle</Button>
              <Button variant="secondary" full icon="users" onClick={() => go("students")} style={{ justifyContent: "flex-start" }}>Öğrencileri görüntüle</Button>
              <Button variant="secondary" full icon="chart" onClick={() => go("reports")} style={{ justifyContent: "flex-start" }}>Kazanç raporu</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, Dashboard, LessonRow, StatCard });
