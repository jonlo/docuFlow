import { useState } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { useCalendarEvents } from "./hooks";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "en-US": enUS },
});

export function CalendarView(): JSX.Element {
  const [view, setView]   = useState<View>("week");
  const [date, setDate]   = useState(new Date());
  const { data: events, isLoading, isError, refetch } = useCalendarEvents();

  const calendarEvents = (events ?? []).map((e) => ({
    id:         e.id,
    title:      e.title,
    start:      new Date(e.start),
    end:        new Date(e.end),
    allDay:     e.allDay,
    resource:   e,
  }));

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-zinc-800 rounded" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400">
        <p>Could not load events.</p>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        views={["month", "week", "day"]}
        style={{ height: "100%" }}
      />
    </div>
  );
}
