// data.jsx — mock data + date/currency helpers for Bigelates
// Exposes everything on window for the other Babel scripts.

// Fixed "today" so the prototype is deterministic. June 8, 2026 (Monday).
const TODAY = new Date(2026, 5, 8);

// ---- date helpers ----
const TR_DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const TR_DAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseYmd(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
// Monday of the week containing d
function startOfWeek(d) {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7; // 0 = Monday
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dowIndex(d) {
  return (d.getDay() + 6) % 7; // Monday = 0
}
function fmtMoney(n) {
  return new Intl.NumberFormat("tr-TR").format(Math.round(n)) + " ₺";
}
function fmtMoneyShort(n) {
  if (n >= 1000) return "₺" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "B";
  return "₺" + Math.round(n);
}

// ---- status meta ----
const STATUS = {
  planlandi: { key: "planlandi", label: "Planlandı", tone: "sage" },
  geldi: { key: "geldi", label: "Geldi", tone: "green" },
  gelmedi: { key: "gelmedi", label: "Gelmedi", tone: "rose" },
  iptal: { key: "iptal", label: "İptal", tone: "muted" },
};

// ---- students ----
const STUDENT_COLORS = ["#8FA688", "#C9A6A0", "#A8A29A", "#9FB0AE", "#C4B59A", "#B0A4BE", "#A0B4C4", "#C9B07E"];
let _sc = 0;
function mkStudent(o) {
  const c = STUDENT_COLORS[_sc++ % STUDENT_COLORS.length];
  const initials = o.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return { paymentStatus: "odendi", notes: "", ...o, color: c, initials };
}

const STUDENTS = [
  mkStudent({ id: "s1", name: "Ayşe Demir", phone: "0532 114 22 08", type: "ozel", packageTotal: 12, remaining: 7, paymentStatus: "odendi", joinDate: "2025-11-04", notes: "Bel fıtığı geçmişi var, ileri seviye core hareketlerinde dikkat." }),
  mkStudent({ id: "s2", name: "Zeynep Kaya", phone: "0541 309 71 16", type: "grup", packageTotal: 16, remaining: 3, paymentStatus: "bekliyor", joinDate: "2025-09-22", notes: "Sabah grubunu tercih ediyor." }),
  mkStudent({ id: "s3", name: "Elif Yıldız", phone: "0505 882 40 53", type: "ozel", packageTotal: 8, remaining: 1, paymentStatus: "bekliyor", joinDate: "2026-01-12", notes: "Reformer odaklı çalışıyor." }),
  mkStudent({ id: "s4", name: "Merve Şahin", phone: "0533 471 96 02", type: "grup", packageTotal: 12, remaining: 9, paymentStatus: "odendi", joinDate: "2025-12-01", notes: "" }),
  mkStudent({ id: "s5", name: "Selin Arslan", phone: "0542 660 13 77", type: "ozel", packageTotal: 10, remaining: 5, paymentStatus: "odendi", joinDate: "2025-10-18", notes: "Hamilelik sonrası toparlanma programı." }),
  mkStudent({ id: "s6", name: "Deniz Aydın", phone: "0537 205 88 41", type: "grup", packageTotal: 16, remaining: 11, paymentStatus: "odendi", joinDate: "2026-02-09", notes: "" }),
  mkStudent({ id: "s7", name: "Ece Çelik", phone: "0506 743 50 29", type: "ozel", packageTotal: 8, remaining: 2, paymentStatus: "bekliyor", joinDate: "2025-08-30", notes: "Omuz sıkışması, üst vücut yüklenmelerinde temkinli." }),
  mkStudent({ id: "s8", name: "Buse Koç", phone: "0544 918 36 70", type: "grup", packageTotal: 12, remaining: 6, paymentStatus: "odendi", joinDate: "2025-11-25", notes: "" }),
  mkStudent({ id: "s9", name: "Naz Öztürk", phone: "0531 027 64 18", type: "ozel", packageTotal: 10, remaining: 8, paymentStatus: "odendi", joinDate: "2026-03-03", notes: "Esneklik geliştirme hedefi." }),
  mkStudent({ id: "s10", name: "Cansu Doğan", phone: "0538 552 09 93", type: "grup", packageTotal: 16, remaining: 4, paymentStatus: "bekliyor", joinDate: "2025-07-14", notes: "Akşam grubu sabit." }),
];

const studentById = (id) => STUDENTS.find((s) => s.id === id);

// ---- lesson generation ----
const PRICE_OZEL = 750;
const PRICE_GRUP = 350;

let _lid = 0;
function mkLesson(dateStr, time, type, studentIds, status, note = "") {
  const fee = type === "ozel" ? PRICE_OZEL : PRICE_GRUP * studentIds.length;
  return { id: "L" + ++_lid, date: dateStr, time, type, studentIds, status, fee, note };
}

// Build a realistic schedule across ~6 weeks (3 before, current, 2 after)
function buildLessons() {
  const lessons = [];
  const weekStart = startOfWeek(TODAY);
  // template per weekday: [time, type, studentIds]
  const tpl = {
    0: [["09:00", "ozel", ["s1"]], ["10:30", "grup", ["s2", "s4", "s8"]], ["18:00", "ozel", ["s5"]], ["19:30", "grup", ["s6", "s10", "s3"]]],
    1: [["08:30", "ozel", ["s7"]], ["11:00", "grup", ["s2", "s6", "s9", "s4"]], ["17:00", "ozel", ["s9"]]],
    2: [["09:00", "ozel", ["s3"]], ["10:30", "grup", ["s8", "s10", "s4"]], ["18:30", "ozel", ["s1"]], ["20:00", "grup", ["s5", "s6"]]],
    3: [["08:30", "grup", ["s2", "s4", "s8", "s6"]], ["12:00", "ozel", ["s5"]], ["18:00", "ozel", ["s7"]]],
    4: [["09:00", "ozel", ["s9"]], ["10:30", "grup", ["s10", "s3", "s8"]], ["17:30", "ozel", ["s1"]], ["19:00", "grup", ["s4", "s6", "s2"]]],
    5: [["10:00", "grup", ["s5", "s8", "s10", "s4"]], ["11:30", "ozel", ["s7"]]],
    6: [],
  };
  for (let w = -3; w <= 2; w++) {
    for (let dow = 0; dow < 7; dow++) {
      const date = addDays(weekStart, w * 7 + dow);
      const dateStr = ymd(date);
      const items = tpl[dow] || [];
      items.forEach(([time, type, ids], i) => {
        let status;
        const isPast = date < TODAY && !isSameDay(date, TODAY);
        if (isPast) {
          // mostly came, some no-show / cancel
          const r = (w * 13 + dow * 7 + i * 3) % 10;
          status = r < 7 ? "geldi" : r < 9 ? "gelmedi" : "iptal";
        } else if (isSameDay(date, TODAY)) {
          // today: morning done, rest planned
          status = parseInt(time) < 12 ? "geldi" : "planlandi";
        } else {
          status = "planlandi";
        }
        lessons.push(mkLesson(dateStr, time, type, ids, status));
      });
    }
  }
  return lessons;
}

const SEED_LESSONS = buildLessons();

// ---- derived metrics ----
function lessonsOn(lessons, date) {
  const s = ymd(date);
  return lessons.filter((l) => l.date === s).sort((a, b) => a.time.localeCompare(b.time));
}
function lessonsInRange(lessons, start, end) {
  const a = ymd(start), b = ymd(end);
  return lessons.filter((l) => l.date >= a && l.date <= b);
}
// earnings counted for geldi (and today's planlandı as expected)
function earnedFee(l) {
  return l.status === "geldi" ? l.fee : 0;
}
function expectedFee(l) {
  return l.status === "geldi" || l.status === "planlandi" ? l.fee : 0;
}

Object.assign(window, {
  TODAY, TR_DAYS, TR_DAYS_SHORT, TR_MONTHS,
  ymd, parseYmd, addDays, startOfWeek, isSameDay, dowIndex, fmtMoney, fmtMoneyShort,
  STATUS, STUDENTS, studentById, SEED_LESSONS, PRICE_OZEL, PRICE_GRUP,
  lessonsOn, lessonsInRange, earnedFee, expectedFee, mkLesson,
});
