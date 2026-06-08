import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: IconName;
  tone: "sage" | "green" | "rose" | "plum" | "gold";
  label: string;
  value: string;
  delta?: string;
  deltaDir?: "up" | "down";
}

const toneMap: Record<StatCardProps["tone"], [string, string]> = {
  sage: ["var(--sage-soft)", "var(--sage-ink)"],
  green: ["var(--green-soft)", "var(--green-ink)"],
  rose: ["var(--rose-soft)", "var(--rose-ink)"],
  plum: ["var(--plum-soft)", "var(--plum-ink)"],
  gold: ["color-mix(in oklab, var(--gold) 16%, transparent)", "var(--gold)"],
};

export function StatCard({ icon, tone, label, value, delta, deltaDir }: StatCardProps) {
  const [bg, fg] = toneMap[tone];

  return (
    <Card className="relative overflow-hidden p-[18px] pb-4">
      <div
        className="mb-3.5 grid h-9 w-9 place-items-center rounded-[11px]"
        style={{ background: bg, color: fg }}
      >
        <Icon name={icon} size={19} />
      </div>
      <div className="text-[13px] font-medium text-[var(--ink-2)]">{label}</div>
      <div className="tnum mt-0.5 text-[26px] font-extrabold tracking-tight">{value}</div>
      {delta && (
        <div
          className={cn(
            "mt-1.5 inline-flex items-center gap-0.5 text-[12.5px] font-semibold",
            deltaDir === "up" ? "text-[var(--green-ink)]" : "text-[var(--rose-ink)]"
          )}
        >
          {deltaDir && <Icon name={deltaDir === "up" ? "arrowUR" : "arrowDR"} size={13} stroke={2.2} />}
          {delta}
        </div>
      )}
    </Card>
  );
}
