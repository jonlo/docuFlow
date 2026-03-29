import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { useCreateEvent, useDeleteEvent, useUpdateEvent } from "./useEventMutations";
import { apiFetch } from "@/services/api";
import type { ContactResult } from "@flowdocs/shared";

interface AttendeeChip {
  email: string;
  name?: string;
}

function toDatetimeLocal(iso: string): string {
  // Convert ISO 8601 to value usable by <input type="datetime-local">
  return iso.slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

function fromDatetimeLocal(val: string): string {
  // datetime-local gives "YYYY-MM-DDTHH:mm", add seconds + Z approximation
  return val ? new Date(val).toISOString() : "";
}

export default function EventFormModal() {
  const { eventModal, closeEventModal } = useAppStore((s) => ({
    eventModal: s.eventModal,
    closeEventModal: s.closeEventModal,
  }));

  const { open, mode, initialData, eventId } = eventModal;

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  // Form state
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [attendees, setAttendees] = useState<AttendeeChip[]>([]);
  const [attendeeInput, setAttendeeInput] = useState("");
  const [suggestions, setSuggestions] = useState<ContactResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [timeError, setTimeError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attendeeInputRef = useRef<HTMLInputElement>(null);

  // Sync form when modal opens
  useEffect(() => {
    if (!open) return;
    setTitle(initialData?.title ?? "");
    setStart(initialData?.start ? toDatetimeLocal(initialData.start) : "");
    setEnd(initialData?.end ? toDatetimeLocal(initialData.end) : "");
    setAttendees(initialData?.attendees ?? []);
    setAttendeeInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setTitleError("");
    setTimeError("");
    setSubmitError("");
    setConfirmDelete(false);
  }, [open, initialData]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEventModal();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, closeEventModal]);

  // Debounced contact search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (attendeeInput.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await apiFetch<ContactResult[]>(
          `/api/contacts/search?q=${encodeURIComponent(attendeeInput)}`
        );
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [attendeeInput]);

  function addAttendee(chip: AttendeeChip) {
    if (!chip.email || attendees.some((a) => a.email === chip.email)) return;
    setAttendees((prev) => [...prev, chip]);
    setAttendeeInput("");
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function removeAttendee(email: string) {
    setAttendees((prev) => prev.filter((a) => a.email !== email));
  }

  function handleAttendeeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = attendeeInput.trim().replace(/,$/, "");
      if (val) addAttendee({ email: val });
    }
  }

  function validate(): boolean {
    let ok = true;
    if (!title.trim()) {
      setTitleError("Title is required");
      ok = false;
    } else {
      setTitleError("");
    }
    if (start && end && new Date(end) <= new Date(start)) {
      setTimeError("End time must be after start time");
      ok = false;
    } else {
      setTimeError("");
    }
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
      if (mode === "create") {
        await createEvent.mutateAsync(body);
      } else if (eventId) {
        await updateEvent.mutateAsync({ id: eventId, body });
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

  const isPending =
    createEvent.isPending || updateEvent.isPending || deleteEvent.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeEventModal();
      }}
    >
      <div className="bg-surface-raised w-full max-w-md rounded-xl shadow-xl border border-surface-border p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-text-base font-semibold text-lg">
            {mode === "create" ? "New Event" : "Edit Event"}
          </h2>
          <button
            type="button"
            onClick={closeEventModal}
            className="text-text-muted hover:text-text-base transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              className="border border-surface-border rounded-lg px-3 py-2 text-sm text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
            />
            {titleError && (
              <span className="text-xs text-red-500">{titleError}</span>
            )}
          </div>

          {/* Start */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Start
            </label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="border border-surface-border rounded-lg px-3 py-2 text-sm text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
            />
          </div>

          {/* End */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
              End
            </label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="border border-surface-border rounded-lg px-3 py-2 text-sm text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
            />
            {timeError && (
              <span className="text-xs text-red-500">{timeError}</span>
            )}
          </div>

          {/* Attendees */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Attendees
            </label>
            {attendees.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {attendees.map((a) => (
                  <span
                    key={a.email}
                    className="flex items-center gap-1 bg-accent-muted text-accent-primary text-xs rounded-full px-2 py-0.5"
                  >
                    {a.name ?? a.email}
                    <button
                      type="button"
                      onClick={() => removeAttendee(a.email)}
                      className="hover:text-red-500 transition-colors leading-none"
                      aria-label={`Remove ${a.email}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input
                ref={attendeeInputRef}
                type="text"
                value={attendeeInput}
                onChange={(e) => setAttendeeInput(e.target.value)}
                onKeyDown={handleAttendeeKeyDown}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search contacts or type email, press Enter"
                className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm text-text-base bg-surface-base focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
              />
              {showSuggestions && (
                <ul className="absolute z-10 mt-1 w-full bg-surface-raised border border-surface-border rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <li key={s.email}>
                      <button
                        type="button"
                        onMouseDown={() => addAttendee(s)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent-muted transition-colors"
                      >
                        <span className="font-medium text-text-base">{s.name ?? s.email}</span>
                        {s.name && (
                          <span className="ml-1 text-text-muted">{s.email}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Submit error */}
          {submitError && (
            <span className="text-xs text-red-500">{submitError}</span>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            {/* Delete (edit mode only) */}
            {mode === "edit" && (
              <div>
                {confirmDelete ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-text-muted">Delete this event?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isPending}
                      className="text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-text-muted hover:text-text-base"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-sm text-red-500 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
            {mode === "create" && <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeEventModal}
                className="px-4 py-2 text-sm rounded-lg border border-surface-border text-text-muted hover:bg-surface-base transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Saving…" : mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
