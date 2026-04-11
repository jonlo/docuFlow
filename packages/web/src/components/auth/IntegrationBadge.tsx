import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import { useAuthStatus } from "@/google/hooks";
import type { IntegrationProvider } from "@flowdocs/shared";

const PROVIDER_LABEL: Record<IntegrationProvider, string> = {
  google:     "Google",
  notion:     "Notion",
  confluence: "Confluence",
};

interface Props { provider: IntegrationProvider; }

export function IntegrationBadge({ provider }: Props): JSX.Element {
  const { data: auth } = useAuthStatus();
  const queryClient    = useQueryClient();
  const popupRef       = useRef<Window | null>(null);
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);

  const integration = auth?.[provider];
  const connected   = !!integration?.connected;
  const label       = PROVIDER_LABEL[provider];

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  async function handleConnect() {
    const urlPath = provider === "google"
      ? "/api/auth/google/url"
      : provider === "notion"
        ? "/api/auth/notion/url"
        : "/api/auth/confluence/url";
    const { url } = await apiFetch<{ url: string }>(urlPath);
    popupRef.current = window.open(url, `${provider}-oauth`, "width=500,height=650");

    pollRef.current = setInterval(async () => {
      if (popupRef.current?.closed) { stopPolling(); return; }
      try {
        const status = await apiFetch<Record<string, { connected: boolean }>>("/api/auth/status");
        if (status[provider]?.connected) {
          stopPolling();
          popupRef.current?.close();
          queryClient.invalidateQueries({ queryKey: ["authStatus"] });
          if (provider === "google") {
            queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
          }
        }
      } catch { /* ignore */ }
    }, 2000);
  }

  async function handleDisconnect() {
    const path = provider === "confluence" ? "/api/auth/confluence" : `/api/auth/${provider}`;
    await apiFetch(path, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["authStatus"] });
    if (provider === "google") {
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
    }
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-base transition-colors group">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={[
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            connected ? "bg-green-400" : "bg-surface-border",
          ].join(" ")}
        />
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium text-text-base leading-tight">{label}</span>
          {connected && integration?.accountEmail && (
            <span className="text-[10px] text-text-muted truncate leading-tight">
              {integration.accountEmail}
            </span>
          )}
          {!connected && (
            <span className="text-[10px] text-text-muted leading-tight">Not connected</span>
          )}
        </div>
      </div>

      {connected ? (
        <button
          onClick={handleDisconnect}
          className="text-[10px] text-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1"
          title={`Disconnect ${label}`}
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={handleConnect}
          className="text-[10px] text-accent-primary hover:text-accent-primary/80 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1"
          title={`Connect ${label}`}
        >
          Connect
        </button>
      )}
    </div>
  );
}
