// screens-students.jsx — Student list + detail
const { useState: useSs, useMemo: useMs } = React;

function studentStats(lessons, id) {
  const mine = lessons.filter((l) => l.studentIds.includes(id));
  return {
    attended: mine.filter((l) => l.status === "geldi").length,
    missed: mine.filter((l) => l.status === "gelmedi").length,
    upcoming: mine.filter((l) => l.status === "planlandi").length,
    all: mine.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
  };
}

const PAY_LABEL = { odendi: "Ödendi", bekliyor: "Bekliyor" };

function StudentsList() {
  const { students, lessons } = useApp();
  const { go } = useNav();
  const [q, setQ] = useSs("");
  const [filter, setFilter] = useSs("all");

  const rows = useMs(() => students
    .filter((s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.phone.includes(q))
    .filter((s) => filter === "all" || (filter === "ozel" && s.type === "ozel") || (filter === "grup" && s.type === "grup") || (filter === "bekliyor" && s.paymentStatus === "bekliyor"))
    .map((s) => ({ s, st: studentStats(lessons, s.id) })), [students, lessons, q, filter]);

  const pending = students.filter((s) => s.paymentStatus === "bekliyor").length;

  return (
    <div className="screen-enter">
      <div className="page-head">
        <div>
          <div className="eyebrow">{students.length} öğrenci · {pending} ödeme bekliyor</div>
          <h1>Öğrenciler</h1>
        </div>
        <div className="hide-mob"><Button variant="primary" icon="plus" onClick={() => go("addLesson")}>Ders Ekle</Button></div>
      </div>

      <div className="row between wrap" style={{ gap: 12, marginBottom: 16 }}>
        <div className="input-icon-wrap" style={{ flex: 1, minWidth: 220, maxWidth: 360 }}>
          <Icon name="search" size={16} />
          <input className="input" placeholder="İsim veya telefon ara…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="row wrap" style={{ gap: 7 }}>
          {[["all", "Tümü"], ["ozel", "Özel"], ["grup", "Grup"], ["bekliyor", "Ödeme bekleyen"]].map(([k, l]) => (
            <button key={k} className={`chip ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>

      <Card style={{ overflow: "hidden" }}>
        <div className="list-head hide-mob">
          <span className="stu-th" style={{ padding: 0 }}>Öğrenci</span>
          <span className="stu-th" style={{ padding: 0 }}>Ders tipi</span>
          <span className="stu-th" style={{ padding: 0 }}>Kalan paket</span>
          <span className="stu-th" style={{ padding: 0 }}>Ödeme</span>
          <span></span>
        </div>
        {rows.map(({ s, st }) => (
          <div className="stu-row" key={s.id} onClick={() => go("studentDetail", { id: s.id })}>
            <div className="stu-id">
              <Avatar student={s} size={42} />
              <div style={{ minWidth: 0 }}>
                <div className="stu-name">{s.name}</div>
                <div className="stu-phone tnum">{s.phone}</div>
              </div>
            </div>
            <div className="hide-mob"><span className={`ttag ${s.type}`}>{s.type === "ozel" ? "Özel" : "Grup"}</span></div>
            <div className="hide-mob" style={{ maxWidth: 130 }}>
              <div className="row between" style={{ marginBottom: 5, fontSize: 12.5 }}><span className="tnum" style={{ fontWeight: 600 }}>{s.remaining}/{s.packageTotal}</span><span className="faint">kaldı</span></div>
              <div className="pbar"><div style={{ width: (s.remaining / s.packageTotal * 100) + "%", background: s.remaining <= 2 ? "var(--rose)" : "var(--accent)" }} /></div>
            </div>
            <div className="hide-mob"><Badge tone={s.paymentStatus === "odendi" ? "green" : "gold"} size="sm">{PAY_LABEL[s.paymentStatus]}</Badge></div>
            <div className="row" style={{ gap: 6 }}>
              <span className="hide-desk"><Badge tone={s.paymentStatus === "odendi" ? "green" : "gold"} size="sm">{s.remaining} ders</Badge></span>
              <Icon name="chevronR" size={18} style={{ color: "var(--ink-3)" }} />
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="empty"><div className="empty-ic"><Icon name="users" /></div>Sonuç bulunamadı.</div>}
      </Card>
    </div>
  );
}

// mock payment history
function paymentHistory(s) {
  const base = parseYmd(s.joinDate);
  const out = [];
  const n = s.type === "grup" ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const d = addDays(base, i * 35);
    out.push({ date: ymd(d), amount: (s.type === "ozel" ? PRICE_OZEL : PRICE_GRUP) * (s.type === "ozel" ? 8 : 12), pkg: (s.type === "ozel" ? "8 ders özel paket" : "12 ders grup paket"), status: "odendi" });
  }
  if (s.paymentStatus === "bekliyor") out.unshift({ date: ymd(TODAY), amount: (s.type === "ozel" ? PRICE_OZEL * 8 : PRICE_GRUP * 12), pkg: "Yeni paket", status: "bekliyor" });
  return out;
}

function StudentDetail() {
  const { students, lessons } = useApp();
  const { nav, go } = useNav();
  const toast = useToast();
  const s = students.find((x) => x.id === nav.params.id);
  const [tab, setTab] = useSs("lessons");
  if (!s) return <div className="screen-enter">Öğrenci bulunamadı.</div>;
  const st = studentStats(lessons, s.id);
  const pays = paymentHistory(s);

  return (
    <div className="screen-enter">
      <div className="page-head">
        <div className="row" style={{ gap: 12 }}>
          <IconButton name="chevronL" variant="outline" label="Geri" onClick={() => go("students")} />
          <div className="row" style={{ gap: 14 }}>
            <Avatar student={s} size={52} />
            <div>
              <h1 style={{ fontSize: 24 }}>{s.name}</h1>
              <div className="row" style={{ gap: 8, marginTop: 3 }}>
                <span className={`ttag ${s.type}`}>{s.type === "ozel" ? "Özel" : "Grup"}</span>
                <span className="muted tnum" style={{ fontSize: 13 }}>{s.phone}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hide-mob row" style={{ gap: 8 }}>
          <Button variant="secondary" icon="phone" onClick={() => toast("Arama başlatılıyor…", { tone: "sage", icon: "phone" })}>Ara</Button>
          <Button variant="primary" icon="plus" onClick={() => go("addLesson")}>Ders ekle</Button>
        </div>
      </div>

      <div className="detail-grid">
        {/* left */}
        <div className="col" style={{ gap: 18 }}>
          <Card className="card-pad">
            <div className="row between" style={{ marginBottom: 14 }}>
              <span className="faint" style={{ fontSize: 12.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Kalan ders hakkı</span>
            </div>
            <div className="row" style={{ gap: 16 }}>
              <div style={{ position: "relative", flex: "none" }}>
                <Donut value={s.remaining} total={s.packageTotal} size={104} stroke={12} color={s.remaining <= 2 ? "var(--rose)" : "var(--accent)"} track="var(--surface-3)" />
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                  <div style={{ textAlign: "center" }}><div className="tnum" style={{ fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{s.remaining}</div><div className="faint" style={{ fontSize: 10 }}>/ {s.packageTotal}</div></div>
                </div>
              </div>
              <div className="col grow" style={{ gap: 8 }}>
                <div className="kv" style={{ padding: "5px 0", borderBottom: "none" }}><span className="kv-k">Toplam paket</span><span className="kv-v tnum">{s.packageTotal} ders</span></div>
                <div className="kv" style={{ padding: "5px 0", borderBottom: "none" }}><span className="kv-k">Kullanılan</span><span className="kv-v tnum">{s.packageTotal - s.remaining} ders</span></div>
                {s.remaining <= 2 && <Badge tone="rose" size="sm">Paket bitmek üzere</Badge>}
              </div>
            </div>
          </Card>

          <Card className="card-pad">
            <span className="faint" style={{ fontSize: 12.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Kişisel bilgiler</span>
            <div style={{ marginTop: 8 }}>
              <div className="kv"><span className="kv-k">Telefon</span><span className="kv-v tnum">{s.phone}</span></div>
              <div className="kv"><span className="kv-k">Kayıt tarihi</span><span className="kv-v tnum">{parseYmd(s.joinDate).getDate()} {TR_MONTHS[parseYmd(s.joinDate).getMonth()]} {parseYmd(s.joinDate).getFullYear()}</span></div>
              <div className="kv"><span className="kv-k">Ders tipi</span><span className="kv-v">{s.type === "ozel" ? "Özel ders" : "Grup dersi"}</span></div>
              <div className="kv"><span className="kv-k">Ödeme durumu</span><span className="kv-v"><Badge tone={s.paymentStatus === "odendi" ? "green" : "gold"} size="sm">{PAY_LABEL[s.paymentStatus]}</Badge></span></div>
            </div>
          </Card>

          <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card className="card-pad" style={{ textAlign: "center" }}><div className="tnum" style={{ fontSize: 26, fontWeight: 800, color: "var(--green-ink)" }}>{st.attended}</div><div className="faint" style={{ fontSize: 12.5 }}>Katıldığı ders</div></Card>
            <Card className="card-pad" style={{ textAlign: "center" }}><div className="tnum" style={{ fontSize: 26, fontWeight: 800, color: "var(--rose-ink)" }}>{st.missed}</div><div className="faint" style={{ fontSize: 12.5 }}>Gelmediği ders</div></Card>
          </div>
        </div>

        {/* right */}
        <Card className="card-pad">
          <div className="tabs">
            <button className={`tab ${tab === "lessons" ? "on" : ""}`} onClick={() => setTab("lessons")}>Ders geçmişi</button>
            <button className={`tab ${tab === "pay" ? "on" : ""}`} onClick={() => setTab("pay")}>Ödeme geçmişi</button>
            <button className={`tab ${tab === "notes" ? "on" : ""}`} onClick={() => setTab("notes")}>Notlar</button>
          </div>

          {tab === "lessons" && (
            <div>
              {st.all.length === 0 && <div className="empty">Henüz ders kaydı yok.</div>}
              {st.all.slice(0, 14).map((l) => {
                const s2 = STATUS[l.status];
                const toneColor = { green: "var(--green)", rose: "var(--rose)", sage: "var(--sage)", muted: "var(--muted-ink)" }[s2.tone];
                return (
                  <div className="timeline-item" key={l.id} onClick={() => go("editLesson", { id: l.id })} style={{ cursor: "pointer" }}>
                    <span className="timeline-dot" style={{ background: toneColor }} />
                    <div className="grow">
                      <div className="row between">
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{parseYmd(l.date).getDate()} {TR_MONTHS[parseYmd(l.date).getMonth()].slice(0, 3)} · {l.time}</span>
                        <StatusPill status={l.status} size="sm" />
                      </div>
                      <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>{l.type === "ozel" ? "Özel ders" : "Grup dersi"} · {fmtMoney(l.fee)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "pay" && (
            <div>
              {pays.map((p, i) => (
                <div className="timeline-item" key={i}>
                  <span className="timeline-dot" style={{ background: p.status === "odendi" ? "var(--green)" : "var(--gold)" }} />
                  <div className="grow">
                    <div className="row between">
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{p.pkg}</span>
                      <span className="tnum" style={{ fontWeight: 700 }}>{fmtMoney(p.amount)}</span>
                    </div>
                    <div className="row between" style={{ marginTop: 2 }}>
                      <span className="faint tnum" style={{ fontSize: 12.5 }}>{parseYmd(p.date).getDate()} {TR_MONTHS[parseYmd(p.date).getMonth()].slice(0, 3)} {parseYmd(p.date).getFullYear()}</span>
                      <Badge tone={p.status === "odendi" ? "green" : "gold"} size="sm">{PAY_LABEL[p.status]}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "notes" && (
            <div>
              {s.notes ? (
                <div style={{ background: "var(--surface-2)", borderRadius: "var(--r-sm)", padding: 16, fontSize: 14.5, lineHeight: 1.6 }}>
                  <div className="row" style={{ gap: 8, marginBottom: 8, color: "var(--ink-3)" }}><Icon name="note" size={16} /><span style={{ fontSize: 12.5, fontWeight: 600 }}>Eğitmen notu</span></div>
                  {s.notes}
                </div>
              ) : <div className="empty">Bu öğrenci için not eklenmemiş.</div>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { StudentsList, StudentDetail, studentStats });
