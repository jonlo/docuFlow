import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Integration, Task } from "@flowdocs/shared";

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
    }),
    { name: "FlowDocs" }
  )
);
