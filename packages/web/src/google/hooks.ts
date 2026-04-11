import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import { useAppStore } from "@/stores/appStore";
import type { AuthStatus, CalendarEvent } from "@flowdocs/shared";

export function useAuthStatus(): ReturnType<typeof useQuery<AuthStatus>> {
  const setAuthStatus = useAppStore((s) => s.setAuthStatus);
  const query = useQuery<AuthStatus>({
    queryKey: ["authStatus"],
    queryFn:  () => apiFetch<AuthStatus>("/api/auth/status"),
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (query.data) setAuthStatus(query.data);
  }, [query.data, setAuthStatus]);

  return query;
}

export function useCalendarEvents(): ReturnType<typeof useQuery<CalendarEvent[]>> {
  const { data: auth } = useAuthStatus();
  return useQuery<CalendarEvent[]>({
    queryKey: ["calendarEvents"],
    queryFn:  () => apiFetch<CalendarEvent[]>("/api/events"),
    enabled:  !!auth?.google?.connected,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });
}
