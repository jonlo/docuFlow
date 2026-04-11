import { useQuery } from "@tanstack/react-query";

export interface ConfluenceSearchResult {
  id: string;
  title: string;
  url: string;
}

const BASE = import.meta.env["VITE_API_URL"] ?? "";

async function fetchConfluenceSearch(query: string): Promise<ConfluenceSearchResult[]> {
  const res = await fetch(`${BASE}/api/confluence/search?q=${encodeURIComponent(query)}`, {
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

  return res.json() as Promise<ConfluenceSearchResult[]>;
}

export function useConfluenceSearch(query: string) {
  return useQuery<ConfluenceSearchResult[], Error & { code?: string }>({
    queryKey: ["confluence-search", query],
    queryFn: () => fetchConfluenceSearch(query),
    enabled: query.length >= 2,
    staleTime: 60_000,
    retry: false,
  });
}
