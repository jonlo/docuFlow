import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import { useAuthStatus } from "./hooks";

interface Props { children: ReactNode; }

export function AuthGate({ children }: Props): JSX.Element {
  const { data: auth, isLoading } = useAuthStatus();
  const queryClient = useQueryClient();
  const popupRef    = useRef<Window | null>(null);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling(): void {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  useEffect(() => () => stopPolling(), []);

  async function handleConnect(): Promise<void> {
    const { url } = await apiFetch<{ url: string }>("/api/auth/google/url");
    popupRef.current = window.open(url, "google-oauth", "width=500,height=650");

    pollRef.current = setInterval(async () => {
      // Stop if user closed popup manually
      if (popupRef.current?.closed) { stopPolling(); return; }

      try {
        const status = await apiFetch<{ google: { connected: boolean } }>("/api/auth/status");
        if (status.google?.connected) {
          stopPolling();
          popupRef.current?.close();
          queryClient.invalidateQueries({ queryKey: ["authStatus"] });
        }
      } catch { /* ignore transient errors during polling */ }
    }, 2000);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-base">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
      </div>
    );
  }

  if (!auth?.google?.connected) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-base">
        <div className="flex flex-col items-center gap-4 bg-surface-raised rounded-2xl shadow-sm border border-surface-border px-10 py-10">
          <h1 className="font-display font-bold text-xl text-text-base">FlowDocs</h1>
          <p className="text-text-muted text-sm">Connect your Google Calendar to get started.</p>
          <button
            onClick={handleConnect}
            className="mt-2 px-5 py-2.5 bg-accent-primary hover:bg-accent-secondary text-white rounded-lg font-medium text-sm transition-colors"
          >
            Connect Google Calendar
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
