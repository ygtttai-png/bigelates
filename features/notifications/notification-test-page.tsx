"use client";

import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
type NotifTone = "sage" | "rose" | "plum" | "green" | "gold";

interface NotifItem {
  id: string;
  title: string;
  body: string;
  tone: NotifTone;
  createdAt: Date;
  leaving: boolean;
}

const TONE_META: Record<NotifTone, { label: string; bg: string; icon: string; soft: string }> = {
  sage:  { label: "Bilgi",    bg: "var(--sage)",  icon: "bell",  soft: "var(--sage-soft)" },
  rose:  { label: "Uyarı",    bg: "var(--rose)",  icon: "alert", soft: "var(--rose-soft)" },
  plum:  { label: "Duyuru",   bg: "var(--plum)",  icon: "spark", soft: "var(--plum-soft)" },
  green: { label: "Başarılı", bg: "var(--green)", icon: "check", soft: "var(--green-soft)" },
  gold:  { label: "Hatırlatma", bg: "var(--gold)", icon: "clock", soft: "var(--sage-soft)" },
};

const AUTO_DISMISS_MS = 6000;

/* ─── Component ─── */
export function NotificationTestPage() {
  const [notifications, setNotifications] = React.useState<NotifItem[]>([]);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [tone, setTone] = React.useState<NotifTone>("sage");
  const timersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /* Auto-dismiss after timeout */
  const scheduleRemove = React.useCallback((id: string) => {
    const t = setTimeout(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leaving: true } : n))
      );
      // actually remove after leave animation
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        timersRef.current.delete(id);
      }, 400);
    }, AUTO_DISMISS_MS);
    timersRef.current.set(id, t);
  }, []);

  /* Manual dismiss */
  const dismiss = React.useCallback((id: string) => {
    const existing = timersRef.current.get(id);
    if (existing) clearTimeout(existing);
    timersRef.current.delete(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leaving: true } : n))
    );
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 400);
  }, []);

  /* Send notification */
  const send = React.useCallback(() => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle && !trimmedBody) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const notif: NotifItem = {
      id,
      title: trimmedTitle || "Bildirim",
      body: trimmedBody,
      tone,
      createdAt: new Date(),
      leaving: false,
    };

    setNotifications((prev) => [notif, ...prev]);
    scheduleRemove(id);
    setTitle("");
    setBody("");
  }, [title, body, tone, scheduleRemove]);

  /* Clear all */
  const clearAll = React.useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
    setNotifications((prev) => prev.map((n) => ({ ...n, leaving: true })));
    setTimeout(() => setNotifications([]), 400);
  }, []);

  /* Keyboard shortcut: Enter to send (without shift) */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Test Aracı"
        title="Bildirim Testi"
        action={
          notifications.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <Icon name="trash" size={15} />
              Tümünü Temizle
            </Button>
          ) : undefined
        }
      />

      {/* ── Composer Card ── */}
      <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-ink)]">
            <Icon name="bell" size={17} />
          </div>
          <div>
            <p className="text-[15px] font-semibold">Bildirim Oluştur</p>
            <p className="text-[12px] text-[var(--ink-3)]">Mobilde düşen bildirim testi yap</p>
          </div>
        </div>

        {/* Title input */}
        <input
          id="notif-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Bildirim başlığı"
          className="mb-3 flex h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-2 text-[14.5px] text-[var(--ink)] transition-colors placeholder:text-[var(--ink-3)] focus:border-[var(--accent)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-soft)]"
        />

        {/* Body textarea */}
        <textarea
          id="notif-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Bildirim mesajı yazın..."
          rows={3}
          className="mb-4 flex w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-2.5 text-[14.5px] text-[var(--ink)] transition-colors placeholder:text-[var(--ink-3)] focus:border-[var(--accent)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-soft)]"
        />

        {/* Tone selector + Send */}
        <div className="flex flex-wrap items-center gap-2.5">
          {(Object.entries(TONE_META) as [NotifTone, typeof TONE_META[NotifTone]][]).map(
            ([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTone(key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-[12.5px] font-semibold transition-all",
                  tone === key
                    ? "border-transparent shadow-[var(--shadow-sm)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
                )}
                style={
                  tone === key
                    ? { background: meta.soft, color: meta.bg }
                    : undefined
                }
              >
                <span
                  className="grid h-4 w-4 place-items-center rounded-[5px]"
                  style={{ background: meta.bg }}
                >
                  <Icon name={meta.icon as never} size={10} stroke={2.4} className="text-white" />
                </span>
                {meta.label}
              </button>
            )
          )}

          <div className="flex-1" />

          <Button
            size="md"
            onClick={send}
            disabled={!title.trim() && !body.trim()}
            className="min-w-[120px]"
          >
            <Icon name="arrowUR" size={16} />
            Gönder
          </Button>
        </div>
      </div>

      {/* ── Notification Drop Zone ── */}
      <div className="mt-6 flex flex-col gap-3" id="notification-drop-zone">
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[var(--surface-2)]">
              <Icon name="bell" size={28} className="text-[var(--ink-3)]" />
            </div>
            <p className="text-[15px] font-semibold text-[var(--ink-2)]">Henüz bildirim yok</p>
            <p className="mt-1 text-[13px] text-[var(--ink-3)]">
              Yukarıdan bir test bildirimi gönderin
            </p>
          </div>
        )}

        {notifications.map((n, i) => {
          const meta = TONE_META[n.tone];
          return (
            <div
              key={n.id}
              className={cn(
                "group relative overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)] transition-all",
                n.leaving ? "notif-leave" : "notif-drop"
              )}
              style={{ animationDelay: n.leaving ? "0ms" : `${i * 60}ms` }}
            >
              {/* Accent bar at top */}
              <div
                className="h-[3px] w-full"
                style={{ background: meta.bg }}
              />

              <div className="flex items-start gap-3.5 p-4">
                {/* Icon */}
                <div
                  className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                  style={{ background: meta.soft }}
                >
                  <span style={{ color: meta.bg }}>
                    <Icon
                      name={meta.icon as never}
                      size={18}
                      className="shrink-0"
                    />
                  </span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14.5px] font-bold">{n.title}</p>
                    <span className="shrink-0 text-[11px] text-[var(--ink-3)] tnum">
                      {n.createdAt.toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  {n.body && (
                    <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-2)]">
                      {n.body}
                    </p>
                  )}
                </div>

                {/* Dismiss */}
                <button
                  type="button"
                  onClick={() => dismiss(n.id)}
                  className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--ink-3)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                  aria-label="Kapat"
                >
                  <Icon name="x" size={14} stroke={2} />
                </button>
              </div>

              {/* Progress bar for auto-dismiss */}
              {!n.leaving && (
                <div className="h-[2px] w-full bg-[var(--surface-2)]">
                  <div
                    className="notif-progress h-full"
                    style={{ background: meta.bg }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Floating notification overlay (mobile-first, top-right drop) ── */}
      <div
        className="pointer-events-none fixed right-0 top-0 z-[9999] flex w-full max-w-md flex-col gap-2 p-4 pt-[calc(16px+env(safe-area-inset-top))] lg:right-4 lg:top-4 lg:p-0"
        id="notification-overlay"
      >
        {notifications
          .filter((n) => !n.leaving)
          .slice(0, 3)
          .map((n, i) => {
            const meta = TONE_META[n.tone];
            return (
              <div
                key={`float-${n.id}`}
                className="pointer-events-auto notif-float-drop rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_94%,transparent)] p-3.5 shadow-[var(--shadow-lg)] backdrop-blur-xl"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
                    style={{ background: meta.soft }}
                  >
                    <span style={{ color: meta.bg }}>
                      <Icon name={meta.icon as never} size={16} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold">{n.title}</p>
                    {n.body && (
                      <p className="mt-0.5 line-clamp-2 text-[12.5px] text-[var(--ink-2)]">
                        {n.body}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(n.id)}
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                    aria-label="Kapat"
                  >
                    <Icon name="x" size={13} stroke={2} />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}
