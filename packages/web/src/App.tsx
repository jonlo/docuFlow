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

function HamburgerIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function App(): JSX.Element {
  const { selectedTaskId, activePage, documentPage, mobileSidebarOpen, setMobileSidebarOpen } = useAppStore();

  return (
    <AuthGate>
      <div className="app-shell">
        <Sidebar />
        {mobileSidebarOpen && (
          <div
            className="sidebar-overlay"
            data-testid="sidebar-overlay"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        <main className="main-content">
          <div className="mobile-header" data-testid="mobile-header">
            <button
              type="button"
              data-testid="mobile-menu-button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="p-1.5 rounded-lg text-text-muted hover:bg-surface-base transition-colors"
            >
              <HamburgerIcon />
            </button>
            <span className="font-display font-bold text-sm tracking-wide text-text-base">FlowDocs</span>
          </div>
          <div
            className="flex-1 min-h-0 overflow-hidden"
            data-testid={
              activePage === "labels" ? "labels-page" :
              activePage === "tasks" ? "tasks-page" :
              activePage === "reports" ? "reports-page" :
              "calendar-page"
            }
          >
            {activePage === "labels" ? <LabelsPage /> :
             activePage === "tasks" ? <TaskListView /> :
             activePage === "reports" ? <ReportsPage /> :
             <CalendarView />}
          </div>
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
