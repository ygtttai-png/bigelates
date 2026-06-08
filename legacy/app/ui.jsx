// ui.jsx — icons + shared UI primitives for Bigelates
const { useState, useEffect, useRef, useMemo } = React;

// ---------- Icons (simple line icons) ----------
const ICONS = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5",
  calendar: "M3 8.5h18M7 3v3m10-3v3M5 5.5h14a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  plus: "M12 5v14M5 12h14",
  users: "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 19v-1.5a3.5 3.5 0 0 0-2.7-3.4M15.5 4.2a3.5 3.5 0 0 1 0 6.6",
  chart: "M4 20V10M10 20V4M16 20v-6M22 20H2",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7.5V12l3 2",
  phone: "M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5L15.5 12l4 1.5v3a2 2 0 0 1-2 2A14 14 0 0 1 4.5 6a2 2 0 0 1 2-2Z",
  check: "M5 12.5 10 17.5 19.5 7",
  x: "M6 6l12 12M18 6 6 18",
  edit: "M4 20h4L18.5 9.5a2 2 0 0 0-3-3L5 17v3ZM14 6.5l3 3",
  trash: "M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13",
  chevronL: "M15 5l-7 7 7 7",
  chevronR: "M9 5l7 7-7 7",
  chevronD: "M5 9l7 7 7-7",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4",
  bell: "M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M9.5 20a2.5 2.5 0 0 0 5 0",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z",
  wallet: "M3 7.5A1.5 1.5 0 0 1 4.5 6H19a1 1 0 0 1 1 1v2H5.5M3 7.5V18a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1v-3M20 9v6h-4a3 3 0 0 1 0-6h4Z",
  arrowUR: "M7 17 17 7M8 7h9v9",
  arrowDR: "M7 7l10 10M17 8v9H8",
  logout: "M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 16l4-4-4-4M14 12H4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0",
  note: "M6 3h9l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM14 3v6h6M8 13h8M8 17h5",
  filter: "M3 5h18l-7 8v5l-4 2v-7L3 5Z",
  dot: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  spark: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z",
  card: "M3 7h18a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1ZM2 11h20",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
};

function Icon({ name, size = 20, stroke = 1.7, className = "", style = {} }) {
  const d = ICONS[name];
  const fillIcons = [];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
      style={{ flex: "none", ...style }}
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// ---------- Badge / status pill ----------
function Badge({ tone = "muted", children, soft = true, size = "md" }) {
  return (
    <span className={`badge badge-${tone} ${soft ? "badge-soft" : "badge-solid"} badge-${size}`}>
      {children}
    </span>
  );
}
function StatusPill({ status, size = "md" }) {
  const s = STATUS[status] || STATUS.planlandi;
  return <Badge tone={s.tone} size={size}>{s.label}</Badge>;
}

// ---------- Avatar ----------
function Avatar({ student, size = 38 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, background: student.color + "26", color: student.color, fontSize: size * 0.36 }}>
      {student.initials}
    </span>
  );
}
function AvatarStack({ ids, max = 3, size = 30 }) {
  const list = ids.map(studentById).filter(Boolean);
  const shown = list.slice(0, max);
  const extra = list.length - shown.length;
  return (
    <div className="avatar-stack">
      {shown.map((s, i) => (
        <span key={s.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.32, zIndex: 10 - i }}>
          <span className="avatar avatar-ring" style={{ width: size, height: size, background: s.color + "2e", color: s.color, fontSize: size * 0.36 }}>{s.initials}</span>
        </span>
      ))}
      {extra > 0 && (
        <span style={{ marginLeft: -size * 0.32, zIndex: 1 }}>
          <span className="avatar avatar-ring avatar-extra" style={{ width: size, height: size, fontSize: size * 0.34 }}>+{extra}</span>
        </span>
      )}
    </div>
  );
}

// ---------- Card ----------
function Card({ children, className = "", style = {}, onClick, hover }) {
  return (
    <div className={`card ${hover ? "card-hover" : ""} ${className}`} style={style} onClick={onClick}>
      {children}
    </div>
  );
}

// ---------- Button ----------
function Button({ children, variant = "primary", size = "md", icon, iconRight, onClick, type = "button", full, disabled, style = {} }) {
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={`btn btn-${variant} btn-${size} ${full ? "btn-full" : ""}`} style={style}>
      {icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 16 : 18} />}
    </button>
  );
}
function IconButton({ name, onClick, label, size = 18, variant = "ghost", style = {} }) {
  return (
    <button className={`icon-btn icon-btn-${variant}`} onClick={onClick} aria-label={label} title={label} style={style}>
      <Icon name={name} size={size} />
    </button>
  );
}

// ---------- Section header ----------
function SectionTitle({ children, action }) {
  return (
    <div className="section-title">
      <h3>{children}</h3>
      {action}
    </div>
  );
}

// ---------- Toast system ----------
const ToastCtx = React.createContext(() => {});
function useToast() { return React.useContext(ToastCtx); }
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (msg, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, icon: opts.icon || "check", tone: opts.tone || "green" }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.duration || 2600);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            <span className="toast-ic"><Icon name={t.icon} size={16} stroke={2.2} /></span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- Mini bar chart ----------
function BarChart({ data, height = 150, color, format = fmtMoneyShort, labelKey = "label", valueKey = "value" }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  return (
    <div className="barchart" style={{ height }}>
      {data.map((d, i) => {
        const h = (d[valueKey] / max) * (height - 34);
        return (
          <div key={i} className="bar-col">
            <div className="bar-val">{d[valueKey] ? format(d[valueKey]) : ""}</div>
            <div className="bar-track" style={{ height: height - 34 }}>
              <div className="bar-fill" style={{ height: Math.max(d[valueKey] ? 4 : 0, h), background: d.color || color, animationDelay: i * 40 + "ms" }} />
            </div>
            <div className={`bar-label ${d.highlight ? "bar-label-hi" : ""}`}>{d[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Donut (two-segment) ----------
function Donut({ value, total, size = 132, stroke = 14, color, track }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? value / total : 0;
  return (
    <svg width={size} height={size} className="donut">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dasharray .7s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
}

Object.assign(window, {
  Icon, Badge, StatusPill, Avatar, AvatarStack, Card, Button, IconButton,
  SectionTitle, ToastProvider, useToast, BarChart, Donut,
});
