import {
  startOfDay, startOfWeek, startOfMonth, startOfYear,
  subDays, subWeeks, subMonths, subYears,
  format, eachDayOfInterval, eachWeekOfInterval,
  eachMonthOfInterval, eachYearOfInterval,
} from "date-fns";

export type TimeRange = "daily" | "weekly" | "monthly" | "yearly";

export interface Bucket {
  label: string;
  start: Date;
  end: Date;
}

export function getBuckets(range: TimeRange, now = new Date()): Bucket[] {
  switch (range) {
    case "daily": {
      const start = startOfDay(subDays(now, 29));
      return eachDayOfInterval({ start, end: startOfDay(now) }).map((d) => ({
        label: format(d, "MMM d"),
        start: d,
        end: startOfDay(subDays(d, -1)),
      }));
    }
    case "weekly": {
      const start = startOfWeek(subWeeks(now, 11), { weekStartsOn: 0 });
      return eachWeekOfInterval({ start, end: now }, { weekStartsOn: 0 }).map((d) => ({
        label: format(d, "'W'w"),
        start: d,
        end: startOfWeek(subWeeks(d, -1), { weekStartsOn: 0 }),
      }));
    }
    case "monthly": {
      const start = startOfMonth(subMonths(now, 11));
      return eachMonthOfInterval({ start, end: now }).map((d) => ({
        label: format(d, "MMM yy"),
        start: d,
        end: startOfMonth(subMonths(d, -1)),
      }));
    }
    case "yearly": {
      const start = startOfYear(subYears(now, 4));
      return eachYearOfInterval({ start, end: now }).map((d) => ({
        label: format(d, "yyyy"),
        start: d,
        end: startOfYear(subYears(d, -1)),
      }));
    }
  }
}

export function countByBucket<T>(
  items: T[],
  getDate: (item: T) => Date | null,
  buckets: Bucket[]
): { label: string; count: number }[] {
  return buckets.map((b) => ({
    label: b.label,
    count: items.filter((item) => {
      const d = getDate(item);
      return d !== null && d >= b.start && d < b.end;
    }).length,
  }));
}

export function formatDuration(seconds: number): string {
  const s = Math.floor(seconds);
  if (s <= 0) return "0s";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}
