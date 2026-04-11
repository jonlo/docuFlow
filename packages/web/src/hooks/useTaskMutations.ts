import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import type { CreateTaskBody, Document, Task, UpdateTaskBody } from "@flowdocs/shared";

export interface SearchableDocument {
  id: string;
  title: string;
  url: string;
}

function invalidateTasks(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["tasks"] });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation<Task, Error, CreateTaskBody>({
    mutationFn: (body) => apiFetch<Task>("/api/tasks", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => invalidateTasks(qc),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation<Task, Error, { id: string; body: Partial<UpdateTaskBody> }>({
    mutationFn: ({ id, body }) =>
      apiFetch<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => invalidateTasks(qc),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const BASE = import.meta.env["VITE_API_URL"] ?? "";
      const res  = await fetch(`${BASE}/api/tasks/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error: string }).error);
      }
    },
    onSuccess: () => invalidateTasks(qc),
  });
}

export function useStartTimer() {
  const qc = useQueryClient();
  return useMutation<Task, Error, string>({
    mutationFn: (taskId) =>
      apiFetch<Task>(`/api/tasks/${taskId}/sessions`, { method: "POST", body: "{}" }),
    onSuccess: () => invalidateTasks(qc),
  });
}

export function usePauseTimer() {
  const qc = useQueryClient();
  return useMutation<Task, Error, { taskId: string; sessionId: string }>({
    mutationFn: ({ taskId, sessionId }) =>
      apiFetch<Task>(`/api/tasks/${taskId}/sessions/${sessionId}`, { method: "PATCH", body: "{}" }),
    onSuccess: () => invalidateTasks(qc),
  });
}

export function useAttachDocument() {
  const qc = useQueryClient();
  return useMutation<Task, Error, {
    taskId: string;
    provider: Document["provider"];
    doc: SearchableDocument;
  }>({
    mutationFn: ({ taskId, provider, doc }) =>
      apiFetch<Task>(`/api/tasks/${taskId}/documents`, {
        method: "POST",
        body: JSON.stringify({ provider, providerDocId: doc.id, title: doc.title, url: doc.url }),
      }),
    onSuccess: () => invalidateTasks(qc),
  });
}

export function useDetachDocument() {
  const qc = useQueryClient();
  return useMutation<void, Error, { taskId: string; documentId: string }>({
    mutationFn: async ({ taskId, documentId }) => {
      const BASE = import.meta.env["VITE_API_URL"] ?? "";
      const res  = await fetch(`${BASE}/api/tasks/${taskId}/documents/${documentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error: string }).error);
      }
    },
    onSuccess: () => invalidateTasks(qc),
  });
}
