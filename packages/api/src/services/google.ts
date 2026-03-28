import type { CalendarEvent, CalendarList } from "@flowdocs/shared";

export function buildGoogleAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.statusText}`);
  const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Date.now() + data.expires_in * 1000 };
}

export async function getGoogleUserInfo(accessToken: string): Promise<{ email: string; name: string; picture?: string; sub: string }> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch user info");
  return res.json() as Promise<{ email: string; name: string; picture?: string; sub: string }>;
}

export async function fetchCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  calendarId = "primary"
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({ timeMin, timeMax, singleEvents: "true", orderBy: "startTime", maxResults: "250" });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Calendar fetch failed: ${res.statusText}`);
  const data = await res.json() as { items: unknown[] };
  return (data.items ?? []).map((item) => mapGoogleEvent(item, calendarId));
}

export async function fetchCalendarList(accessToken: string): Promise<CalendarList[]> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Calendar list failed");
  const data = await res.json() as { items: unknown[] };
  return (data.items ?? []).map((c: unknown) => {
    const cal = c as Record<string, string>;
    return { id: cal["id"] ?? "", summary: cal["summary"] ?? "", backgroundColor: cal["backgroundColor"], primary: cal["primary"] === "true" };
  });
}

function mapGoogleEvent(item: unknown, calendarId: string): CalendarEvent {
  const e = item as Record<string, unknown>;
  const start = e["start"] as Record<string, string>;
  const end   = e["end"]   as Record<string, string>;
  const allDay = !!start["date"];
  return {
    id: e["id"] as string,
    googleEventId: e["id"] as string,
    calendarId,
    title: (e["summary"] as string) ?? "(No title)",
    description: e["description"] as string | undefined,
    start: allDay ? start["date"]! : start["dateTime"]!,
    end:   allDay ? end["date"]!   : end["dateTime"]!,
    allDay,
    htmlLink: e["htmlLink"] as string | undefined,
    colorId: e["colorId"] as string | undefined,
  };
}
