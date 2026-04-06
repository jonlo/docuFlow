import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import {
  useAttachDocument,
  useCreateTask,
  useDeleteTask,
  useDetachDocument,
  useUpdateTask,
} from "@/hooks/useTaskMutations";
import { useNotionSearch, type NotionSearchResult } from "@/hooks/useNotionSearch";
import { useTasks } from "@/hooks/useTasks";
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

  const createTask     = useCreateTask();
  const updateTask     = useUpdateTask();
  const deleteTask     = useDeleteTask();
  const attachDocument = useAttachDocument();
  const detachDocument = useDetachDocument();
  const qc             = useQueryClient();

  const [title, setTitle]               = useState("");
  const [status, setStatus]             = useState<UIStatus>("waiting");
  const [titleError, setTitleError]     = useState("");
  const [submitError, setSubmitError]   = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Document search
  const [searchInput, setSearchInput]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showDropdown, setShowDropdown]     = useState(false);
  // Create-mode queued docs (not yet persisted)
  const [queuedDocs, setQueuedDocs]         = useState<NotionSearchResult[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search input 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const notionSearch    = useNotionSearch(debouncedSearch);
  const isNotConfigured = (notionSearch.error as (Error & { code?: string }) | null)?.code === "NOTION_NOT_CONFIGURED";

  // Resolve linked event title from cache
  const cachedEvents = qc.getQueryData<CalendarEvent[]>(["calendarEvents"]) ?? [];
  const linkedEvent  = initialData?.eventId
    ? cachedEvents.find((e) => e.id === initialData.eventId)
    : undefined;

  // Reactively get current task documents for edit mode
  const { data: allTasks = [] } = useTasks();
  const currentTask = mode === "edit" && taskId ? allTasks.find((t) => t.id === taskId) : undefined;
  const currentDocs = currentTask?.documents ?? [];

  useEffect(() => {
    if (!open) return;
    setTitle(initialData?.title ?? "");
    setStatus((initialData?.status as UIStatus | undefined) ?? "waiting");
    setTitleError("");
    setSubmitError("");
    setConfirmDelete(false);
    setSearchInput("");
    setDebouncedSearch("");
    setShowDropdown(false);
    setQueuedDocs([]);
  }, [open, initialData]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeTaskModal(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, closeTaskModal]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setTitleError("Title is required"); return; }
    setTitleError("");
    setSubmitError("");

    try {
      if (mode === "create") {
        const newTask = await createTask.mutateAsync({
          title: title.trim(),
          status: toDbStatus(status),
          eventId: initialData?.eventId,
        });
        // Attach queued docs after creation
        for (const doc of queuedDocs) {
          await attachDocument.mutateAsync({ taskId: newTask.id, doc });
        }
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

  async function handleSelectResult(result: NotionSearchResult) {
    setShowDropdown(false);
    setSearchInput("");
    setDebouncedSearch("");

    if (mode === "edit" && taskId) {
      try {
        await attachDocument.mutateAsync({ taskId, doc: result });
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Failed to attach document");
      }
    } else {
      // Create mode: queue unless already queued
      if (!queuedDocs.some((d) => d.id === result.id)) {
        setQueuedDocs((prev) => [...prev, result]);
      }
    }
  }

  async function handleDetach(documentId: string) {
    if (mode === "edit" && taskId) {
      try {
        await detachDocument.mutateAsync({ taskId, documentId });
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Failed to detach document");
      }
    } else {
      setQueuedDocs((prev) => prev.filter((d) => d.id !== documentId));
    }
  }

  const isPending = createTask.isPending || updateTask.isPending || deleteTask.isPending;

  // Documents to display in the list
  const displayDocs: Array<{ id: string; title: string; url: string }> =
    mode === "edit"
      ? currentDocs.map((d) => ({ id: d.id, title: d.title, url: d.url }))
      : queuedDocs.map((d) => ({ id: d.id, title: d.title, url: d.url }));

  const searchResults = notionSearch.data ?? [];

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

          {/* Documents */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Documents</label>

            {/* Attached docs list */}
            {displayDocs.length > 0 && (
              <ul className="flex flex-col gap-1 mb-1">
                {displayDocs.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2 text-xs bg-surface-base rounded-lg px-2 py-1.5 border border-surface-border">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-primary hover:underline truncate flex-1"
                    >
                      {doc.title}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDetach(doc.id)}
                      className="text-text-muted hover:text-red-500 transition-colors flex-shrink-0"
                      aria-label="Detach document"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Search input or "Connect Notion first" */}
            {isNotConfigured ? (
              <p className="text-xs text-text-muted italic">Connect Notion first</p>
            ) : (
              <div ref={searchRef} className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => { if (debouncedSearch.length >= 2) setShowDropdown(true); }}
                  placeholder="Search Notion pages…"
                  className="w-full border border-surface-border rounded-lg px-3 py-2 text-xs text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
                />

                {/* Dropdown */}
                {showDropdown && debouncedSearch.length >= 2 && (
                  <div className="absolute z-10 mt-1 w-full bg-surface-raised border border-surface-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {notionSearch.isLoading && (
                      <div className="px-3 py-2 text-xs text-text-muted">Searching…</div>
                    )}
                    {!notionSearch.isLoading && searchResults.length === 0 && (
                      <div className="px-3 py-2 text-xs text-text-muted">No results</div>
                    )}
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleSelectResult(result); }}
                        className="w-full text-left px-3 py-2 text-xs text-text-base hover:bg-surface-base transition-colors truncate"
                      >
                        {result.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
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
