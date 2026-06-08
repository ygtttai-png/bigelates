// screens-form.jsx — Add / Edit lesson
const { useState: useSf, useMemo: useMf, useEffect: useEf } = React;

const TIME_OPTIONS = [];
for (let h = 7; h <= 21; h++) { TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`); TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`); }

function LessonForm() {
  const { lessons, actions, students } = useApp();
  const { nav, go } = useNav();
  const toast = useToast();
  const editId = nav.params.id;
  const editing = editId ? lessons.find((l) => l.id === editId) : null;

  const [date, setDate] = useSf(editing ? editing.date : (nav.params.date || ymd(TODAY)));
  const [time, setTime] = useSf(editing ? editing.time : "09:00");
  const [type, setType] = useSf(editing ? editing.type : "ozel");
  const [ids, setIds] = useSf(editing ? editing.studentIds : []);
  const [fee, setFee] = useSf(editing ? editing.fee : PRICE_OZEL);
  const [feeEdited, setFeeEdited] = useSf(!!editing);
  const [status, setStatus] = useSf(editing ? editing.status : "planlandi");
  const [note, setNote] = useSf(editing ? editing.note : "");
  const [search, setSearch] = useSf("");
  const [errors, setErrors] = useSf({});

  // auto fee
  useEf(() => {
    if (feeEdited) return;
    setFee(type === "ozel" ? PRICE_OZEL : PRICE_GRUP * Math.max(1, ids.length));
  }, [type, ids, feeEdited]);

  // when switching to özel, keep only first student
  const toggleStudent = (id) => {
    setErrors((e) => ({ ...e, ids: null }));
    if (type === "ozel") setIds(ids[0] === id ? [] : [id]);
    else setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  };
  const switchType = (t) => {
    setType(t);
    if (t === "ozel" && ids.length > 1) setIds(ids.slice(0, 1));
  };

  const filtered = students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const validate = () => {
    const e = {};
    if (!date) e.date = "Tarih seçin";
    if (!time) e.time = "Saat seçin";
    if (ids.length === 0) e.ids = "En az bir öğrenci seçin";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) { toast("Lütfen eksik alanları doldurun", { tone: "rose", icon: "x" }); return; }
    const payload = { date, time, type, studentIds: ids, fee: Number(fee), status, note };
    if (editing) {
      actions.updateLesson(editId, payload);
      toast("Ders güncellendi", { tone: "green", icon: "check" });
    } else {
      actions.addLesson(payload);
      toast("Ders eklendi · Kaydedildi", { tone: "green", icon: "check" });
    }
    go("weekly");
  };

  const remove = () => {
    actions.deleteLesson(editId);
    toast("Ders silindi", { tone: "rose", icon: "trash" });
    go("weekly");
  };

  return (
    <div className="screen-enter" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="page-head">
        <div className="row" style={{ gap: 12 }}>
          <IconButton name="chevronL" variant="outline" label="Geri" onClick={() => go(editing ? "weekly" : "dashboard")} />
          <div>
            <div className="eyebrow">{editing ? "Ders düzenle" : "Yeni ders"}</div>
            <h1>{editing ? "Dersi Düzenle" : "Ders Ekle"}</h1>
          </div>
        </div>
      </div>

      <Card className="card-pad">
        {/* type */}
        <div className="field">
          <label>Ders tipi</label>
          <div className="seg seg-accent">
            <button className={type === "ozel" ? "on" : ""} onClick={() => switchType("ozel")}>Özel ders</button>
            <button className={type === "grup" ? "on" : ""} onClick={() => switchType("grup")}>Grup dersi</button>
          </div>
        </div>

        <div className="row gap-lg wrap" style={{ alignItems: "flex-start" }}>
          <div className="field grow" style={{ minWidth: 180 }}>
            <label>Tarih</label>
            <input className={`input ${errors.date ? "input-error" : ""}`} type="date" value={date} onChange={(e) => { setDate(e.target.value); setErrors((x) => ({ ...x, date: null })); }} />
            {errors.date && <div className="field-err">{errors.date}</div>}
          </div>
          <div className="field grow" style={{ minWidth: 180 }}>
            <label>Saat</label>
            <select className={`select ${errors.time ? "input-error" : ""}`} value={time} onChange={(e) => setTime(e.target.value)}>
              {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* students */}
        <div className="field">
          <label>{type === "ozel" ? "Öğrenci seç" : `Öğrenciler ${ids.length ? `(${ids.length} seçili)` : ""}`}</label>
          <div className="input-icon-wrap" style={{ marginBottom: 10 }}>
            <Icon name="search" size={16} />
            <input className="input" placeholder="Öğrenci ara…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {ids.length > 0 && (
            <div className="row wrap" style={{ gap: 7, marginBottom: 10 }}>
              {ids.map((id) => {
                const s = studentById(id);
                return <span key={id} className="chip on">{s.name}<button className="chip-close" onClick={() => toggleStudent(id)}><Icon name="x" size={13} /></button></span>;
              })}
            </div>
          )}
          <div className="row wrap" style={{ gap: 7, maxHeight: 168, overflowY: "auto" }}>
            {filtered.map((s) => (
              <button key={s.id} className={`chip ${ids.includes(s.id) ? "on" : ""}`} onClick={() => toggleStudent(s.id)}>
                <span className="avatar" style={{ width: 22, height: 22, fontSize: 9, background: s.color + "2e", color: s.color }}>{s.initials}</span>
                {s.name}
              </button>
            ))}
          </div>
          {errors.ids && <div className="field-err">{errors.ids}</div>}
        </div>

        <div className="row gap-lg wrap" style={{ alignItems: "flex-start" }}>
          <div className="field grow" style={{ minWidth: 180 }}>
            <label>Ders ücreti {type === "grup" && <span className="faint" style={{ fontWeight: 400 }}>· kişi başı {fmtMoney(PRICE_GRUP)}</span>}</label>
            <div className="input-icon-wrap">
              <Icon name="wallet" size={16} />
              <input className="input tnum" type="number" value={fee} onChange={(e) => { setFee(e.target.value); setFeeEdited(true); }} />
            </div>
          </div>
          <div className="field grow" style={{ minWidth: 180 }}>
            <label>Ders durumu</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="planlandi">Planlandı</option>
              <option value="geldi">Geldi</option>
              <option value="gelmedi">Gelmedi</option>
              <option value="iptal">İptal</option>
            </select>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>Not <span className="faint" style={{ fontWeight: 400 }}>(opsiyonel)</span></label>
          <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bu derse özel notlar…" />
        </div>
      </Card>

      <div className="row between" style={{ marginTop: 18 }}>
        {editing ? <Button variant="danger" icon="trash" onClick={remove}>Sil</Button> : <span />}
        <div className="row" style={{ gap: 10 }}>
          <Button variant="secondary" onClick={() => go(editing ? "weekly" : "dashboard")}>Vazgeç</Button>
          <Button variant="primary" icon="check" onClick={save}>{editing ? "Güncelle" : "Kaydet"}</Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LessonForm });
