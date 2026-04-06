import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { IntegrationBadge } from "@/components/auth/IntegrationBadge";
import { useTasks } from "@/hooks/useTasks";
import { usePauseTimer, useStartTimer, useUpdateTask } from "@/hooks/useTaskMutations";
import type { Task } from "@flowdocs/shared";

// ── Icons ────────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Elapsed timer display ─────────────────────────────────────────────────────

function ElapsedTimer({ totalSeconds, running }: { totalSeconds: number; running: boolean }) {
  const [elapsed, setElapsed] = useState(totalSeconds);

  useEffect(() => {
    setElapsed(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const h = Math.floor(elapsed / 3600).toString().padStart(2, "0");
  const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  return <span className="text-xs text-text-muted font-mono">{h}:{m}:{s}</span>;
}

// ── Status colours ────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  in_progress: "#3B82F6", // blue-500
  pending:     "#F59E0B", // amber-500
  blocked:     "#F59E0B",
  done:        "#22C55E", // green-500
};

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

// ── Task row ──────────────────────────────────────────────────────────────────
function TaskRow({ task }: { task: Task }): JSX.Element {
  const startTimer          = useStartTimer();
  const pauseTimer          = usePauseTimer();
  const updateTask          = useUpdateTask();
  const setHighlightEventId = useAppStore((s) => s.setHighlightEventId);
  const setActivePage       = useAppStore((s) => s.setActivePage);

  const running = task.activeSessionId !== null;
  const disabled = startTimer.isPending || pauseTimer.isPending || updateTask.isPending;

  async function handleStart(e: React.MouseEvent): Promise<void> {
    e.stopPropagation();
    await startTimer.mutateAsync(task.id);
    await updateTask.mutateAsync({ id: task.id, body: { status: "in_progress" } });
  }

  async function handlePause(e: React.MouseEvent): Promise<void> {
    e.stopPropagation();
    if (!task.activeSessionId) return;
    await pauseTimer.mutateAsync({ taskId: task.id, sessionId: task.activeSessionId });
    await updateTask.mutateAsync({ id: task.id, body: { status: "pending" } });
  }

  async function handleComplete(e: React.MouseEvent): Promise<void> {
    e.stopPropagation();
    if (running && task.activeSessionId) {
      await pauseTimer.mutateAsync({ taskId: task.id, sessionId: task.activeSessionId });
    }
    await updateTask.mutateAsync({ id: task.id, body: { status: "done" } });
  }

  function handleNavigate(): void {
    if (!task.eventId) return;
    setActivePage("calendar");
    setHighlightEventId(task.eventId);
  }

  const dotColor = STATUS_DOT[task.status] ?? "#9CA3AF";

  return (
    <div
      role={task.eventId ? "button" : undefined}
      tabIndex={task.eventId ? 0 : undefined}
      onClick={handleNavigate}
      onKeyDown={task.eventId ? (e) => { if (e.key === "Enter") handleNavigate(); } : undefined}
      className={[
        "px-2 py-1.5 rounded-lg hover:bg-surface-base group flex items-center gap-2",
        task.eventId ? "cursor-pointer" : "cursor-default",
      ].join(" ")}
      style={{ borderLeft: `2px solid ${dotColor}` }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-base truncate">{task.title}</p>
        {task.status === "in_progress" && (
          <ElapsedTimer totalSeconds={task.totalSeconds} running={running} />
        )}
        {task.status === "done" && task.totalSeconds > 0 && (
          <span className="text-xs text-text-muted font-mono">{formatSeconds(task.totalSeconds)}</span>
        )}
        {task.documents.length > 0 && (
          <div className="flex flex-col gap-0.5 mt-0.5">
            {task.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] text-accent-primary hover:underline truncate"
              >
                {doc.title}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Action icons */}
      {task.status !== "done" && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status === "in_progress" && running && (
            <button
              type="button"
              title="Pause"
              onClick={handlePause}
              disabled={disabled}
              className="p-1 rounded text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-50"
            >
              <PauseIcon />
            </button>
          )}
          {(task.status === "pending" || task.status === "blocked" || (task.status === "in_progress" && !running)) && (
            <button
              type="button"
              title="Start"
              onClick={handleStart}
              disabled={disabled}
              className="p-1 rounded text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <PlayIcon />
            </button>
          )}
          <button
            type="button"
            title="Complete"
            onClick={handleComplete}
            disabled={disabled}
            className="p-1 rounded text-green-500 hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            <CheckIcon />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar(): JSX.Element {
  const openEventModal  = useAppStore((s) => s.openEventModal);
  const openTaskModal   = useAppStore((s) => s.openTaskModal);
  const activePage      = useAppStore((s) => s.activePage);
  const setActivePage   = useAppStore((s) => s.setActivePage);

  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [sectionsOpen, setSectionsOpen] = useState<{
    in_progress: boolean;
    waiting: boolean;
    completed: boolean;
  }>({ in_progress: true, waiting: true, completed: false });

  const { data: allTasks = [] } = useTasks();
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress");
  const waitingTasks    = allTasks.filter((t) => t.status === "pending" || t.status === "blocked");
  const completedTasks  = allTasks.filter((t) => t.status === "done");

  function toggleSection(key: "in_progress" | "waiting" | "completed"): void {
    setSectionsOpen((s) => ({ ...s, [key]: !s[key] }));
  }

  // Close picker on outside click or Escape
  useEffect(() => {
    if (!pickerOpen) return;
    function handleOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [pickerOpen]);

  function handleNewEvent() {
    setPickerOpen(false);
    setActivePage("calendar");
    openEventModal("create");
  }

  function handleNewTask() {
    setPickerOpen(false);
    openTaskModal("create");
  }

  return (
    <aside className="flex flex-col gap-1 h-full bg-surface-raised border-r border-surface-border px-3 py-4">
      <div className="font-display font-bold text-sm tracking-wide text-text-base mb-4 px-2">
        FlowDocs
      </div>

      {/* New button with picker */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          New
        </button>
        {pickerOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-raised border border-surface-border rounded-lg shadow-lg overflow-hidden z-20">
            <button
              type="button"
              onClick={handleNewEvent}
              className="w-full text-left px-3 py-2 text-sm text-text-base hover:bg-accent-muted transition-colors flex items-center gap-2"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Event
            </button>
            <button
              type="button"
              onClick={handleNewTask}
              className="w-full text-left px-3 py-2 text-sm text-text-base hover:bg-accent-muted transition-colors flex items-center gap-2"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Task
            </button>
          </div>
        )}
      </div>

      {/* Calendar nav */}
      <button
        onClick={() => setActivePage("calendar")}
        className={[
          "text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors border-l-2 mt-1",
          activePage === "calendar"
            ? "bg-accent-muted text-accent-primary border-accent-primary"
            : "text-text-muted border-transparent hover:bg-surface-base hover:text-text-base",
        ].join(" ")}
      >
        Calendar
      </button>

      {/* Tasks section — always shown */}
      <div className="flex flex-col gap-1 mt-1">
        {(
          [
            { key: "in_progress" as const, label: "In Progress", tasks: inProgressTasks, bg: "bg-blue-500/10 hover:bg-blue-500/20", text: "text-blue-600", caret: "text-blue-400" },
            { key: "waiting"     as const, label: "Waiting",     tasks: waitingTasks,    bg: "bg-amber-400/10 hover:bg-amber-400/20", text: "text-amber-600", caret: "text-amber-400" },
            { key: "completed"   as const, label: "Completed",   tasks: completedTasks,  bg: "bg-green-500/10 hover:bg-green-500/20", text: "text-green-600", caret: "text-green-400" },
          ] as const
        ).map(({ key, label, tasks, bg, text, caret }) => (
          <div key={key}>
            <button
              type="button"
              onClick={() => toggleSection(key)}
              className={["w-full flex items-center justify-between px-2 py-1 rounded-lg transition-colors", bg].join(" ")}
            >
              <span className={["text-[10px] font-semibold uppercase tracking-widest", text].join(" ")}>
                {label}
                {tasks.length > 0 && (
                  <span className="ml-1 font-normal opacity-70">({tasks.length})</span>
                )}
              </span>
              <svg
                width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={[sectionsOpen[key] ? "rotate-180" : "", "transition-transform", caret].join(" ")}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {sectionsOpen[key] && tasks.length > 0 && (
              <div className="flex flex-col gap-0.5 mt-0.5 pl-1">
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Config section */}
      <div className="mt-4 px-2">
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Config</span>
      </div>

      <button
        onClick={() => setActivePage("labels")}
        className={[
          "text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors border-l-2",
          activePage === "labels"
            ? "bg-accent-muted text-accent-primary border-accent-primary"
            : "text-text-muted border-transparent hover:bg-surface-base hover:text-text-base",
        ].join(" ")}
      >
        Labels
      </button>

      <div className="mt-auto flex flex-col gap-1">
        <IntegrationBadge provider="google" />
        <IntegrationBadge provider="notion" />
        <IntegrationBadge provider="confluence" />
      </div>
    </aside>
  );
}
