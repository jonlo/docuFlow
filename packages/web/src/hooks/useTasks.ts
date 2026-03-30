import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import type { Task, TaskStatus } from "@flowdocs/shared";

export function useTasks(options?: { status?: TaskStatus }): ReturnType<typeof useQuery<Task[]>> {
  const statusParam = options?.status;
  const url = statusParam ? `/api/tasks?status=${statusParam}` : "/api/tasks";
  return useQuery<Task[]>({
    queryKey: statusParam ? ["tasks", statusParam] : ["tasks"],
    queryFn:  () => apiFetch<Task[]>(url),
    staleTime: 30_000,
  });
}
