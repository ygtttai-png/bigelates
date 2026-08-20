"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

function getGroup(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "home";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/lessons")) return "add";
  if (pathname.startsWith("/students")) return "students";
  if (pathname.startsWith("/reports")) return "reports";
  if (pathname.startsWith("/settings")) return "settings";
  return "home";
}

export function BottomNav() {
  const pathname = usePathname();
  const group = getGroup(pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] grid grid-cols-5 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_94%,transparent)] px-1.5 py-2 pb-[calc(8px+env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
      <Link
        href="/dashboard"
        className={cn(
          "flex flex-col items-center gap-0.5 py-1 text-[10.5px] font-semibold text-[var(--ink-3)]",
          group === "home" && "text-[var(--accent-ink)]"
        )}
      >
        <Icon name="home" size={21} />
        Ana Sayfa
      </Link>
      <Link
        href="/calendar/weekly"
        className={cn(
          "flex flex-col items-center gap-0.5 py-1 text-[10.5px] font-semibold text-[var(--ink-3)]",
          group === "calendar" && "text-[var(--accent-ink)]"
        )}
      >
        <Icon name="calendar" size={21} />
        Takvim
      </Link>
      <Link href="/lessons/new" className="relative -translate-y-0.5 flex flex-col items-center">
        <span className="-mt-[22px] grid h-[46px] w-[46px] place-items-center rounded-[15px] border-[3px] border-[var(--surface)] bg-[var(--accent)] text-white shadow-[0_6px_16px_-4px_color-mix(in_oklab,var(--accent)_65%,transparent)] dark:text-[#16140f]">
          <Icon name="plus" size={24} stroke={2.2} />
        </span>
      </Link>
      <Link
        href="/students"
        className={cn(
          "flex flex-col items-center gap-0.5 py-1 text-[10.5px] font-semibold text-[var(--ink-3)]",
          group === "students" && "text-[var(--accent-ink)]"
        )}
      >
        <Icon name="users" size={21} />
        Öğrenciler
      </Link>
      <Link
        href="/reports"
        className={cn(
          "flex flex-col items-center gap-0.5 py-1 text-[10.5px] font-semibold text-[var(--ink-3)]",
          group === "reports" && "text-[var(--accent-ink)]"
        )}
      >
        <Icon name="chart" size={21} />
        Raporlar
      </Link>
    </nav>
  );
}
