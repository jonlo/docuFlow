import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import { useAppStore } from "@/stores/appStore";
import type { CalendarEvent } from "@flowdocs/shared";

export function useCalendarEvents(timeMin: string, timeMax: string): ReturnType<typeof useQuery<CalendarEvent[]>> {
  const getIntegration = useAppStore((s) => s.getIntegration);
  const google = getIntegration("google");

  return useQuery<CalendarEvent[]>({
    queryKey: ["calendarEvents", timeMin, timeMax],
    queryFn: () =>
      apiFetch<CalendarEvent[]>(`/api/calendar/events?timeMin=${timeMin}&timeMax=${timeMax}`),
    enabled: !!google?.connected,
    placeholderData: (prev) => prev,
  });
}
