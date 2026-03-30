import { useEffect } from "react";
import { format } from "date-fns";
import { useAppStore } from "@/stores/appStore";

export default function EventDetailModal() {
  const { detailModal, closeDetailModal, openEventModal } = useAppStore((s) => ({
    detailModal:    s.detailModal,
    closeDetailModal: s.closeDetailModal,
    openEventModal: s.openEventModal,
  }));

  const { open, event } = detailModal;

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeDetailModal(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, closeDetailModal]);

  if (!open || !event) return null;

  const start = new Date(event.start);
  const end   = new Date(event.end);
  const dateStr = format(start, "EEE, MMM d, yyyy");
  const timeStr = `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`;

  function handleEdit() {
    if (!event) return;
    closeDetailModal();
    openEventModal(
      "edit",
      {
        title:     event.title,
        start:     event.start,
        end:       event.end,
        attendees: event.attendees ?? [],
        labels:    event.labels ?? [],
      },
      event.id,
      event.googleEventId
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onMouseDown={(e) => { if (e.target === e.currentTarget) closeDetailModal(); }}
    >
      <div className="bg-surface-raised w-full max-w-sm rounded-xl shadow-xl border border-surface-border p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start gap-2">
          <h2 className="text-text-base font-semibold text-base leading-snug flex-1">{event.title}</h2>
          <button
            type="button"
            onClick={handleEdit}
            className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-muted transition-colors flex-shrink-0"
            aria-label="Edit event"
          >
            {/* Pencil icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={closeDetailModal}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-base hover:bg-surface-base transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Date / time */}
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{dateStr} · {timeStr}</span>
        </div>

        {/* Labels */}
        {(event.labels ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(event.labels ?? []).map((l) => (
              <span
                key={l.id}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-white text-xs font-medium"
                style={{ backgroundColor: l.color }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}

        {/* Attendees */}
        {(event.attendees ?? []).length > 0 && (
          <div className="flex items-start gap-2 text-sm text-text-muted">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-text-base">
              {(event.attendees ?? []).map((a) => a.name ?? a.email).join(", ")}
            </span>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="flex items-start gap-2 text-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 text-text-muted">
              <line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" />
            </svg>
            <p className="text-text-base whitespace-pre-wrap">{event.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
