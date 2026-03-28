import { useAppStore } from "@/stores/appStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { CalendarView } from "@/components/calendar/CalendarView";
import { TaskPanel } from "@/components/tasks/TaskPanel";
import { AuthGate } from "@/components/auth/AuthGate";

export default function App(): JSX.Element {
  const { selectedTaskId } = useAppStore();

  return (
    <AuthGate>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <CalendarView />
        </main>
        {selectedTaskId && (
          <aside className="task-panel">
            <TaskPanel taskId={selectedTaskId} />
          </aside>
        )}
      </div>
    </AuthGate>
  );
}
