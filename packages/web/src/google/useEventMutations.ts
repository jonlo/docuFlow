import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import type { CalendarEvent, CreateEventBody, UpdateEventBody } from "@flowdocs/shared";

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation<CalendarEvent, Error, CreateEventBody>({
    mutationFn: (body) =>
      apiFetch<CalendarEvent>("/api/events", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendarEvents"] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation<CalendarEvent, Error, { id: string; body: UpdateEventBody }>({
    mutationFn: ({ id, body }) =>
      apiFetch<CalendarEvent>(`/api/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendarEvents"] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const BASE = import.meta.env["VITE_API_URL"] ?? "";
      const res = await fetch(`${BASE}/api/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error: string }).error);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendarEvents"] }),
  });
}
