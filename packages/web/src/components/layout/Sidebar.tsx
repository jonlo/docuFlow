import { useAppStore } from "@/stores/appStore";
import { IntegrationBadge } from "@/components/auth/IntegrationBadge";

export function Sidebar(): JSX.Element {
  const openEventModal = useAppStore((s) => s.openEventModal);

  return (
    <aside className="flex flex-col gap-1 h-full bg-surface-raised border-r border-surface-border px-3 py-4">
      <div className="font-display font-bold text-sm tracking-wide text-text-base mb-4 px-2">
        FlowDocs
      </div>

      <button
        onClick={() => openEventModal("create")}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
      >
        <span className="text-base leading-none">+</span>
        New Event
      </button>

      <div className="mt-auto flex flex-col gap-1">
        <IntegrationBadge provider="google" />
        <IntegrationBadge provider="notion" />
        <IntegrationBadge provider="confluence" />
      </div>
    </aside>
  );
}
