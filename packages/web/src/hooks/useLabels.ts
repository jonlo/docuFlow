import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import type { Label } from "@flowdocs/shared";

export function useLabels() {
  return useQuery<Label[]>({
    queryKey: ["labels"],
    queryFn: () => apiFetch<Label[]>("/api/labels"),
    staleTime: 1000 * 60 * 5,
  });
}
