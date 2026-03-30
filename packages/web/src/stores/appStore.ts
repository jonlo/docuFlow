import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CalendarEvent, Integration, Label, Task } from "@flowdocs/shared";

export interface EventFormValues {
  title: string;
  date: string;       // YYYY-MM-DD
  start: string;      // ISO 8601
  end: string;        // ISO 8601
  attendees: { email: string; name?: string }[];
  labels: Label[];
}

interface EventModalState {
  open: boolean;
  mode: "create" | "edit";
  initialData?: Partial<EventFormValues>;
  eventId?: string;
  googleEventId?: string;
}

interface AppState {
  integrations: Integration[];
  setIntegration: (integration: Integration) => void;
  getIntegration: (provider: Integration["provider"]) => Integration | undefined;

  calendarView: "month" | "week" | "day" | "agenda";
  setCalendarView: (view: AppState["calendarView"]) => void;

  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;

  // Local task cache (TanStack Query is the real source of truth)
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;

  eventModal: EventModalState;
  openEventModal: (
    mode: "create" | "edit",
    initialData?: Partial<EventFormValues>,
    eventId?: string,
    googleEventId?: string
  ) => void;
  closeEventModal: () => void;

  activePage: "calendar" | "labels";
  setActivePage: (page: "calendar" | "labels") => void;

  detailModal: { open: boolean; event: CalendarEvent | null };
  openDetailModal: (event: CalendarEvent) => void;
  closeDetailModal: () => void;

  taskModal: {
    open: boolean;
    mode: "create" | "edit";
    taskId?: string;
    initialData?: { eventId?: string; title?: string; status?: string };
  };
  openTaskModal: (
    mode: "create" | "edit",
    initialData?: { eventId?: string; title?: string; status?: string },
    taskId?: string
  ) => void;
  closeTaskModal: () => void;

  highlightEventId: string | null;
  setHighlightEventId: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      integrations: [
        { provider: "google",     connected: false },
        { provider: "notion",     connected: false },
        { provider: "confluence", connected: false },
      ],

      setIntegration: (integration) =>
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.provider === integration.provider ? integration : i
          ),
        })),

      getIntegration: (provider) =>
        get().integrations.find((i) => i.provider === provider),

      calendarView: "week",
      setCalendarView: (view) => set({ calendarView: view }),

      selectedTaskId: null,
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),

      tasks: [],
      setTasks: (tasks) => set({ tasks }),

      eventModal: { open: false, mode: "create" },
      openEventModal: (mode, initialData, eventId, googleEventId) =>
        set({ eventModal: { open: true, mode, initialData, eventId, googleEventId } }),
      closeEventModal: () =>
        set({ eventModal: { open: false, mode: "create" } }),

      activePage: "calendar",
      setActivePage: (page) => set({ activePage: page }),

      detailModal: { open: false, event: null },
      openDetailModal: (event) => set({ detailModal: { open: true, event } }),
      closeDetailModal: () => set({ detailModal: { open: false, event: null } }),

      taskModal: { open: false, mode: "create" },
      openTaskModal: (mode, initialData, taskId) =>
        set({ taskModal: { open: true, mode, initialData, taskId } }),
      closeTaskModal: () => set({ taskModal: { open: false, mode: "create" } }),

      highlightEventId: null,
      setHighlightEventId: (id) => set({ highlightEventId: id }),
    }),
    { name: "FlowDocs" }
  )
);
