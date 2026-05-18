import { Calendar, dateFnsLocalizer, type SlotInfo, type ToolbarProps, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { useCalendarEvents } from "./hooks";
import EventFormModal from "./EventFormModal";
import EventDetailModal from "./EventDetailModal";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/styles/calendar.css";
import type { CalendarEvent, Task } from "@flowdocs/shared";
import { useAppStore } from "@/stores/appStore";
import { useTasks } from "@/hooks/useTasks";
import { useState, useEffect, useRef } from "react";
import { TaskDetailDialog } from "@/tasks/TaskDetailDialog";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "en-US": enUS },
});

type EventFamily = "lavender" | "sky" | "mint" | "peach";

const EVENT_COLORS: Record<EventFamily, { bg: string; border: string }> = {
  lavender: { bg: "#E8E4FF", border: "#C4BAFF" },
  sky:      { bg: "#DFF0FF", border: "#93C5FD" },
  mint:     { bg: "#DFFAF0", border: "#6EE7B7" },
  peach:    { bg: "#FFF0E8", border: "#FDBA74" },
};

const FAMILIES: EventFamily[] = ["lavender", "sky", "mint", "peach"];

const COLOR_ID_MAP: Record<string, EventFamily> = {
  "1":  "lavender",
  "2":  "peach",
  "3":  "mint",
  "4":  "peach",
  "5":  "sky",
  "6":  "peach",
  "7":  "mint",
  "8":  "sky",
  "9":  "sky",
  "10": "mint",
  "11": "peach",
};

// ── Consistent task status colors (used everywhere: calendar, sidebar, table) ─

export const TASK_STATUS_COLORS: Record<string, { bg: string; border: string; dot: string; text: string }> = {
  in_progress: { bg: "#EFF6FF", border: "#3B82F6", dot: "#3B82F6", text: "#1D4ED8" },
  done:        { bg: "#F0FDF4", border: "#22C55E", dot: "#22C55E", text: "#15803D" },
  pending:     { bg: "#FFFBEB", border: "#F59E0B", dot: "#F59E0B", text: "#B45309" },
  blocked:     { bg: "#FFFBEB", border: "#F59E0B", dot: "#F59E0B", text: "#B45309" },
};

function taskStatusColor(status: string) {
  return TASK_STATUS_COLORS[status] ?? TASK_STATUS_COLORS["pending"]!;
}

function colorIdToFamily(colorId: string | undefined | null, index: number): EventFamily {
  const mapped = colorId ? COLOR_ID_MAP[colorId] : undefined;
  return mapped ?? FAMILIES[index % FAMILIES.length]!;
}

interface RbcEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  type: "event" | "task";
  resource?: CalendarEvent;
  task?: Task;
  _index: number;
  tasks: Task[];        // linked tasks (only for type === "event")
  isFlashing: boolean;
  view: View;
}

