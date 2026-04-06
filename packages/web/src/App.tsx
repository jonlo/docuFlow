import { useAppStore } from "@/stores/appStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { CalendarView } from "@/components/calendar/CalendarView";
import { TaskPanel } from "@/components/tasks/TaskPanel";
import { AuthGate } from "@/components/auth/AuthGate";
import { LabelsPage } from "@/components/labels/LabelsPage";
import TaskFormModal from "@/tasks/TaskFormModal";
import TaskListView from "@/tasks/TaskListView";
import ReportsPage from "@/reports/ReportsPage";
import DocumentEditorPage from "@/documents/DocumentEditorPage";

export default function App(): JSX.Element {
  const { selectedTaskId, activePage, documentPage } = useAppStore();

  return (
    <AuthGate>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          {activePage === "labels" ? <LabelsPage /> : activePage === "tasks" ? <TaskListView /> : activePage === "reports" ? <ReportsPage /> : <CalendarView />}
        </main>
        {selectedTaskId && (
          <aside className="task-panel">
            <TaskPanel taskId={selectedTaskId} />
          </aside>
        )}
      </div>
      <TaskFormModal />
      {documentPage && <DocumentEditorPage />}
    </AuthGate>
  );
}
