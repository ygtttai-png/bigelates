"use client";

import * as React from "react";
import { Icon, type IconName } from "@/components/ui/icon";

type ToastTone = "green" | "rose" | "sage";

interface ToastItem {
  id: string;
  msg: string;
  icon: IconName;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (msg: string, opts?: { icon?: IconName; tone?: ToastTone; duration?: number }) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue["toast"] {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback(
    (msg: string, opts?: { icon?: IconName; tone?: ToastTone; duration?: number }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [
        ...t,
        { id, msg, icon: opts?.icon ?? "check", tone: opts?.tone ?? "green" },
      ]);
      setTimeout(
        () => setToasts((t) => t.filter((x) => x.id !== id)),
        opts?.duration ?? 2600
      );
    },
    []
  );

  const toneBg: Record<ToastTone, string> = {
    green: "bg-[var(--green)]",
    rose: "bg-[var(--rose)]",
    sage: "bg-[var(--sage)]",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-[calc(26px+env(safe-area-inset-bottom))] left-1/2 z-[9000] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-wrap flex items-center gap-2.5 rounded-[13px] bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-[var(--bg)] shadow-[var(--shadow-lg)]"
          >
            <span
              className={`grid h-[22px] w-[22px] place-items-center rounded-[7px] text-white ${toneBg[t.tone]}`}
            >
              <Icon name={t.icon} size={16} stroke={2.2} />
            </span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
