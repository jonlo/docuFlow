import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import type { CalendarEvent, CreateLabelBody, Label, Task } from "@flowdocs/shared";

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation<Label, Error, CreateLabelBody>({
    mutationFn: (body) =>
      apiFetch<Label>("/api/labels", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labels"] }),
  });
}

export function useUpdateLabel() {
  const qc = useQueryClient();
  return useMutation<Label, Error, { id: string; color?: string; name?: string }>({
    mutationFn: ({ id, ...body }) =>
      apiFetch<Label>(`/api/labels/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labels"] });
      qc.invalidateQueries({ queryKey: ["calendarEvents"] });
    },
  });
}

export function useDeleteLabel() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const BASE = import.meta.env["VITE_API_URL"] ?? "";
      const res = await fetch(`${BASE}/api/labels/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error: string }).error);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["labels"] });
      qc.invalidateQueries({ queryKey: ["calendarEvents"] });
    },
  });
}

export function useSetEventLabels() {
  const qc = useQueryClient();
  return useMutation<CalendarEvent, Error, { eventId: string; labelIds: string[] }>({
    mutationFn: ({ eventId, labelIds }) =>
      apiFetch<CalendarEvent>(`/api/events/${eventId}/labels`, {
        method: "PUT",
        body: JSON.stringify({ labelIds }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendarEvents"] }),
  });
}

export function useSetTaskLabels() {
  const qc = useQueryClient();
  return useMutation<Task, Error, { taskId: string; labelIds: string[] }>({
    mutationFn: ({ taskId, labelIds }) =>
      apiFetch<Task>(`/api/tasks/${taskId}/labels`, {
        method: "PUT",
        body: JSON.stringify({ labelIds }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
