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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!auth?.google?.connected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-semibold text-zinc-100">FlowDocs</h1>
        <p className="text-zinc-400">Connect your Google Calendar to get started.</p>
        <button
          onClick={handleConnect}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
        >
          Connect Google Calendar
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
