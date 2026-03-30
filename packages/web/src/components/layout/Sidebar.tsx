import { useAppStore } from "@/stores/appStore";
import { IntegrationBadge } from "@/components/auth/IntegrationBadge";

export function Sidebar(): JSX.Element {
  const openEventModal = useAppStore((s) => s.openEventModal);
  const activePage     = useAppStore((s) => s.activePage);
  const setActivePage  = useAppStore((s) => s.setActivePage);

  return (
    <aside className="flex flex-col gap-1 h-full bg-surface-raised border-r border-surface-border px-3 py-4">
      <div className="font-display font-bold text-sm tracking-wide text-text-base mb-4 px-2">
        FlowDocs
      </div>

      <button
        onClick={() => { setActivePage("calendar"); openEventModal("create"); }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
      >
        <span className="text-base leading-none">+</span>
        New Event
      </button>

      <button
        onClick={() => setActivePage("calendar")}
        className={[
          "text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors border-l-2 mt-1",
          activePage === "calendar"
            ? "bg-accent-muted text-accent-primary border-accent-primary"
            : "text-text-muted border-transparent hover:bg-surface-base hover:text-text-base",
        ].join(" ")}
      >
        Calendar
      </button>

      <div className="mt-4 px-2">
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Config</span>
      </div>

      <button
        onClick={() => setActivePage("labels")}
        className={[
          "text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors border-l-2",
          activePage === "labels"
            ? "bg-accent-muted text-accent-primary border-accent-primary"
            : "text-text-muted border-transparent hover:bg-surface-base hover:text-text-base",
        ].join(" ")}
      >
        Labels
      </button>

      <div className="mt-auto flex flex-col gap-1">
        <IntegrationBadge provider="google" />
        <IntegrationBadge provider="notion" />
        <IntegrationBadge provider="confluence" />
      </div>
    </aside>
  );
}
