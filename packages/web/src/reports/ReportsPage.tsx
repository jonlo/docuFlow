import { useMemo, useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useCalendarEvents } from "@/google/hooks";
import { TaskReportsView } from "./TaskReportsView";
import { EventReportsView } from "./EventReportsView";
import { LabelFilter } from "./LabelFilter";
import type { Label } from "@flowdocs/shared";
import type { TimeRange } from "./reportUtils";

type Tab = "tasks" | "events";

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: "Daily",   value: "daily"   },
  { label: "Weekly",  value: "weekly"  },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly",  value: "yearly"  },
];

export default function ReportsPage(): JSX.Element {
  const [tab, setTab]               = useState<Tab>("tasks");
  const [timeRange, setTimeRange]   = useState<TimeRange>("monthly");
  const [labelFilter, setLabelFilter] = useState<Label[]>([]);

  const { data: allTasks = [] }  = useTasks();
  const { data: allEvents = [] } = useCalendarEvents();

  const filteredTasks = useMemo(() => {
    if (labelFilter.length === 0) return allTasks;
    const ids = new Set(labelFilter.map((l) => l.id));
    return allTasks.filter((t) => t.labels.some((l) => ids.has(l.id)));
  }, [allTasks, labelFilter]);

  const filteredEvents = useMemo(() => {
    if (labelFilter.length === 0) return allEvents;
    const ids = new Set(labelFilter.map((l) => l.id));
    return allEvents.filter((e) => (e.labels ?? []).some((l) => ids.has(l.id)));
  }, [allEvents, labelFilter]);

  return (
    <div className="flex flex-col h-full bg-surface-base">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-raised">
        <h1 className="text-text-base font-semibold text-lg">Reports</h1>
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-surface-border bg-surface-raised flex-wrap">
        {/* Tab switcher */}
        <div className="flex rounded-lg border border-surface-border overflow-hidden">
          {(["tasks", "events"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                "px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                tab === t
                  ? "bg-accent-primary text-white"
                  : "bg-surface-raised text-text-muted hover:bg-accent-muted hover:text-accent-primary",
              ].join(" ")}
            >
              {t === "tasks" ? "Tasks" : "Events"}
            </button>
          ))}
        </div>

        {/* Time range */}
        <div className="flex rounded-lg border border-surface-border overflow-hidden">
          {TIME_RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setTimeRange(r.value)}
              className={[
                "px-3 py-1.5 text-xs font-medium transition-colors",
                timeRange === r.value
                  ? "bg-accent-primary text-white"
                  : "bg-surface-raised text-text-muted hover:bg-accent-muted hover:text-accent-primary",
              ].join(" ")}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Label filter */}
        <LabelFilter selected={labelFilter} onChange={setLabelFilter} />
      </div>

      {/* Charts */}
      <div className="flex-1 overflow-auto px-6 py-5">
        {tab === "tasks" ? (
          <TaskReportsView tasks={filteredTasks} timeRange={timeRange} />
        ) : (
          <EventReportsView events={filteredEvents} timeRange={timeRange} />
        )}
      </div>
    </div>
  );
}
