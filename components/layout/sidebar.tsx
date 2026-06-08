"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { useApp } from "@/components/providers/app-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { icon: IconName; label: string; href: string; match: string[] }[] = [
  { icon: "home", label: "Ana Sayfa", href: "/dashboard", match: ["/dashboard"] },
  { icon: "calendar", label: "Haftalık Takvim", href: "/calendar/weekly", match: ["/calendar/weekly"] },
  { icon: "grid", label: "Aylık Takvim", href: "/calendar/monthly", match: ["/calendar/monthly"] },
  { icon: "plus", label: "Ders Ekle", href: "/lessons/new", match: ["/lessons/new", "/lessons"] },
  { icon: "users", label: "Öğrenciler", href: "/students", match: ["/students"] },
  { icon: "chart", label: "Raporlar", href: "/reports", match: ["/reports"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { profile } = useApp();
  const dark = theme === "dark";

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "BG";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="hidden h-full w-[var(--sidebar-w)] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--surface)] px-4 py-[22px] lg:flex">
      <div className="flex items-center gap-2.5 px-2 pb-[22px]">
        <div className="relative grid h-[38px] w-[38px] place-items-center rounded-xl bg-gradient-to-br from-[var(--sage)] to-[var(--sage-ink)] shadow-[0_4px_10px_-3px_color-mix(in_oklab,var(--sage)_60%,transparent)]">
          <span className="h-[13px] w-[13px] rounded-full border-[2.2px] border-white/90" />
        </div>
        <div>
          <div className="text-[19px] font-extrabold tracking-tight">Bigelates</div>
          <div className="mt-px text-[11px] uppercase tracking-[0.14em] text-[var(--ink-3)]">
            Eğitmen Paneli
          </div>
        </div>
      </div>

      <nav className="mt-1.5 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.match.some((m) => pathname.startsWith(m));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14.5px] font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
                active && "bg-[var(--accent-soft)] font-semibold text-[var(--accent-ink)]"
              )}
            >
              <Icon name={item.icon} size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="border-t border-[var(--line)] pt-3">
        <button
          type="button"
          onClick={() => setTheme(dark ? "light" : "dark")}
          className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14.5px] font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-2)]"
        >
          <Icon name={dark ? "sun" : "moon"} size={19} />
          {dark ? "Açık tema" : "Koyu tema"}
        </button>
        <div className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-[var(--surface-2)]">
          <span
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--sage-soft)] text-[13px] font-bold text-[var(--sage-ink)]"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold">
              {profile?.full_name || "Eğitmen"}
            </div>
            <div className="truncate text-[11.5px] text-[var(--ink-3)]">
              {profile?.role === "admin" ? "Yönetici" : "Eğitmen"}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => void handleLogout()} aria-label="Çıkış">
            <Icon name="logout" size={17} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