// Small task icon to distinguish task blocks from event blocks
function TaskIcon() {
  return (
    <svg
      width="9" height="9" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function EventBlock({ event }: { event: RbcEvent }): JSX.Element {
  const start = format(event.start, "HH:mm");
  const end   = format(event.end,   "HH:mm");

  const rootRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const wrapper = rootRef.current?.closest(".rbc-event") as HTMLElement | null;
    const target  = wrapper ?? rootRef.current;
    if (!target) return;
    const obs = new ResizeObserver(() => setHeight(target.offsetHeight));
    obs.observe(target);
    setHeight(target.offsetHeight);
    return () => obs.disconnect();
  }, []);

  const tall = height >= 72;

  // ── Task block ───────────────────────────────────────────────────────────────
  if (event.type === "task" && event.task) {
    const colors = taskStatusColor(event.task.status);
    return (
      <div data-testid="calendar-event" data-task="true" ref={rootRef} className="flex items-center gap-1 overflow-hidden h-full" style={{ color: colors.text }}>
        <TaskIcon />
        <span className="font-medium text-xs leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
          {event.title}
        </span>
      </div>
    );
  }

  // ── Event block ──────────────────────────────────────────────────────────────
  const labels  = event.resource?.labels ?? [];
  const tasks   = event.tasks;
  const isDayView = event.view === "day";

  const labelChips = labels.slice(0, 3).map((l) => (
    <span
      key={l.id}
      className="inline-flex items-center rounded-full px-1 text-white font-medium flex-shrink-0"
      style={{ backgroundColor: l.color, fontSize: 8, paddingTop: 1, paddingBottom: 1, lineHeight: 1.4 }}
    >
      {l.name}
    </span>
  ));

  const taskDots = tasks.length > 0 && (
    <div className="flex items-center gap-1 flex-wrap">
      {tasks.slice(0, 4).map((t) => (
        <span
          key={t.id}
          title={t.title}
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: taskStatusColor(t.status).dot }}
        />
      ))}
      {tasks.length > 4 && (
        <span style={{ fontSize: 8, color: "#6B6B8A", lineHeight: 1 }}>+{tasks.length - 4}</span>
      )}
    </div>
  );

  if (!tall) {
    return (
      <div data-testid="calendar-event" ref={rootRef} className="flex flex-col gap-0.5 overflow-hidden h-full">
        <div className="flex items-center gap-1 overflow-hidden" style={{ flexWrap: "nowrap" }}>
          <span
            className="font-medium text-xs leading-tight flex-shrink-0 whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ maxWidth: "55%" }}
          >
            {event.title}
          </span>
          {labelChips}
          {labels.length > 3 && (
            <span className="flex-shrink-0" style={{ fontSize: 8, color: "#6B6B8A" }}>+{labels.length - 3}</span>
          )}
          {tasks.length > 0 && !isDayView && taskDots}
          {tasks.length > 0 && isDayView && tasks.map((t) => (
            <span key={t.id} className="flex items-center gap-0.5 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: taskStatusColor(t.status).dot }} />
              <span className="whitespace-nowrap" style={{ fontSize: 9, color: "#3D3D5C" }}>{t.title}</span>
            </span>
          ))}
        </div>
        <span style={{ fontSize: 10, color: "#6B6B8A", lineHeight: 1.2 }}>{start} – {end}</span>
      </div>
    );
  }

  return (
    <div data-testid="calendar-event" ref={rootRef} className="flex flex-col gap-0.5 overflow-hidden h-full">
      <span className="font-medium text-xs leading-tight truncate">{event.title}</span>
      {labels.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {labelChips}
          {labels.length > 3 && (
            <span className="flex-shrink-0" style={{ fontSize: 8, color: "#6B6B8A" }}>+{labels.length - 3}</span>
          )}
        </div>
      )}
      {tasks.length > 0 && (
        <div className="flex flex-col gap-px overflow-hidden">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: taskStatusColor(t.status).dot }} />
              <span style={{ fontSize: 9, color: "#3D3D5C", lineHeight: 1.3 }}>{t.title}</span>
            </div>
          ))}
        </div>
      )}
      <span style={{ fontSize: 10, color: "#6B6B8A", lineHeight: 1.2 }}>{start} – {end}</span>
    </div>
  );
}


