interface DonutProps {
  value: number;
  total: number;
  size?: number;
  stroke?: number;
  color: string;
  track: string;
}

export function Donut({
  value,
  total,
  size = 132,
  stroke = 14,
  color,
  track,
}: DonutProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? value / total : 0;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={track}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${c * pct} ${c}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray .7s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}
