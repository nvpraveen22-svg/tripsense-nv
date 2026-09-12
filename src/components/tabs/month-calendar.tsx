import { cn } from "@/lib/utils";

interface MonthCalendarProps {
  bestMonths: string[];
  okayMonths: string[];
  avoidMonths: string[];
  monthNotes: Record<string, string>;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type Status = "best" | "okay" | "avoid";

const STATUS_STYLES: Record<Status, string> = {
  best: "bg-emerald-500 text-white",
  okay: "bg-amber-400 text-amber-950",
  avoid: "bg-red-500 text-white",
};

const STATUS_EMOJI: Record<Status, string> = {
  best: "🟢",
  okay: "⚡",
  avoid: "🔴",
};

export function MonthCalendar({
  bestMonths,
  okayMonths,
  avoidMonths,
  monthNotes,
}: MonthCalendarProps) {
  const statusFor = (month: string): Status => {
    if (bestMonths.includes(month)) return "best";
    if (avoidMonths.includes(month)) return "avoid";
    if (okayMonths.includes(month)) return "okay";
    return "okay";
  };

  const notesList = Object.entries(monthNotes);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {MONTHS.map((month) => {
          const status = statusFor(month);
          return (
            <div
              key={month}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg py-2 text-xs font-medium",
                STATUS_STYLES[status]
              )}
            >
              <span className="text-sm leading-none">{STATUS_EMOJI[status]}</span>
              {month}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">🟢 Best time</span>
        <span className="flex items-center gap-1">⚡ Okay</span>
        <span className="flex items-center gap-1">🔴 Avoid</span>
      </div>

      {notesList.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {notesList.map(([range, note]) => (
            <div key={range} className="flex gap-2 text-xs">
              <span className="shrink-0 font-medium text-foreground">{range}:</span>
              <span className="text-muted-foreground">{note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
