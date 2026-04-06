import { useQuery } from "@tanstack/react-query";

export interface NotionSearchResult {
  id: string;
  title: string;
  url: string;
}

const BASE = import.meta.env["VITE_API_URL"] ?? "";

async function fetchNotionSearch(query: string): Promise<NotionSearchResult[]> {
  const res = await fetch(`${BASE}/api/notion/search?q=${encodeURIComponent(query)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ code: "UNKNOWN", error: res.statusText })) as {
      code?: string;
      error?: string;
    };
    const err = new Error(body.error ?? res.statusText) as Error & { code: string };
    err.code = body.code ?? "UNKNOWN";
    throw err;
  }
  return res.json() as Promise<NotionSearchResult[]>;
}

export function useNotionSearch(query: string) {
  return useQuery<NotionSearchResult[], Error & { code?: string }>({
    queryKey: ["notion-search", query],
    queryFn: () => fetchNotionSearch(query),
    enabled: query.length >= 2,
    staleTime: 60_000,
    retry: false,
  });
}
