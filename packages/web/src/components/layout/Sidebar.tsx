import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { IntegrationBadge } from "@/components/auth/IntegrationBadge";
import { useTasks } from "@/hooks/useTasks";
import { useStartTimer, usePauseTimer } from "@/hooks/useTaskMutations";
import type { Task } from "@flowdocs/shared";

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

// ── In-progress task row ──────────────────────────────────────────────────────

function TaskRow({ task }: { task: Task }) {
  const startTimer = useStartTimer();
  const pauseTimer = usePauseTimer();
  const running    = task.activeSessionId !== null;

  function handleToggle() {
    if (running && task.activeSessionId) {
      pauseTimer.mutate({ taskId: task.id, sessionId: task.activeSessionId });
    } else {
      startTimer.mutate(task.id);
    }
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-base group">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-base truncate">{task.title}</p>
        <ElapsedTimer totalSeconds={task.totalSeconds} running={running} />
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={startTimer.isPending || pauseTimer.isPending}
        className="p-1 rounded text-text-muted hover:text-accent-primary transition-colors disabled:opacity-50 flex-shrink-0"
        title={running ? "Pause" : "Start"}
      >
        {running ? (
          // Pause icon
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          // Play icon
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>
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

  const { data: allTasks = [] } = useTasks();
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress");
  const waitingTasks    = allTasks.filter((t) => t.status === "pending");

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

      {/* Tasks section */}
      {(inProgressTasks.length > 0 || waitingTasks.length > 0) && (
        <div className="flex flex-col gap-0.5 mt-1">
          {inProgressTasks.length > 0 && (
            <>
              <span className="px-2 text-[10px] font-semibold text-text-muted uppercase tracking-widest mt-1">In Progress</span>
              {inProgressTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </>
          )}
          {waitingTasks.length > 0 && (
            <>
              <span className="px-2 text-[10px] font-semibold text-text-muted uppercase tracking-widest mt-1">Waiting</span>
              {waitingTasks.map((task) => (
                <div key={task.id} className="flex items-center px-2 py-1.5 rounded-lg hover:bg-surface-base">
                  <p className="text-xs text-text-muted truncate">{task.title}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

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
