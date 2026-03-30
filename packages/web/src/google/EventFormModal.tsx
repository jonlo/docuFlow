import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { useCreateEvent, useDeleteEvent, useUpdateEvent } from "./useEventMutations";
import { useSetEventLabels, useCreateLabel } from "@/hooks/useLabelMutations";
import { useLabels } from "@/hooks/useLabels";
import { apiFetch } from "@/services/api";
import type { ContactResult, Label } from "@flowdocs/shared";

interface AttendeeChip {
  email: string;
  name?: string;
}

const LABEL_PRESET_COLORS = [
  "#6B5ECD", "#4F9CF9", "#38BFA1", "#F97316",
  "#EC4899", "#EAB308", "#8B5CF6", "#64748B",
];

function toDatetimeLocal(iso: string): string {
  return iso.slice(0, 16);
}

function fromDatetimeLocal(val: string): string {
  return val ? new Date(val).toISOString() : "";
}

export default function EventFormModal() {
  const { eventModal, closeEventModal } = useAppStore((s) => ({
    eventModal: s.eventModal,
    closeEventModal: s.closeEventModal,
  }));

  const { open, mode, initialData, eventId } = eventModal;

  const createEvent   = useCreateEvent();
  const updateEvent   = useUpdateEvent();
  const deleteEvent   = useDeleteEvent();
  const setLabels     = useSetEventLabels();
  const createLabel   = useCreateLabel();
  const { data: allLabels = [] } = useLabels();

  // Form state
  const [title, setTitle]             = useState("");
  const [start, setStart]             = useState("");
  const [end, setEnd]                 = useState("");
  const [attendees, setAttendees]     = useState<AttendeeChip[]>([]);
  const [attendeeInput, setAttendeeInput] = useState("");
  const [suggestions, setSuggestions] = useState<ContactResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Label state
  const [selectedLabels, setSelectedLabels]     = useState<Label[]>([]);
  const [labelInput, setLabelInput]             = useState("");
  const [showLabelDrop, setShowLabelDrop]       = useState(false);
  const [creatingLabel, setCreatingLabel]       = useState(false);
  const [newLabelColor, setNewLabelColor]       = useState(LABEL_PRESET_COLORS[0]!);

  const [titleError, setTitleError]   = useState("");
  const [timeError, setTimeError]     = useState("");
  const [submitError, setSubmitError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const attendeeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labelSectionRef  = useRef<HTMLDivElement>(null);

  // Sync form when modal opens
  useEffect(() => {
    if (!open) return;
    setTitle(initialData?.title ?? "");
    setStart(initialData?.start ? toDatetimeLocal(initialData.start) : "");
    setEnd(initialData?.end ? toDatetimeLocal(initialData.end) : "");
    setAttendees(initialData?.attendees ?? []);
    setSelectedLabels(initialData?.labels ?? []);
    setAttendeeInput("");
    setLabelInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setShowLabelDrop(false);
    setCreatingLabel(false);
    setNewLabelColor(LABEL_PRESET_COLORS[0]!);
    setTitleError("");
    setTimeError("");
    setSubmitError("");
    setConfirmDelete(false);
  }, [open, initialData]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeEventModal(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, closeEventModal]);

  // Close label dropdown when clicking outside the label section
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

  // Debounced contact search
  useEffect(() => {
    if (attendeeDebounce.current) clearTimeout(attendeeDebounce.current);
    if (attendeeInput.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    attendeeDebounce.current = setTimeout(async () => {
      try {
        const results = await apiFetch<ContactResult[]>(`/api/contacts/search?q=${encodeURIComponent(attendeeInput)}`);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch { setSuggestions([]); setShowSuggestions(false); }
    }, 300);
    return () => { if (attendeeDebounce.current) clearTimeout(attendeeDebounce.current); };
  }, [attendeeInput]);

  // ── Attendee helpers ──────────────────────────────────────────────────────────

  function addAttendee(chip: AttendeeChip) {
    if (!chip.email || attendees.some((a) => a.email === chip.email)) return;
    setAttendees((p) => [...p, chip]);
    setAttendeeInput(""); setSuggestions([]); setShowSuggestions(false);
  }

  function handleAttendeeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = attendeeInput.trim().replace(/,$/, "");
      if (val) addAttendee({ email: val });
    }
  }

  // ── Label helpers ─────────────────────────────────────────────────────────────

  const filteredLabels = allLabels.filter(
    (l) =>
      l.name.toLowerCase().includes(labelInput.toLowerCase()) &&
      !selectedLabels.some((s) => s.id === l.id)
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

  // ── Validation & submit ───────────────────────────────────────────────────────

  function validate(): boolean {
    let ok = true;
    if (!title.trim()) { setTitleError("Title is required"); ok = false; } else setTitleError("");
    if (start && end && new Date(end) <= new Date(start)) {
      setTimeError("End time must be after start time"); ok = false;
    } else setTimeError("");
    return ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitError("");

    const body = {
      title: title.trim(),
      start: fromDatetimeLocal(start),
      end: fromDatetimeLocal(end),
      attendees: attendees.length > 0 ? attendees : undefined,
    };

    try {
      let savedEventId = eventId;
      if (mode === "create") {
        const created = await createEvent.mutateAsync(body);
        savedEventId = created.id;
      } else if (eventId) {
        await updateEvent.mutateAsync({ id: eventId, body });
      }

      // Apply labels after event is saved
      if (savedEventId) {
        await setLabels.mutateAsync({ eventId: savedEventId, labelIds: selectedLabels.map((l) => l.id) });
      }

      closeEventModal();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleDelete() {
    if (!eventId) return;
    setSubmitError("");
    try {
      await deleteEvent.mutateAsync(eventId);
      closeEventModal();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (!open) return null;

  const isPending = createEvent.isPending || updateEvent.isPending || deleteEvent.isPending || setLabels.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onMouseDown={(e) => { if (e.target === e.currentTarget) closeEventModal(); }}
    >
      <div className="bg-surface-raised w-full max-w-md rounded-xl shadow-xl border border-surface-border p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-text-base font-semibold text-lg">
            {mode === "create" ? "New Event" : "Edit Event"}
          </h2>
          <button type="button" onClick={closeEventModal} className="text-text-muted hover:text-text-base transition-colors" aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title"
              className="border border-surface-border rounded-lg px-3 py-2 text-sm text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40" />
            {titleError && <span className="text-xs text-red-500">{titleError}</span>}
          </div>

          {/* Start */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Start</label>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)}
              className="border border-surface-border rounded-lg px-3 py-2 text-sm text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40" />
          </div>

          {/* End */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">End</label>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)}
              className="border border-surface-border rounded-lg px-3 py-2 text-sm text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40" />
            {timeError && <span className="text-xs text-red-500">{timeError}</span>}
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
              <input type="text" value={labelInput}
                onChange={(e) => { setLabelInput(e.target.value); setShowLabelDrop(true); setCreatingLabel(false); }}
                onFocus={() => setShowLabelDrop(true)}
                placeholder="Search or create a label"
                className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40" />
              {showLabelDrop && !creatingLabel && (
                <ul
                  className="absolute z-10 mt-1 w-full bg-surface-raised border border-surface-border rounded-lg shadow-lg overflow-hidden"
                >
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
                      <input
                        type="color"
                        className="absolute opacity-0 w-full h-full cursor-pointer"
                        value={newLabelColor}
                        onChange={(e) => setNewLabelColor(e.target.value)}
                      />
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

          {/* Attendees */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Attendees</label>
            {attendees.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {attendees.map((a) => (
                  <span key={a.email} className="flex items-center gap-1 bg-accent-muted text-accent-primary text-xs rounded-full px-2 py-0.5">
                    {a.name ?? a.email}
                    <button type="button" onClick={() => setAttendees((p) => p.filter((x) => x.email !== a.email))}
                      className="hover:text-red-500 transition-colors leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input type="text" value={attendeeInput} onChange={(e) => setAttendeeInput(e.target.value)}
                onKeyDown={handleAttendeeKeyDown} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search contacts or type email, press Enter"
                className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40" />
              {showSuggestions && (
                <ul className="absolute z-10 mt-1 w-full bg-surface-raised border border-surface-border rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <li key={s.email}>
                      <button type="button" onMouseDown={() => addAttendee(s)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent-muted transition-colors">
                        <span className="font-medium text-text-base">{s.name ?? s.email}</span>
                        {s.name && <span className="ml-1 text-text-muted">{s.email}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {submitError && <span className="text-xs text-red-500">{submitError}</span>}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            {mode === "edit" ? (
              <div>
                {confirmDelete ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-text-muted">Delete this event?</span>
                    <button type="button" onClick={handleDelete} disabled={isPending} className="text-red-500 hover:text-red-600 font-medium disabled:opacity-50">Confirm</button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="text-text-muted hover:text-text-base">Cancel</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="text-sm text-red-500 hover:text-red-600 transition-colors">Delete</button>
                )}
              </div>
            ) : <div />}
            <div className="flex gap-2">
              <button type="button" onClick={closeEventModal}
                className="px-4 py-2 text-sm rounded-lg border border-surface-border text-text-muted hover:bg-surface-base transition-colors">Cancel</button>
              <button type="submit" disabled={isPending}
                className="px-4 py-2 text-sm rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90 disabled:opacity-50 transition-colors">
                {isPending ? "Saving…" : mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