function CalendarToolbar({ label, onNavigate, onView, view }: ToolbarProps<RbcEvent>) {
  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button type="button" onClick={() => onNavigate("TODAY")}>Today</button>
        <button type="button" onClick={() => onNavigate("PREV")}>Back</button>
        <button type="button" onClick={() => onNavigate("NEXT")}>Next</button>
      </span>
      <span data-testid="calendar-header" className="rbc-toolbar-label">{label}</span>
      <span className="rbc-btn-group">
        {(["month", "week", "day"] as View[]).map((v) => (
          <button key={v} type="button" className={view === v ? "rbc-active" : ""} onClick={() => onView(v)}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </span>
    </div>
  );
}

export function CalendarView(): JSX.Element {
  const [view, setView] = useState<View>("day");
  const [date, setDate] = useState(new Date());
  const [flashEventId, setFlashEventId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: events, isLoading, isError, refetch } = useCalendarEvents();
  const { data: allTasks = [] } = useTasks();
  const openEventModal      = useAppStore((s) => s.openEventModal);
  const openDetailModal     = useAppStore((s) => s.openDetailModal);
  const openTaskModal       = useAppStore((s) => s.openTaskModal);
  const highlightEventId    = useAppStore((s) => s.highlightEventId);
  const setHighlightEventId = useAppStore((s) => s.setHighlightEventId);
  const highlightTaskId     = useAppStore((s) => s.highlightTaskId);
  const setHighlightTaskId  = useAppStore((s) => s.setHighlightTaskId);
  const setActivePage       = useAppStore((s) => s.setActivePage);

  useEffect(() => {
    if (!highlightEventId || !events) return;
    const ev = events.find((e) => e.id === highlightEventId);
    setHighlightEventId(null);
    if (!ev) return;
    setActivePage("calendar");
    setDate(new Date(ev.start));
    setFlashEventId(ev.id);
  }, [highlightEventId, events, setHighlightEventId, setActivePage]);

  useEffect(() => {
    if (!highlightTaskId) return;
    const task = allTasks.find((t) => t.id === highlightTaskId);
    setHighlightTaskId(null);
    if (!task?.start) return;
    setDate(new Date(task.start));
    setFlashEventId(`task-${task.id}`);
  }, [highlightTaskId, allTasks, setHighlightTaskId]);

  useEffect(() => {
    if (!flashEventId) return;
    const timer = setTimeout(() => setFlashEventId(null), 1400);
    return () => clearTimeout(timer);
  }, [flashEventId]);

  function eventPropGetter(event: RbcEvent) {
    const base = {
      "data-testid": "calendar-event",
      "data-task": event.type === "task" ? "true" : undefined,
    } as Record<string, string | undefined>;

    // Task blocks: status-based color
    if (event.type === "task" && event.task) {
      const colors = taskStatusColor(event.task.status);
      return {
        ...base,
        className: event.isFlashing ? "rbc-event-flash" : undefined,
        style: {
          backgroundColor: colors.bg,
          borderLeft: `3px solid ${colors.border}`,
          borderRadius: "6px",
          color: colors.text,
          border: "none",
        },
      };
    }
    // Event blocks: Google Calendar color family
    const family = colorIdToFamily(event.resource?.colorId, event._index);
    const { bg, border } = EVENT_COLORS[family];
    return {
      ...base,
      className: event.isFlashing ? "rbc-event-flash" : undefined,
      style: {
        backgroundColor: bg,
        borderLeft: `3px solid ${border}`,
        borderRadius: "6px",
        color: "#1A1A2E",
        border: "none",
      },
    };
  }

  const calendarEvents: RbcEvent[] = [
    // Google Calendar events
    ...(events ?? []).map((e, i) => ({
      id:         e.id,
      title:      e.title,
      start:      new Date(e.start),
      end:        new Date(e.end),
      allDay:     e.allDay,
      type:       "event" as const,
      resource:   e,
      _index:     i,
      tasks:      allTasks.filter((t) => t.eventId === e.id),
      isFlashing: flashEventId === e.id,
      view,
    })),
    // Standalone tasks (no event, have start + end)
    ...allTasks
      .filter((t) => !t.eventId && t.start && t.end)
      .map((t) => ({
        id:         `task-${t.id}`,
        title:      t.title,
        start:      new Date(t.start!),
        end:        new Date(t.end!),
        allDay:     false,
        type:       "task" as const,
        task:       t,
        _index:     0,
        tasks:      [],
        isFlashing: flashEventId === `task-${t.id}`,
        view,
      })),
  ];

  function handleSelectSlot(slot: SlotInfo) {
    const start = (slot.start as Date).toISOString();
    const end   = (slot.end   as Date).toISOString();
    openEventModal("create", { start, end });
  }

  function handleSelectEvent(event: RbcEvent) {
    if (event.type === "task" && event.task) {
      setFlashEventId(event.id);
      openTaskModal("edit", { title: event.task.title, status: event.task.status, eventId: event.task.eventId }, event.task.id);
    } else if (event.resource) {
      openDetailModal(event.resource);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-surface-border rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted">
        <p>Could not load events.</p>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 bg-surface-overlay hover:bg-surface-border text-text-base rounded-lg text-sm transition-colors border border-surface-border"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div data-testid="calendar-view" className="flowdocs-calendar flex flex-col h-full p-4 gap-3">
      <div className="hidden sm:flex items-center justify-end">
        <button
          type="button"
          onClick={() => openTaskModal("create")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90 transition-colors"
        >
          New Task
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          views={["month", "week", "day"]}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          style={{ height: "100%" }}
          scrollToTime={new Date(1970, 1, 1, 8)}
          enableAutoScroll
          eventPropGetter={eventPropGetter}
          components={{ event: EventBlock, toolbar: CalendarToolbar }}
        />
      </div>
      <EventFormModal />
      <EventDetailModal />
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
