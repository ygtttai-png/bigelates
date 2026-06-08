// store.jsx — app state, navigation, actions (loaded before screens)
const AppCtx = React.createContext(null);
const NavCtx = React.createContext(null);
const useApp = () => React.useContext(AppCtx);
const useNav = () => React.useContext(NavCtx);

const LS_KEY = "bigelates.v3";

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function AppProvider({ children }) {
  const saved = loadState();
  const [loggedIn, setLoggedIn] = React.useState(saved ? !!saved.loggedIn : false);
  const [lessons, setLessons] = React.useState(saved && saved.lessons ? saved.lessons : SEED_LESSONS);
  const [students, setStudents] = React.useState(STUDENTS);
  const [nav, setNav] = React.useState(saved && saved.nav ? saved.nav : { screen: "dashboard", params: {} });

  // persist
  React.useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ loggedIn, lessons, nav }));
    } catch (e) {}
  }, [loggedIn, lessons, nav]);

  const go = (screen, params = {}) => {
    setNav({ screen, params });
    const m = document.querySelector(".main");
    if (m) m.scrollTop = 0;
    window.scrollTo && window.scrollTo(0, 0);
  };

  const actions = {
    addLesson(l) {
      const id = "L" + Date.now();
      setLessons((ls) => [...ls, { ...l, id }]);
      return id;
    },
    updateLesson(id, patch) {
      setLessons((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    },
    deleteLesson(id) {
      setLessons((ls) => ls.filter((l) => l.id !== id));
    },
    setStatus(id, status) {
      setLessons((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    },
    resetData() {
      setLessons(SEED_LESSONS);
    },
  };

  return (
    <NavCtx.Provider value={{ nav, go }}>
      <AppCtx.Provider value={{ loggedIn, setLoggedIn, lessons, setLessons, students, actions }}>
        {children}
      </AppCtx.Provider>
    </NavCtx.Provider>
  );
}

Object.assign(window, { AppCtx, NavCtx, useApp, useNav, AppProvider });
