import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Legend, Cell,
} from "recharts";
import type { CalendarEvent } from "@flowdocs/shared";
import { getBuckets, countByBucket, type TimeRange } from "./reportUtils";

interface Props {
  events: CalendarEvent[];
  timeRange: TimeRange;
}

function EmptyChart({ message }: { message: string }): JSX.Element {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-text-muted">{message}</div>
  );
}

function ChartSection({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col gap-3 bg-surface-raised rounded-xl border border-surface-border p-5">
      <h3 className="text-sm font-semibold text-text-base">{title}</h3>
      {children}
    </div>
  );
}

export function EventReportsView({ events, timeRange }: Props): JSX.Element {
  // ── Events over time ──────────────────────────────────────────────────────
  const timeData = useMemo(() => {
    const buckets = getBuckets(timeRange);
    return countByBucket(
      events,
      (e) => e.start ? new Date(e.start) : null,
      buckets
    );
  }, [events, timeRange]);

  const hasTimeData = timeData.some((b) => b.count > 0);

  // ── Events by label ───────────────────────────────────────────────────────
  const labelData = useMemo(() => {
    const map = new Map<string, { name: string; color: string; count: number }>();
    let unlabelled = 0;

    for (const ev of events) {
      if (!ev.labels || ev.labels.length === 0) {
        unlabelled++;
      } else {
        for (const l of ev.labels) {
          const existing = map.get(l.id);
          if (existing) {
            existing.count++;
          } else {
            map.set(l.id, { name: l.name, color: l.color, count: 1 });
          }
        }
      }
    }

    const result = Array.from(map.values()).sort((a, b) => b.count - a.count);
    if (unlabelled > 0) {
      result.push({ name: "Unlabelled", color: "#C4C4D4", count: unlabelled });
    }
    return result;
  }, [events]);

  return (
    <div className="flex flex-col gap-4">
      {/* Events over time */}
      <ChartSection title="Events Over Time">
        {!hasTimeData ? (
          <EmptyChart message="No events in this range" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timeData} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2EE" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6B5ECD" radius={[4, 4, 0, 0]} name="Events" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartSection>

      {/* Events by label */}
      <ChartSection title="Events by Label">
        {labelData.length === 0 ? (
          <EmptyChart message="No events with labels" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={labelData}
                dataKey="count"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {labelData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartSection>
    </div>
  );
}
