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
import { useLabels } from "@/hooks/useLabels";
import { useSetTaskLabels, useCreateLabel } from "@/hooks/useLabelMutations";
import type { CalendarEvent, Label, Task } from "@flowdocs/shared";

const LABEL_PRESET_COLORS = [
  "#6B5ECD", "#4F9CF9", "#38BFA1", "#F97316",
  "#EC4899", "#EAB308", "#8B5CF6", "#64748B",
];

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

// Format Date → "YYYY-MM-DDTHH:MM" for datetime-local input
function toDatetimeLocal(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultStart(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return toDatetimeLocal(d);
}

function defaultEnd(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toDatetimeLocal(d);
}


export default function TaskFormModal() {
  const { taskModal, closeTaskModal, openDocumentPage } = useAppStore((s) => ({
    taskModal:        s.taskModal,
    closeTaskModal:   s.closeTaskModal,
    openDocumentPage: s.openDocumentPage,
  }));

  const { open, mode, initialData, taskId } = taskModal;

  const createTask     = useCreateTask();
  const updateTask     = useUpdateTask();
  const deleteTask     = useDeleteTask();
  const attachDocument = useAttachDocument();
  const detachDocument = useDetachDocument();
  const setTaskLabels  = useSetTaskLabels();
  const createLabel    = useCreateLabel();
  const qc             = useQueryClient();
  const { data: allLabels = [] } = useLabels();

  const [title, setTitle]               = useState("");
  const [status, setStatus]             = useState<UIStatus>("waiting");
  const [startDt, setStartDt]           = useState(defaultStart);
  const [endDt, setEndDt]               = useState(defaultEnd);
  const [titleError, setTitleError]     = useState("");
  const [dateError, setDateError]       = useState("");
  const [submitError, setSubmitError]   = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Label state
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [labelInput, setLabelInput]         = useState("");
  const [showLabelDrop, setShowLabelDrop]   = useState(false);
  const [creatingLabel, setCreatingLabel]   = useState(false);
  const [newLabelColor, setNewLabelColor]   = useState(LABEL_PRESET_COLORS[0]!);
  const labelSectionRef = useRef<HTMLDivElement>(null);

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

  // isStandalone: no linked event
  const isStandalone = !initialData?.eventId;

  useEffect(() => {
    if (!open) return;
    setTitle(initialData?.title ?? "");
    setStatus((initialData?.status as UIStatus | undefined) ?? "waiting");
    // Date pickers: edit mode fills from currentTask, create mode defaults
    if (mode === "edit" && currentTask?.start) {
      setStartDt(toDatetimeLocal(currentTask.start));
      setEndDt(toDatetimeLocal(currentTask.end ?? currentTask.start));
    } else {
      setStartDt(defaultStart());
      setEndDt(defaultEnd());
    }
    setTitleError("");
    setDateError("");
    setSubmitError("");
    setConfirmDelete(false);
    setSearchInput("");
    setDebouncedSearch("");
    setShowDropdown(false);
    setQueuedDocs([]);
    setSelectedLabels(currentTask?.labels ?? []);
    setLabelInput("");
    setShowLabelDrop(false);
    setCreatingLabel(false);
    setNewLabelColor(LABEL_PRESET_COLORS[0]!);
  }, [open, initialData, mode, currentTask?.start, currentTask?.end, currentTask?.labels]);

  // Close label dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (labelSectionRef.current && !labelSectionRef.current.contains(e.target as Node)) {
        setShowLabelDrop(false);
        setCreatingLabel(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

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
    if (isStandalone && new Date(startDt) >= new Date(endDt)) {
      setDateError("Start must be before end"); return;
    }
    setDateError("");
    setSubmitError("");

    try {
      let savedTaskId = taskId;
      if (mode === "create") {
        const newTask = await createTask.mutateAsync({
          title: title.trim(),
          status: toDbStatus(status),
          eventId: initialData?.eventId,
          ...(isStandalone && { start: new Date(startDt).toISOString(), end: new Date(endDt).toISOString() }),
        });
        savedTaskId = newTask.id;
        // Attach queued docs after creation
        for (const doc of queuedDocs) {
          await attachDocument.mutateAsync({ taskId: newTask.id, doc });
        }
      } else if (taskId) {
        await updateTask.mutateAsync({
          id: taskId,
          body: {
            title: title.trim(),
            status: toDbStatus(status),
            ...(isStandalone && { start: new Date(startDt).toISOString(), end: new Date(endDt).toISOString() }),
          },
        });
      }
      // Apply labels
      if (savedTaskId) {
        await setTaskLabels.mutateAsync({ taskId: savedTaskId, labelIds: selectedLabels.map((l) => l.id) });
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

  const isPending = createTask.isPending || updateTask.isPending || deleteTask.isPending || setTaskLabels.isPending;

  const filteredLabels = allLabels.filter(
    (l) => l.name.toLowerCase().includes(labelInput.toLowerCase()) && !selectedLabels.some((s) => s.id === l.id)
  );

  function addLabel(label: Label) {
    if (selectedLabels.some((s) => s.id === label.id)) return;
    setSelectedLabels((p) => [...p, label]);
    setLabelInput(""); setShowLabelDrop(false); setCreatingLabel(false);
  }

  async function handleCreateLabel() {
    const name = labelInput.trim();
    if (!name) return;
    try {
      const created = await createLabel.mutateAsync({ name, color: newLabelColor });
      addLabel(created);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create label");
    }
  }

  // Documents to display in the list
  const displayDocs: Array<{ id: string; providerDocId: string; title: string; url: string }> =
    mode === "edit"
      ? currentDocs.map((d) => ({ id: d.id, providerDocId: d.providerDocId, title: d.title, url: d.url }))
      : queuedDocs.map((d) => ({ id: d.id, providerDocId: d.id, title: d.title, url: d.url }));

  const searchResults = notionSearch.data ?? [];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/30"
      style={{ zIndex: 60 }}
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

          {/* Labels */}
          <div className="flex flex-col gap-1" ref={labelSectionRef}>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Labels</label>
            {selectedLabels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {selectedLabels.map((l) => (
                  <span key={l.id} className="flex items-center gap-1 text-xs rounded-full px-2 py-0.5 text-white font-medium" style={{ backgroundColor: l.color }}>
                    {l.name}
                    <button type="button" onClick={() => setSelectedLabels((p) => p.filter((x) => x.id !== l.id))} className="hover:opacity-70 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                value={labelInput}
                onChange={(e) => { setLabelInput(e.target.value); setShowLabelDrop(true); setCreatingLabel(false); }}
                onFocus={() => setShowLabelDrop(true)}
                placeholder="Search or create a label"
                className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
              />
              {showLabelDrop && !creatingLabel && (
                <ul className="absolute z-10 mt-1 w-full bg-surface-raised border border-surface-border rounded-lg shadow-lg overflow-hidden">
                  {filteredLabels.map((l) => (
                    <li key={l.id}>
                      <button type="button" onClick={() => addLabel(l)}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent-muted transition-colors">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                        <span className="text-text-base">{l.name}</span>
                      </button>
                    </li>
                  ))}
                  {labelInput.trim() && (
                    <li>
                      <button type="button" onClick={() => setCreatingLabel(true)}
                        className="w-full text-left px-3 py-2 text-sm text-accent-primary hover:bg-accent-muted transition-colors">
                        + Create label "{labelInput.trim()}"
                      </button>
                    </li>
                  )}
                </ul>
              )}
              {creatingLabel && (
                <div className="absolute z-10 mt-1 w-full bg-surface-raised border border-surface-border rounded-lg shadow-lg p-3 flex flex-col gap-2">
                  <span className="text-xs font-medium text-text-muted">Pick a colour for "{labelInput.trim()}"</span>
                  <div className="flex gap-1.5 flex-wrap items-center">
                    {LABEL_PRESET_COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => setNewLabelColor(c)}
                        className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0"
                        style={{ backgroundColor: c, borderColor: newLabelColor === c ? "#1A1A2E" : "transparent" }} />
                    ))}
                    <label
                      className="w-6 h-6 rounded-full border-2 overflow-hidden cursor-pointer transition-transform hover:scale-110 flex-shrink-0 relative"
                      style={{
                        backgroundColor: LABEL_PRESET_COLORS.includes(newLabelColor) ? "#E5E7EB" : newLabelColor,
                        borderColor: !LABEL_PRESET_COLORS.includes(newLabelColor) ? "#1A1A2E" : "transparent",
                      }}
                      title="Custom color"
                    >
                      <input type="color" className="absolute opacity-0 w-full h-full cursor-pointer"
                        value={newLabelColor} onChange={(e) => setNewLabelColor(e.target.value)} />
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setCreatingLabel(false)} className="text-xs text-text-muted">Cancel</button>
                    <button type="button" onClick={handleCreateLabel}
                      className="text-xs px-2 py-1 bg-accent-primary text-white rounded-md">Create</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date/time pickers — standalone tasks only */}
          {isStandalone && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Date &amp; Time</label>
              <div className="flex gap-2">
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="text-[10px] text-text-muted">Start</span>
                  <input
                    type="datetime-local"
                    value={startDt}
                    onChange={(e) => setStartDt(e.target.value)}
                    className="border border-surface-border rounded-lg px-2 py-1.5 text-xs text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40 w-full"
                  />
                </div>
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="text-[10px] text-text-muted">End</span>
                  <input
                    type="datetime-local"
                    value={endDt}
                    onChange={(e) => setEndDt(e.target.value)}
                    className="border border-surface-border rounded-lg px-2 py-1.5 text-xs text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40 w-full"
                  />
                </div>
              </div>
              {dateError && <span className="text-xs text-red-500">{dateError}</span>}
            </div>
          )}

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
                      onClick={(e) => { e.preventDefault(); openDocumentPage({ id: doc.providerDocId, title: doc.title, url: doc.url }); }}
                      className="text-accent-primary hover:underline truncate flex-1 cursor-pointer"
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
