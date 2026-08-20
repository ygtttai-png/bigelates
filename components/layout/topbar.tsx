"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] px-[18px] py-3.5 backdrop-blur-xl lg:hidden">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="relative grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-[var(--sage)] to-[var(--sage-ink)]">
          <span className="h-3 w-3 rounded-full border-2 border-white/90" />
        </div>
        <span className="text-[17px] font-extrabold tracking-tight">Bigelates</span>
      </Link>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(dark ? "light" : "dark")}
          aria-label="Tema"
        >
          <Icon name={dark ? "sun" : "moon"} />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Bildirimler">
          <Icon name="bell" />
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings" aria-label="Ayarlar">
            <Icon name="settings" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
