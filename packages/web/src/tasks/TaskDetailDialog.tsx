import { useEffect } from "react";
import { format } from "date-fns";
import { useAppStore } from "@/stores/appStore";
import type { Task } from "@flowdocs/shared";

const STATUS_LABEL: Record<string, string> = {
  in_progress: "In Progress",
  pending:     "Waiting",
  blocked:     "Waiting",
  done:        "Completed",
};

const STATUS_COLOR: Record<string, string> = {
  in_progress: "bg-blue-100 text-blue-700",
  pending:     "bg-amber-100 text-amber-700",
  blocked:     "bg-amber-100 text-amber-700",
  done:        "bg-green-100 text-green-700",
};

interface Props {
  task: Task;
  linkedEventTitle?: string;
  onClose: () => void;
}

export function TaskDetailDialog({ task, linkedEventTitle, onClose }: Props): JSX.Element {
  const { openTaskModal } = useAppStore((s) => ({ openTaskModal: s.openTaskModal }));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleEdit() {
    onClose();
    openTaskModal(
      "edit",
      { title: task.title, status: task.status, eventId: task.eventId },
      task.id
    );
  }

  const fmtDt = (iso: string) => {
    try { return format(new Date(iso), "MMM d, yyyy HH:mm"); }
    catch { return iso; }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-raised w-full max-w-sm rounded-xl shadow-xl border border-surface-border p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-text-base font-semibold text-base leading-snug flex-1">{task.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-base hover:bg-surface-base transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Status badge */}
        <span className={["self-start text-xs font-medium px-2 py-0.5 rounded-full", STATUS_COLOR[task.status] ?? "bg-surface-base text-text-muted"].join(" ")}>
          {STATUS_LABEL[task.status] ?? task.status}
        </span>

        {/* Dates */}
        {(task.start || task.end) && (
          <div className="flex flex-col gap-0.5 text-xs text-text-muted">
            {task.start && <span><span className="font-medium text-text-base">Start:</span> {fmtDt(task.start)}</span>}
            {task.end   && <span><span className="font-medium text-text-base">End:</span> {fmtDt(task.end)}</span>}
          </div>
        )}

        {/* Labels */}
        {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.map((l) => (
              <span
                key={l.id}
                className="text-xs rounded-full px-2 py-0.5 text-white font-medium"
                style={{ backgroundColor: l.color }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}

        {/* Linked event */}
        {linkedEventTitle && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">Event:</span>
            <span className="bg-accent-muted text-accent-primary rounded-full px-2 py-0.5 font-medium truncate max-w-[200px]">
              {linkedEventTitle}
            </span>
          </div>
        )}

        {/* Documents */}
        {task.documents.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Documents</span>
            {task.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent-primary hover:underline truncate"
              >
                {doc.title}
              </a>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-1 border-t border-surface-border mt-1">
          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
