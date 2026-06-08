// app.jsx — shell, routing, tweaks (loaded last)
const { useEffect: useEa } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "accent": "#7C9A6F",
  "radius": 18
}/*EDITMODE-END*/;

// accent hex -> {var triplet} so both themes stay tuned
const ACCENTS = {
  "#7C9A6F": { a: "var(--sage)", ink: "var(--sage-ink)", soft: "var(--sage-soft)" },
  "#C68C82": { a: "var(--rose)", ink: "var(--rose-ink)", soft: "var(--rose-soft)" },
  "#9C84A6": { a: "var(--plum)", ink: "var(--plum-ink)", soft: "var(--plum-soft)" },
};

const SCREENS = {
  dashboard: Dashboard,
  weekly: WeeklyCalendar,
  monthly: MonthlyCalendar,
  addLesson: LessonForm,
  editLesson: LessonForm,
  students: StudentsList,
  studentDetail: StudentDetail,
  reports: Reports,
};

const NAV_GROUP = {
  dashboard: "home", weekly: "calendar", monthly: "calendar",
  addLesson: "add", editLesson: "add", students: "students", studentDetail: "students", reports: "reports",
};

function Sidebar({ screen, go, onTheme, dark, onLogout }) {
  const items = [
    ["home", "Ana Sayfa", "dashboard", ["dashboard"]],
    ["calendar", "Haftalık Takvim", "weekly", ["weekly"]],
    ["grid", "Aylık Takvim", "monthly", ["monthly"]],
    ["plus", "Ders Ekle", "addLesson", ["addLesson", "editLesson"]],
    ["users", "Öğrenciler", "students", ["students", "studentDetail"]],
    ["chart", "Raporlar", "reports", ["reports"]],
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" />
        <div><div className="brand-name">Bigelates</div><div className="brand-sub">Eğitmen Paneli</div></div>
      </div>
      <nav className="nav">
        {items.map(([icon, label, target, match]) => (
          <button key={target} className={`nav-item ${match.includes(screen) ? "active" : ""}`} onClick={() => go(target)}>
            <Icon name={icon} size={19} /> {label}
          </button>
        ))}
      </nav>
      <div className="nav-spacer" />
      <div className="nav-foot">
        <button className="nav-item" onClick={onTheme}><Icon name={dark ? "sun" : "moon"} size={19} /> {dark ? "Açık tema" : "Koyu tema"}</button>
        <div className="nav-user">
          <span className="avatar" style={{ width: 36, height: 36, background: "var(--sage-soft)", color: "var(--sage-ink)", fontSize: 13 }}>BG</span>
          <div className="grow" style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>Bige Güneş</div>
            <div className="faint" style={{ fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis" }}>Eğitmen</div>
          </div>
          <IconButton name="logout" label="Çıkış" size={17} onClick={onLogout} />
        </div>
      </div>
    </aside>
  );
}

function TopBar({ go, onTheme, dark }) {
  return (
    <div className="topbar">
      <div className="topbar-brand" onClick={() => go("dashboard")}>
        <div className="brand-mark" style={{ width: 32, height: 32, borderRadius: 10 }} />
        <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-.03em" }}>Bigelates</span>
      </div>
      <div className="row" style={{ gap: 4 }}>
        <IconButton name={dark ? "sun" : "moon"} label="Tema" onClick={onTheme} />
        <IconButton name="bell" label="Bildirimler" />
      </div>
    </div>
  );
}

function BottomNav({ group, go }) {
  return (
    <nav className="botnav">
      <button className={`botnav-item ${group === "home" ? "active" : ""}`} onClick={() => go("dashboard")}><Icon name="home" size={21} /> Ana Sayfa</button>
      <button className={`botnav-item ${group === "calendar" ? "active" : ""}`} onClick={() => go("weekly")}><Icon name="calendar" size={21} /> Takvim</button>
      <button className="botnav-item center" onClick={() => go("addLesson")}><span className="botnav-fab"><Icon name="plus" size={24} stroke={2.2} /></span></button>
      <button className={`botnav-item ${group === "students" ? "active" : ""}`} onClick={() => go("students")}><Icon name="users" size={21} /> Öğrenciler</button>
      <button className={`botnav-item ${group === "reports" ? "active" : ""}`} onClick={() => go("reports")}><Icon name="chart" size={21} /> Raporlar</button>
    </nav>
  );
}

function Shell() {
  const { loggedIn, setLoggedIn } = useApp();
  const { nav, go } = useNav();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEa(() => {
    const root = document.documentElement;
    root.dataset.theme = t.dark ? "dark" : "light";
    const ac = ACCENTS[t.accent] || ACCENTS["#7C9A6F"];
    root.style.setProperty("--accent", ac.a);
    root.style.setProperty("--accent-ink", ac.ink);
    root.style.setProperty("--accent-soft", ac.soft);
    root.style.setProperty("--r", t.radius + "px");
  }, [t.dark, t.accent, t.radius]);

  const toggleTheme = () => setTweak("dark", !t.dark);

  const panel = (
    <TweaksPanel>
      <TweakSection label="Tema" />
      <TweakToggle label="Koyu tema" value={t.dark} onChange={(v) => setTweak("dark", v)} />
      <TweakColor label="Vurgu rengi" value={t.accent} options={["#7C9A6F", "#C68C82", "#9C84A6"]} onChange={(v) => setTweak("accent", v)} />
      <TweakSection label="Biçim" />
      <TweakSlider label="Köşe yuvarlaklığı" value={t.radius} min={8} max={26} unit="px" onChange={(v) => setTweak("radius", v)} />
    </TweaksPanel>
  );

  if (!loggedIn) return <React.Fragment><LoginScreen />{panel}</React.Fragment>;

  const Screen = SCREENS[nav.screen] || Dashboard;
  const group = NAV_GROUP[nav.screen] || "home";

  return (
    <div className="app">
      <Sidebar screen={nav.screen} go={go} onTheme={toggleTheme} dark={t.dark} onLogout={() => setLoggedIn(false)} />
      <div className="main">
        <TopBar go={go} onTheme={toggleTheme} dark={t.dark} />
        <div className="main-inner">
          <div className="page-content">
            <Screen key={nav.screen + JSON.stringify(nav.params)} />
          </div>
        </div>
      </div>
      <BottomNav group={group} go={go} />
      {panel}
    </div>
  );
}

function Root() {
  return (
    <AppProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </AppProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
