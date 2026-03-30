import { Calendar, dateFnsLocalizer, type SlotInfo, type View } from "react-big-calendar";
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
  resource: CalendarEvent;
  _index: number;
  tasks: Task[];
  isFlashing: boolean;
  view: View;
}


function taskColor(status: string): string {
  if (status === "in_progress") return "#3B82F6";
  if (status === "done")        return "#22C55E";
  return "#F59E0B";
}

function EventBlock({ event }: { event: RbcEvent }): JSX.Element {
  const start   = format(event.start, "HH:mm");
  const end     = format(event.end,   "HH:mm");
  const labels  = event.resource.labels ?? [];
  const tasks   = event.tasks;
  const isDayView = event.view === "day";

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

  // >= 72px: enough room to show tasks stacked below time
  const tall = height >= 72;

  const labelChips = labels.slice(0, 3).map((l) => (
    <span
      key={l.id}
      className="inline-flex items-center rounded-full px-1 text-white font-medium flex-shrink-0"
      style={{ backgroundColor: l.color, fontSize: 8, paddingTop: 1, paddingBottom: 1, lineHeight: 1.4 }}
    >
      {l.name}
    </span>
  ));

  const taskRows = tasks.map((t) => (
    <div key={t.id} className="flex items-center gap-1">
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: taskColor(t.status) }}
      />
      <span style={{ fontSize: 9, color: "#3D3D5C", lineHeight: 1.3 }}>{t.title}</span>
    </div>
  ));

  const taskDots = tasks.length > 0 && (
    <div className="flex items-center gap-1 flex-wrap">
      {tasks.slice(0, 4).map((t) => (
        <span
          key={t.id}
          title={t.title}
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: taskColor(t.status) }}
        />
      ))}
      {tasks.length > 4 && (
        <span style={{ fontSize: 8, color: "#6B6B8A", lineHeight: 1 }}>+{tasks.length - 4}</span>
      )}
    </div>
  );

  if (!tall) {
    // ── Short card: everything on ONE line, overflow clips from the right
    //    so title (first) has highest priority.
    return (
      <div ref={rootRef} className="flex flex-col gap-0.5 overflow-hidden h-full">
        <div className="flex items-center gap-1 overflow-hidden" style={{ flexWrap: "nowrap" }}>
          {/* Title — flex-shrink-0 so it is never squeezed; truncate if it alone overflows */}
          <span
            className="font-medium text-xs leading-tight flex-shrink-0 whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ maxWidth: "55%" }}
          >
            {event.title}
          </span>
          {/* Labels — flex-shrink-0, clipped by parent overflow if title is long */}
          {labelChips}
          {labels.length > 3 && (
            <span className="flex-shrink-0" style={{ fontSize: 8, color: "#6B6B8A" }}>+{labels.length - 3}</span>
          )}
          {/* Tasks inline — dots for non-day, compact titles for day */}
          {tasks.length > 0 && !isDayView && taskDots}
          {tasks.length > 0 && isDayView && tasks.map((t) => (
            <span key={t.id} className="flex items-center gap-0.5 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: taskColor(t.status) }} />
              <span className="whitespace-nowrap" style={{ fontSize: 9, color: "#3D3D5C" }}>{t.title}</span>
            </span>
          ))}
        </div>
        {/* Time always on its own line — always visible */}
        <span style={{ fontSize: 10, color: "#6B6B8A", lineHeight: 1.2 }}>{start} – {end}</span>
      </div>
    );
  }

  // ── Tall card: stacked rows
  return (
    <div ref={rootRef} className="flex flex-col gap-0.5 overflow-hidden h-full">
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
        <div className="flex flex-col gap-px overflow-hidden">{taskRows}</div>
      )}
      <span style={{ fontSize: 10, color: "#6B6B8A", lineHeight: 1.2 }}>{start} – {end}</span>
    </div>
  );
}

const VIEW_OPTIONS: { label: string; value: View }[] = [
  { label: "Month", value: "month" },
  { label: "Week",  value: "week"  },
  { label: "Day",   value: "day"   },
];

function ViewSwitcher({ view, onChange }: { view: View; onChange: (v: View) => void }): JSX.Element {
  return (
    <div className="flex rounded-lg border border-surface-border overflow-hidden self-start">
      {VIEW_OPTIONS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={[
            "px-3 py-1 text-xs font-medium transition-colors",
            view === value
              ? "bg-accent-primary text-white"
              : "bg-surface-raised text-text-muted hover:bg-accent-muted hover:text-accent-primary",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function CalendarView(): JSX.Element {
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());
  const [flashEventId, setFlashEventId] = useState<string | null>(null);
  const { data: events, isLoading, isError, refetch } = useCalendarEvents();
  const { data: allTasks = [] } = useTasks();
  const openEventModal      = useAppStore((s) => s.openEventModal);
  const openDetailModal     = useAppStore((s) => s.openDetailModal);
  const highlightEventId    = useAppStore((s) => s.highlightEventId);
  const setHighlightEventId = useAppStore((s) => s.setHighlightEventId);
  const setActivePage       = useAppStore((s) => s.setActivePage);

  // When a task's "show in calendar" is triggered, navigate + flash the event
  useEffect(() => {
    if (!highlightEventId || !events) return;
    const ev = events.find((e) => e.id === highlightEventId);
    // Clear immediately so this effect doesn't re-run and cancel the flash
    setHighlightEventId(null);
    if (!ev) return;

    setActivePage("calendar");
    setDate(new Date(ev.start));
    // Flash synchronously — no setTimeout, so cleanup can't race against it
    setFlashEventId(ev.id);
  }, [highlightEventId, events, setHighlightEventId, setActivePage]);

  // Clear flash after animation completes
  useEffect(() => {
    if (!flashEventId) return;
    const timer = setTimeout(() => setFlashEventId(null), 1400);
    return () => clearTimeout(timer);
  }, [flashEventId]);

  function eventPropGetter(event: RbcEvent) {
    const family = colorIdToFamily(event.resource.colorId, event._index);
    const { bg, border } = EVENT_COLORS[family];
    return {
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

  const calendarEvents: RbcEvent[] = (events ?? []).map((e, i) => ({
    id:         e.id,
    title:      e.title,
    start:      new Date(e.start),
    end:        new Date(e.end),
    allDay:     e.allDay,
    resource:   e,
    _index:     i,
    tasks:      allTasks.filter((t) => t.eventId === e.id),
    isFlashing: flashEventId === e.id,
    view,
  }));

  function handleSelectSlot(slot: SlotInfo) {
    const start = (slot.start as Date).toISOString();
    const end   = (slot.end   as Date).toISOString();
    openEventModal("create", { start, end });
  }

  function handleSelectEvent(event: RbcEvent) {
    openDetailModal(event.resource);
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
    <div className="flowdocs-calendar flex flex-col h-full p-4 gap-3">
      <ViewSwitcher view={view} onChange={setView} />
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
          eventPropGetter={eventPropGetter}
          components={{ event: EventBlock }}
        />
      </div>
      <EventFormModal />
      <EventDetailModal />
    </div>
  );
}
