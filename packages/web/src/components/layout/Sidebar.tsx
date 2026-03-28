import { useAppStore } from "@/stores/appStore";
import { IntegrationBadge } from "@/components/auth/IntegrationBadge";

export function Sidebar(): JSX.Element {
  const { calendarView, setCalendarView } = useAppStore();

  return (
    <aside style={{ background: "#111113", borderRight: "1px solid #2e2e33", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>FlowDocs</div>
      {(["month", "week", "day"] as const).map((v) => (
        <button key={v} onClick={() => setCalendarView(v)}
          style={{ textAlign: "left", padding: "6px 8px", borderRadius: 6, border: "none", cursor: "pointer", background: calendarView === v ? "rgba(99,102,241,0.15)" : "transparent", color: calendarView === v ? "#6366f1" : "#a1a1aa", fontSize: 13 }}>
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        <IntegrationBadge provider="google" />
        <IntegrationBadge provider="notion" />
        <IntegrationBadge provider="confluence" />
      </div>
    </aside>
  );
}
