import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/api";
import { useAppStore } from "@/stores/appStore";
import type { Document } from "@flowdocs/shared";

export function useNotionSearch(query: string): ReturnType<typeof useQuery<Document[]>> {
  const getIntegration = useAppStore((s) => s.getIntegration);
  const notion = getIntegration("notion");

  return useQuery<Document[]>({
    queryKey: ["notionSearch", query],
    queryFn: () =>
      apiFetch<Document[]>(`/api/documents/search?provider=notion&query=${encodeURIComponent(query)}`),
    enabled: !!notion?.connected && query.length > 1,
    staleTime: 1000 * 30,
  });
}
