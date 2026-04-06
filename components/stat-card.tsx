interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
  icon?: string;
  trend?: number; // positive = up, negative = down, 0 or undefined = no trend
}

export function StatCard({ label, value, color, icon, trend }: StatCardProps) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-lg bg-card p-3 min-w-[80px] border"
      style={color ? { borderLeftWidth: 3, borderLeftColor: color } : undefined}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span className="font-mono text-xl font-bold tabular-nums text-foreground">{value}</span>
      <span className="text-[11px] text-muted-foreground text-center leading-tight">{label}</span>
      {trend !== undefined && trend !== 0 && (
        <span className={`text-[10px] font-bold ${trend > 0 ? "text-green-400" : "text-red-400"}`}>
          {trend > 0 ? `▲ ${trend}%` : `▼ ${Math.abs(trend)}%`}
        </span>
      )}
    </div>
  );
}
