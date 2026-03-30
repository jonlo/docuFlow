import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { useCreateTask, useDeleteTask, useUpdateTask } from "@/hooks/useTaskMutations";
import { useQueryClient } from "@tanstack/react-query";
import type { CalendarEvent, Task } from "@flowdocs/shared";

type UIStatus = "waiting" | "in_progress" | "completed";

const STATUS_LABELS: Record<UIStatus, string> = {
  waiting:     "Waiting",
  in_progress: "In Progress",
  completed:   "Completed",
};

// UI status ↔ DB status mapping
function toDbStatus(s: UIStatus): Task["status"] {
  if (s === "waiting")   return "pending";
  if (s === "completed") return "done";
  return "in_progress";
}


export default function TaskFormModal() {
  const { taskModal, closeTaskModal } = useAppStore((s) => ({
    taskModal:      s.taskModal,
    closeTaskModal: s.closeTaskModal,
  }));

  const { open, mode, initialData, taskId } = taskModal;

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const qc         = useQueryClient();

  const [title, setTitle]           = useState("");
  const [status, setStatus]         = useState<UIStatus>("waiting");
  const [titleError, setTitleError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Resolve linked event title from cache
  const cachedEvents = qc.getQueryData<CalendarEvent[]>(["calendarEvents"]) ?? [];
  const linkedEvent  = initialData?.eventId
    ? cachedEvents.find((e) => e.id === initialData.eventId)
    : undefined;

  useEffect(() => {
    if (!open) return;
    setTitle(initialData?.title ?? "");
    setStatus((initialData?.status as UIStatus | undefined) ?? "waiting");
    setTitleError("");
    setSubmitError("");
    setConfirmDelete(false);
  }, [open, initialData]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeTaskModal(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, closeTaskModal]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setTitleError("Title is required"); return; }
    setTitleError("");
    setSubmitError("");

    try {
      if (mode === "create") {
        await createTask.mutateAsync({
          title: title.trim(),
          status: toDbStatus(status),
          eventId: initialData?.eventId,
        });
      } else if (taskId) {
        await updateTask.mutateAsync({
          id: taskId,
          body: { title: title.trim(), status: toDbStatus(status) },
        });
      }
      closeTaskModal();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleDelete() {
    if (!taskId) return;
    try {
      await deleteTask.mutateAsync(taskId);
      closeTaskModal();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const isPending = createTask.isPending || updateTask.isPending || deleteTask.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onMouseDown={(e) => { if (e.target === e.currentTarget) closeTaskModal(); }}
    >
      <div className="bg-surface-raised w-full max-w-sm rounded-xl shadow-xl border border-surface-border p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-text-base font-semibold text-base">
            {mode === "create" ? "New Task" : "Edit Task"}
          </h2>
          <button type="button" onClick={closeTaskModal}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-base hover:bg-surface-base transition-colors" aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Linked event chip */}
          {linkedEvent && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Event:</span>
              <span className="text-xs bg-accent-muted text-accent-primary rounded-full px-2 py-0.5 font-medium truncate max-w-[200px]">
                {linkedEvent.title}
              </span>
            </div>
          )}
          {initialData?.eventId && !linkedEvent && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Linked to event</span>
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="border border-surface-border rounded-lg px-3 py-2 text-sm text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
              autoFocus
            />
            {titleError && <span className="text-xs text-red-500">{titleError}</span>}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Status</label>
            <div className="flex gap-1">
              {(["waiting", "in_progress", "completed"] as UIStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={[
                    "flex-1 text-xs py-1.5 rounded-lg border transition-colors font-medium",
                    status === s
                      ? "bg-accent-primary text-white border-accent-primary"
                      : "bg-surface-base text-text-muted border-surface-border hover:border-accent-primary/50",
                  ].join(" ")}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {submitError && <span className="text-xs text-red-500">{submitError}</span>}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            {mode === "edit" ? (
              <div>
                {confirmDelete ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-text-muted text-xs">Delete this task?</span>
                    <button type="button" onClick={handleDelete} disabled={isPending}
                      className="text-red-500 hover:text-red-600 text-xs font-medium disabled:opacity-50">Confirm</button>
                    <button type="button" onClick={() => setConfirmDelete(false)}
                      className="text-text-muted text-xs hover:text-text-base">Cancel</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)}
                    className="text-xs text-red-500 hover:text-red-600 transition-colors">Delete</button>
                )}
              </div>
            ) : <div />}
            <div className="flex gap-2">
              <button type="button" onClick={closeTaskModal}
                className="px-3 py-1.5 text-sm rounded-lg border border-surface-border text-text-muted hover:bg-surface-base transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isPending}
                className="px-3 py-1.5 text-sm rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90 disabled:opacity-50 transition-colors">
                {isPending ? "Saving…" : mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
