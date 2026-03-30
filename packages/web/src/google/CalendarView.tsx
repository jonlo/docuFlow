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
import { useState } from "react";

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
}

function eventStyleGetter(event: RbcEvent) {
  const family = colorIdToFamily(event.resource.colorId, event._index);
  const { bg, border } = EVENT_COLORS[family];
  return {
    style: {
      backgroundColor: bg,
      borderLeft: `3px solid ${border}`,
      borderRadius: "6px",
      color: "#1A1A2E",
      border: "none",
    },
  };
}

function EventBlock({ event }: { event: RbcEvent }): JSX.Element {
  const start  = format(event.start, "HH:mm");
  const end    = format(event.end,   "HH:mm");
  const labels = event.resource.labels ?? [];
  const tasks  = event.tasks;
  return (
    <div className="flex flex-col gap-0.5 overflow-hidden">
      <div className="flex items-center gap-1 overflow-hidden">
        <span className="font-medium text-xs leading-tight truncate">{event.title}</span>
        {labels.slice(0, 3).map((l) => (
          <span
            key={l.id}
            className="inline-flex items-center rounded-full px-1 text-white font-medium flex-shrink-0"
            style={{ backgroundColor: l.color, fontSize: 8, paddingTop: 1, paddingBottom: 1, lineHeight: 1.4 }}
          >
            {l.name}
          </span>
        ))}
        {labels.length > 3 && (
          <span className="flex-shrink-0" style={{ fontSize: 8, color: "#6B6B8A" }}>+{labels.length - 3}</span>
        )}
      </div>
      <span style={{ fontSize: 10, color: "#6B6B8A", lineHeight: 1.2 }}>{start} – {end}</span>
      {tasks.length > 0 && (
        <div className="flex flex-col gap-px mt-0.5">
          {tasks.slice(0, 2).map((t) => (
            <div key={t.id} className="flex items-center gap-1 overflow-hidden">
              <span
                className="w-1 h-1 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    t.status === "in_progress" ? "#6366F1" :
                    t.status === "done"        ? "#34D399" :
                    "#9CA3AF",
                }}
              />
              <span className="truncate" style={{ fontSize: 9, color: "#3D3D5C", lineHeight: 1.3 }}>{t.title}</span>
            </div>
          ))}
          {tasks.length > 2 && (
            <span style={{ fontSize: 9, color: "#6B6B8A" }}>+{tasks.length - 2} more</span>
          )}
        </div>
      )}
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
  const { data: events, isLoading, isError, refetch } = useCalendarEvents();
  const { data: allTasks = [] } = useTasks();
  const openEventModal   = useAppStore((s) => s.openEventModal);
  const openDetailModal  = useAppStore((s) => s.openDetailModal);

  const calendarEvents: RbcEvent[] = (events ?? []).map((e, i) => ({
    id:       e.id,
    title:    e.title,
    start:    new Date(e.start),
    end:      new Date(e.end),
    allDay:   e.allDay,
    resource: e,
    _index:   i,
    tasks:    allTasks.filter((t) => t.eventId === e.id),
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
          eventPropGetter={eventStyleGetter}
          components={{ event: EventBlock }}
        />
      </div>
      <EventFormModal />
      <EventDetailModal />
    </div>
  );
}
