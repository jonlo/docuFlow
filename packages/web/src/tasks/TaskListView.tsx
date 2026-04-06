import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useTasks } from "@/hooks/useTasks";
import { useQueryClient } from "@tanstack/react-query";
import type { CalendarEvent, Task } from "@flowdocs/shared";
import { TaskDetailDialog } from "./TaskDetailDialog";

type FilterStatus = "all" | "waiting" | "in_progress" | "completed";
type SortKey = "date" | "title";
type SortDir = "asc" | "desc";

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "waiting",     label: "Waiting" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed",   label: "Completed" },
];

const STATUS_LABEL: Record<string, string> = {
  in_progress: "In Progress",
  pending:     "Waiting",
  blocked:     "Waiting",
  done:        "Completed",
};

const STATUS_DOT: Record<string, string> = {
  in_progress: "#3B82F6",
  pending:     "#F59E0B",
  blocked:     "#F59E0B",
  done:        "#22C55E",
};

function matchesFilter(task: Task, filter: FilterStatus): boolean {
  if (filter === "all") return true;
  if (filter === "waiting")     return task.status === "pending" || task.status === "blocked";
  if (filter === "in_progress") return task.status === "in_progress";
  if (filter === "completed")   return task.status === "done";
  return true;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="opacity-30 ml-1">↕</span>;
  return <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

export default function TaskListView(): JSX.Element {
  const { data: allTasks = [] } = useTasks();
  const qc = useQueryClient();
  const cachedEvents = qc.getQueryData<CalendarEvent[]>(["calendarEvents"]) ?? [];

  const [filter, setFilter]         = useState<FilterStatus>("all");
  const [sortKey, setSortKey]       = useState<SortKey>("date");
  const [sortDir, setSortDir]       = useState<SortDir>("desc");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const rows = useMemo(() => {
    const filtered = allTasks.filter((t) => matchesFilter(t, filter));
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") {
        cmp = a.title.localeCompare(b.title);
      } else {
        const da = a.start ? new Date(a.start).getTime() : 0;
        const db = b.start ? new Date(b.start).getTime() : 0;
        cmp = da - db;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [allTasks, filter, sortKey, sortDir]);

  const selectedEventTitle = selectedTask?.eventId
    ? cachedEvents.find((e) => e.id === selectedTask.eventId)?.title
    : undefined;

  return (
    <div className="flex flex-col h-full bg-surface-base">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-raised">
        <h1 className="text-text-base font-semibold text-lg">Tasks</h1>
        <span className="text-xs text-text-muted">{allTasks.length} total</span>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1 px-6 py-3 border-b border-surface-border bg-surface-raised">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={[
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
              filter === f.value
                ? "bg-accent-primary text-white"
                : "text-text-muted hover:bg-surface-base border border-surface-border",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-surface-border">
              <th
                className="text-left py-2 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wide cursor-pointer select-none hover:text-text-base transition-colors"
                onClick={() => handleSort("title")}
              >
                Title <SortIcon active={sortKey === "title"} dir={sortDir} />
              </th>
              <th className="text-left py-2 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wide w-28">
                Status
              </th>
              <th className="text-left py-2 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wide">
                Event
              </th>
              <th className="text-left py-2 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wide w-20">
                Docs
              </th>
              <th
                className="text-left py-2 text-xs font-semibold text-text-muted uppercase tracking-wide w-36 cursor-pointer select-none hover:text-text-base transition-colors"
                onClick={() => handleSort("date")}
              >
                Date <SortIcon active={sortKey === "date"} dir={sortDir} />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-text-muted">
                  No tasks
                </td>
              </tr>
            )}
            {rows.map((task) => {
              const eventTitle = task.eventId
                ? (cachedEvents.find((e) => e.id === task.eventId)?.title ?? "—")
                : "—";
              const dotColor = STATUS_DOT[task.status] ?? "#9CA3AF";
              const dateStr  = task.start
                ? (() => { try { return format(new Date(task.start), "MMM d, yyyy"); } catch { return "—"; } })()
                : "—";

              return (
                <tr
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="border-b border-surface-border hover:bg-surface-raised cursor-pointer transition-colors group"
                >
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span className="text-text-base font-medium truncate max-w-[200px]">{task.title}</span>
                      {task.labels.slice(0, 3).map((l) => (
                        <span
                          key={l.id}
                          className="text-white text-[10px] font-medium rounded-full px-1.5 py-px flex-shrink-0"
                          style={{ backgroundColor: l.color }}
                        >
                          {l.name}
                        </span>
                      ))}
                      {task.labels.length > 3 && (
                        <span className="text-[10px] text-text-muted flex-shrink-0">+{task.labels.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-xs text-text-muted">{STATUS_LABEL[task.status] ?? task.status}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-xs text-text-muted truncate max-w-[160px] block">{eventTitle}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    {task.documents.length > 0 ? (
                      <span
                        className="text-xs text-accent-primary font-medium"
                        title={task.documents.map((d) => d.title).join(", ")}
                      >
                        {task.documents.length}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <span className="text-xs text-text-muted">{dateStr}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Task detail dialog */}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          linkedEventTitle={selectedEventTitle}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
