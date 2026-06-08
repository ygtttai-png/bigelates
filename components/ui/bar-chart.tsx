import { fmtMoneyShort } from "@/utils/currency";

interface BarChartItem {
  label: string;
  value: number;
  highlight?: boolean;
  color?: string;
}

interface BarChartProps {
  data: BarChartItem[];
  height?: number;
  color?: string;
  format?: (n: number) => string;
}

export function BarChart({
  data,
  height = 150,
  color = "var(--sage)",
  format = fmtMoneyShort,
}: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex items-end gap-2.5" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 34);
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="h-3.5 text-[11px] font-bold text-[var(--ink-2)]">
              {d.value ? format(d.value) : ""}
            </div>
            <div className="flex w-full items-end" style={{ height: height - 34 }}>
              <div
                className="bar-fill w-full rounded-t-md rounded-b"
                style={{
                  height: Math.max(d.value ? 4 : 0, h),
                  background: d.color || color,
                  animationDelay: `${i * 40}ms`,
                }}
              />
            </div>
            <div
              className={`text-[11.5px] font-medium ${d.highlight ? "font-bold text-[var(--accent-ink)]" : "text-[var(--ink-2)]"}`}
            >
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
