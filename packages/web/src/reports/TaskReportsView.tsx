import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid,
} from "recharts";
import type { Task } from "@flowdocs/shared";
import { TASK_STATUS_COLORS } from "@/google/CalendarView";
import { getBuckets, countByBucket, formatDuration, type TimeRange } from "./reportUtils";

const STATUS_LABEL: Record<string, string> = {
  in_progress: "In Progress",
  pending:     "Waiting",
  blocked:     "Waiting",
  done:        "Done",
};


interface Props {
  tasks: Task[];
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

export function TaskReportsView({ tasks, timeRange }: Props): JSX.Element {
  // ── Time spent per task ───────────────────────────────────────────────────
  const timeSpentData = useMemo(() =>
    tasks
      .filter((t) => t.totalSeconds > 0)
      .map((t) => ({
        name: t.title.length > 30 ? t.title.slice(0, 28) + "…" : t.title,
        seconds: t.totalSeconds,
        status: t.status,
        formatted: formatDuration(t.totalSeconds),
      }))
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 15),
  [tasks]);

  // ── Status distribution ───────────────────────────────────────────────────
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      const key = t.status === "blocked" ? "pending" : t.status;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_LABEL[status] ?? status,
        value: count,
        color: TASK_STATUS_COLORS[status]?.border ?? "#9CA3AF",
      }));
  }, [tasks]);

  // ── Time spent per label ─────────────────────────────────────────────────
  const timePerLabelData = useMemo(() => {
    const map = new Map<string, { name: string; color: string; seconds: number }>();
    let unlabelledSeconds = 0;

    for (const t of tasks) {
      if (t.totalSeconds === 0) continue;
      if (!t.labels || t.labels.length === 0) {
        unlabelledSeconds += t.totalSeconds;
      } else {
        for (const l of t.labels) {
          const existing = map.get(l.id);
          if (existing) {
            existing.seconds += t.totalSeconds;
          } else {
            map.set(l.id, { name: l.name, color: l.color, seconds: t.totalSeconds });
          }
        }
      }
    }

    const result = Array.from(map.values()).sort((a, b) => b.seconds - a.seconds);
    if (unlabelledSeconds > 0) {
      result.push({ name: "Unlabelled", color: "#C4C4D4", seconds: unlabelledSeconds });
    }
    return result;
  }, [tasks]);

  // ── Completion trend ──────────────────────────────────────────────────────
  const completionData = useMemo(() => {
    const buckets = getBuckets(timeRange);
    return countByBucket(
      tasks.filter((t) => t.status === "done"),
      (t) => t.updatedAt ? new Date(t.updatedAt) : null,
      buckets
    );
  }, [tasks, timeRange]);

  const hasCompletionData = completionData.some((b) => b.count > 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Time spent */}
      <ChartSection title="Time Spent per Task">
        {timeSpentData.length === 0 ? (
          <EmptyChart message="No time tracked yet" />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, timeSpentData.length * 32)}>
            <BarChart data={timeSpentData} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
              <XAxis type="number" tickFormatter={(v) => formatDuration(v as number)} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatDuration(v as number)} />
              <Bar dataKey="seconds" radius={[0, 4, 4, 0]}>
                {timeSpentData.map((entry, i) => (
                  <Cell key={i} fill={TASK_STATUS_COLORS[entry.status]?.border ?? "#9CA3AF"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartSection>

      {/* Time spent per label */}
      <ChartSection title="Time Spent per Label">
        {timePerLabelData.length === 0 ? (
          <EmptyChart message="No time tracked yet" />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(120, timePerLabelData.length * 36)}>
            <BarChart data={timePerLabelData} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
              <XAxis type="number" tickFormatter={(v) => formatDuration(v as number)} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatDuration(v as number)} />
              <Bar dataKey="seconds" radius={[0, 4, 4, 0]}>
                {timePerLabelData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartSection>

      {/* Status distribution */}
      <ChartSection title="Task Status Distribution">
        {statusData.length === 0 ? (
          <EmptyChart message="No tasks" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartSection>

      {/* Completion trend */}
      <ChartSection title="Task Completion Trend">
        {!hasCompletionData ? (
          <EmptyChart message="No completed tasks in this range" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={completionData} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2EE" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6B5ECD" strokeWidth={2} dot={{ r: 3 }} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartSection>
    </div>
  );
}
