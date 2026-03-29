import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import type { AuthStatus, CalendarEvent } from "@flowdocs/shared";

export function useAuthStatus(): ReturnType<typeof useQuery<AuthStatus>> {
  return useQuery<AuthStatus>({
    queryKey: ["authStatus"],
    queryFn:  () => apiFetch<AuthStatus>("/api/auth/status"),
    staleTime: 1000 * 60,
  });
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
