interface HeatmapProps {
  /** Map of "YYYY-MM-DD" → count */
  data: Record<string, number>;
  weeks?: number;
}

const INTENSITY = [
  "bg-muted",
  "bg-green-900",
  "bg-green-700",
  "bg-green-500",
  "bg-green-400",
];

function getIntensity(count: number, max: number): number {
  if (count === 0) return 0;
  if (max === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function ActivityHeatmap({ data, weeks = 12 }: HeatmapProps) {
  const today = new Date();
  const days: { date: string; count: number; dayOfWeek: number }[] = [];

  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({
      date: key,
      count: data[key] || 0,
      dayOfWeek: d.getDay(),
    });
  }

  const max = Math.max(...days.map((d) => d.count), 1);

  // Group into weeks (columns)
  const weekColumns: typeof days[] = [];
  let currentWeek: typeof days = [];
  for (const day of days) {
    if (day.dayOfWeek === 0 && currentWeek.length > 0) {
      weekColumns.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) weekColumns.push(currentWeek);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-[3px]">
        {weekColumns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {/* Pad first week if it doesn't start on Sunday */}
            {wi === 0 &&
              Array.from({ length: week[0].dayOfWeek }).map((_, i) => (
                <div key={`pad-${i}`} className="w-[10px] h-[10px]" />
              ))}
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-[10px] h-[10px] rounded-[2px] ${INTENSITY[getIntensity(day.count, max)]}`}
                title={`${day.date}: ${day.count} activities`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-1">
        <span>Less</span>
        {INTENSITY.map((cls, i) => (
          <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${cls}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
