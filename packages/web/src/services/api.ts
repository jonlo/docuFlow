const BASE = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText, code: "UNKNOWN" }));
    throw new Error((err as { error: string }).error);
  }

  return res.json() as Promise<T>;
}
